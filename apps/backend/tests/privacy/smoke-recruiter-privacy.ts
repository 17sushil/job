/** Opt-in real DB/API test. Creates and removes its own UUID-tagged fixtures. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { AppDataSource } from '../../src/database/data-source.js';
import { app } from '../../src/app.js';
import { User, UserRole } from '../../src/modules/user/user.entity.js';
import { Job } from '../../src/modules/job/job.entity.js';
import { Application } from '../../src/modules/application/application.entity.js';
import { ProfileView } from '../../src/modules/candidate/profile-view.entity.js';
import { signSession } from '../../src/modules/auth/auth.service.js';
import { candidateAlias } from '../../src/common/crypto/contact-token.js';

async function main() {
  await AppDataSource.initialize();
  const users = AppDataSource.getRepository(User),
    jobs = AppDataSource.getRepository(Job),
    applications = AppDataSource.getRepository(Application);
  const ids = Array.from({ length: 55 }, () => randomUUID());
  const [candidateId, recruiterId, otherRecruiterId, adminId] = ids;
  const name = `Privacy Canary ${candidateId.slice(0, 8)}`;
  const email = `private-${candidateId}@example.invalid`;
  const phone = '+9779803555210';
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText(`${name} ${email} ${phone}`);
  const original = Buffer.from(await pdf.save());
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const api = axios.create({
    baseURL: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    validateStatus: () => true,
  });
  let jobIds: string[] = [];
  try {
    const profile = {
      raw_resume_data: {
        basics: {
          name,
          email,
          phone,
          summary: `${name} builds reliable systems; email ${email}.`,
          profiles: [{ url: 'https://linkedin.com/in/private-canary' }],
        },
        work: [
          {
            position: 'Engineer',
            name: 'Example Systems',
            highlights: [`${name} built TypeScript APIs`],
          },
        ],
        skills: [{ keywords: ['TypeScript', 'SQL'] }],
        education: [{ institution: 'Example University', area: 'Computing' }],
      },
    };
    const fixtures = await users.save(
      ids.map((id, index) =>
        users.create({
          userId: id,
          role:
            index === 1 || index === 2
              ? UserRole.RECRUITER
              : index === 3
                ? UserRole.ADMIN
                : UserRole.CANDIDATE,
          name: index === 0 ? name : `Privacy fixture ${index}`,
          companyName: index === 1 ? 'Recruiter One Company' : null,
          mobile: index === 0 ? phone : `privacy-${id}`,
          email: index === 0 ? email : `privacy-${id}@example.invalid`,
          password: 'not-a-login-hash',
          resumeFileName: index === 0 ? `${name}.pdf` : null,
          resumePdf: index === 0 ? original : null,
          parsedProfile: index === 0 ? profile : null,
        }),
      ),
    );
    const madeJobs = await jobs.save(
      [1, 2].map((i) =>
        jobs.create({
          title: 'TypeScript Engineer',
          company: `Company ${i}`,
          postedBy: ids[i],
          source: 'recruiter',
          status: 'open',
        }),
      ),
    );
    jobIds = madeJobs.map((job) => job.id);
    const apps = await applications.save(
      madeJobs.map((job) =>
        applications.create({ candidateId, jobId: job.id }),
      ),
    );
    const sessions = fixtures.map(signSession);
    const csrfResponse = await api.get('/api/auth/csrf');
    const csrfCookie = csrfResponse.headers['set-cookie']![0].split(';')[0];
    const headers = (i: number) => ({
      Cookie: `${csrfCookie}; jobdev_token=${sessions[i]}`,
      'X-CSRF-Token': csrfResponse.data.data.csrfToken,
      Origin: 'http://localhost:3000',
    });
    const get = (url: string, i = 1) => api.get(url, { headers: headers(i) });
    const post = (url: string, i = 1, body = {}) =>
      api.post(url, body, { headers: headers(i) });
    const assertPrivate = (value: unknown) => {
      const text = JSON.stringify(value).toLowerCase();
      for (const secret of [
        name,
        email,
        phone,
        'private-canary',
        `${name}.pdf`,
      ])
        assert(
          !text.includes(secret.toLowerCase()),
          'Recruiter response contains private candidate data',
        );
    };
    assert.equal((await api.get('/api/applicants')).status, 401);
    assert.equal((await get('/api/applicants', 0)).status, 403);
    assert.equal(
      (await get(`/api/applicants/${apps[1].applicationId}`)).status,
      404,
    );
    assert.equal(
      (await get(`/api/applicants/${apps[1].applicationId}/resume/pdf`)).status,
      404,
    );
    assert.equal((await get('/api/applicants/not-a-uuid')).status, 400);
    assert.equal((await get('/api/applicants?jobId=invalid')).status, 400);
    for (const route of [
      '/api/applicants',
      '/api/applications/recruiter',
      '/api/candidates',
      `/api/candidates/${candidateId}`,
      `/api/applicants/${apps[0].applicationId}`,
      `/api/applicants/${apps[0].applicationId}/resume`,
    ]) {
      const response = await get(route);
      assert.equal(response.status, 200, route);
      assertPrivate(response.data);
    }
    const directory = (await get('/api/applicants')).data.data.applicants;
    assert(directory.length >= 52, 'No 50-profile directory cap');
    assert(directory.some((row: { kind: string }) => row.kind === 'candidate'));
    assert(
      !directory.some(
        (row: { id: string }) => row.id === apps[1].applicationId,
      ),
    );
    assert.equal(
      await AppDataSource.getRepository(ProfileView).countBy({ recruiterId }),
      0,
      'GET reads must not write tracking',
    );
    const owner = (await get('/api/auth/resume', 0)).data.data.resume;
    assert.equal(owner.dataBase64, original.toString('base64'));
    assert(JSON.stringify(owner).includes(email));
    assert.equal(
      (await get(`/api/candidates/${candidateId}`, 3)).data.data.candidate.name,
      name,
    );
    const artifactDir = process.env.PRIVACY_PDF_TEST_DIR;
    if (artifactDir) mkdirSync(artifactDir, { recursive: true });
    for (const [index, route] of [
      `/api/applicants/${apps[0].applicationId}/resume/pdf`,
      `/api/candidates/${candidateId}/resume`,
    ].entries()) {
      const response = await api.get(route, {
        headers: headers(1),
        responseType: 'arraybuffer',
      });
      assert.equal(response.status, 200);
      const bytes = Buffer.from(response.data);
      const document = await PDFDocument.load(bytes);
      assert.notDeepEqual(bytes, original);
      assertPrivate({
        title: document.getTitle(),
        disposition: response.headers['content-disposition'],
      });
      assert.equal(
        document.getTitle(),
        `${candidateAlias(candidateId)} — JobDev resume`,
      );
      if (artifactDir)
        writeFileSync(`${artifactDir}/recruiter-${index}.pdf`, bytes);
    }
    const targets = [candidateId, ...ids.slice(4)];
    for (const id of targets)
      assert.equal((await post(`/api/candidates/${id}/views`)).status, 200);
    assert.equal(targets.length, 52);
    assert.equal(
      (await get('/api/candidates/views')).data.data.totalViews,
      52,
      'No 50-profile viewing quota',
    );
    await post(`/api/candidates/${candidateId}/views`);
    assert.equal(
      (await get('/api/candidates/views')).data.data.totalViews,
      52,
      'Repeat view remains unique',
    );
    assertPrivate((await get('/api/candidates/views')).data);
    const ownHistory = (
      await get(`/api/candidates/views/me?candidateId=${ids[4]}`, 0)
    ).data.data;
    assert.equal(ownHistory.totalViews, 1);
    assert.equal(ownHistory.views[0].recruiterId, recruiterId);
    assert.equal(ownHistory.views[0].companyName, 'Recruiter One Company');
    assert.equal((await get('/api/candidates/views/me', 1)).status, 403);
    await users.update(candidateId, { isDeleted: true });
    for (const route of [
      `/api/applicants/${apps[0].applicationId}`,
      `/api/candidates/${candidateId}/resume`,
    ])
      assert.equal((await get(route)).status, 404);
    assert.equal((await get('/api/candidates/views')).data.data.totalViews, 51);
    console.log(
      'PASS privacy API: masked new/legacy JSON and PDFs; owner originals unchanged; application ownership; deleted-account guards; read-only GET; candidate who-viewed-me isolation; 52 unique profile views without quota.',
    );
  } finally {
    if (jobIds.length) {
      for (const jobId of jobIds) await applications.delete({ jobId });
      await jobs.delete(jobIds);
    }
    await users.delete(ids);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await AppDataSource.destroy();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

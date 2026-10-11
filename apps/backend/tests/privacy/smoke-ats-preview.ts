/** Opt-in DB/API test; the remote ATS transport is mocked, not claimed live. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import { serviceHttp } from '../../src/common/http.js';
import { env } from '../../src/config/env.js';
import { AppDataSource } from '../../src/database/data-source.js';
import { app } from '../../src/app.js';
import { User, UserRole } from '../../src/modules/user/user.entity.js';
import { signSession } from '../../src/modules/auth/auth.service.js';

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User),
    id = randomUUID();
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const api = axios.create({
    baseURL: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    validateStatus: () => true,
  });
  const oldAdapter = serviceHttp.defaults.adapter,
    oldKey = env.ATS_API_KEY;
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText('Clean owner PDF');
  pdf.addPage();
  const bytes = Buffer.from(await pdf.save());
  let mode: 'valid' | 'invalid-pdf' | 'invalid-json' = 'valid';
  env.ATS_API_KEY = 'integration-test-only';
  serviceHttp.defaults.adapter = async (config) => {
    const form = config.data as FormData;
    assert.equal(
      (form.get('file') as File).type,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    const isPdf = config.url!.endsWith('/pdf');
    if (isPdf) assert.equal(form.get('no_watermark'), 'true');
    const data = isPdf
      ? mode === 'invalid-pdf'
        ? Buffer.from('%PDF-not-a-document')
        : bytes
      : Buffer.from(
          JSON.stringify(
            mode === 'invalid-json'
              ? []
              : {
                  basics: {
                    name: 'Extracted Owner Name',
                    email: 'do-not-replace@example.invalid',
                    phone: '9999999999',
                  },
                  skills: ['TypeScript'],
                },
          ),
        );
    return { config, status: 200, statusText: 'OK', headers: {}, data };
  };
  try {
    const email = `ats-${id}@example.invalid`,
      mobile = `ats-${id}`;
    const user = await repo.save(
      repo.create({
        userId: id,
        role: UserRole.CANDIDATE,
        name: 'Original Name',
        email,
        mobile,
        password: 'not-a-login-hash',
      }),
    );
    const csrf = await api.get('/api/auth/csrf');
    const headers = {
      Cookie: `${csrf.headers['set-cookie']![0].split(';')[0]}; jobdev_token=${signSession(user)}`,
      'X-CSRF-Token': csrf.data.data.csrfToken,
    };
    const upload = () =>
      api.post(
        '/api/auth/resume',
        {
          fileName: 'owner.docx',
          dataBase64: Buffer.from('DOCX transport fixture').toString('base64'),
        },
        { headers },
      );
    let response = await upload();
    assert.equal(response.status, 200);
    assert.equal(response.data.data.atsPdfPages, 2);
    let stored = await repo.findOneByOrFail({ userId: id });
    assert.deepEqual(stored.resumePdf, bytes);
    assert.equal(stored.email, email);
    assert.equal(stored.mobile, mobile);
    assert.equal(stored.name, 'Extracted Owner Name');
    const saved = (await api.get('/api/auth/resume', { headers })).data.data
      .resume;
    assert.equal(saved.fileName, 'owner.pdf');
    assert.equal(saved.atsPdfPages, 2);
    assert.equal(saved.dataBase64, bytes.toString('base64'));
    mode = 'invalid-pdf';
    response = await upload();
    assert.equal(response.status, 200);
    assert.equal(response.data.data.atsPdfBase64, null);
    assert.equal((await repo.findOneByOrFail({ userId: id })).resumePdf, null);
    mode = 'invalid-json';
    response = await upload();
    assert.equal(response.status, 200);
    assert(response.data.data.atsError);
    stored = await repo.findOneByOrFail({ userId: id });
    assert.equal(stored.parsedProfile, null);
    console.log(
      'PASS mocked ATS + real owner API: DOCX MIME, clean-PDF request, validated two-page preview recovery, invalid PDF/JSON fallback, name update without replacing existing email/mobile.',
    );
  } finally {
    serviceHttp.defaults.adapter = oldAdapter;
    env.ATS_API_KEY = oldKey;
    await repo.delete(id);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await AppDataSource.destroy();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

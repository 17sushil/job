import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { User, UserRole } from '../../src/modules/user/user.entity.js';
import {
  toApplicantPayload,
  toRecruiterCandidate,
} from '../../src/modules/applicant/applicant.serializer.js';
import { renderApplicantPdf } from '../../src/modules/applicant/resume-pdf.js';
import {
  candidateAlias,
  contactTokenShort,
  redactIdentity,
} from '../../src/common/crypto/contact-token.js';

function candidate(parsedProfile: unknown = {}): User {
  return Object.assign(new User(), {
    userId: '8c3dedc4-dd10-44b8-87a6-f04a31bb59c1',
    role: UserRole.CANDIDATE,
    name: 'Lila Karki',
    email: 'lila.private@example.invalid',
    mobile: '+977 9803555210',
    avatar: 'private-image-data',
    resumeFileName: 'Lila_Karki_private.pdf',
    parsedProfile,
  });
}
const privateValues = [
  'Lila Karki',
  'lila.private@example.invalid',
  '9803555210',
  'Lila_Karki_private.pdf',
  'private-image-data',
];
function noIdentity(value: unknown, more: string[] = []) {
  const wire = JSON.stringify(value).toLowerCase();
  for (const secret of [...privateValues, ...more])
    expect(wire).not.toContain(secret.toLowerCase());
}

describe('recruiter identity boundary', () => {
  it('uses an allowlisted DTO, masks account fields and preserves screening facts', () => {
    const source = candidate({
      raw_resume_data: {
        basics: {
          name: 'Lila Karki',
          email: 'lila.private@example.invalid',
          phone: '+977 9803555210',
          summary:
            'Lila Karki builds software; contact lila.private@example.invalid',
          location: { city: 'Kathmandu', address: 'Private Street 123' },
        },
        work: [
          {
            position: 'Engineer',
            name: 'Example Software',
            highlights: ['Lila Karki built a TypeScript API'],
          },
        ],
        skills: [{ name: 'Languages', keywords: ['TypeScript', 'SQL'] }],
        photo: 'private-image-data',
        metadata: 'private metadata secret',
      },
    });
    const ownerBefore = JSON.stringify(source);
    const safe = toRecruiterCandidate(source);
    noIdentity(safe, ['Private Street 123', 'private metadata secret']);
    expect(safe.name).toBe(candidateAlias(source.userId));
    expect(safe.location).toBe('Kathmandu');
    expect(safe.resume.skills).toContain('TypeScript');
    expect(safe.resume.experience[0].company).toBe('Example Software');
    expect(safe.contact.email.token).toMatch(/^[0-9a-f]{24}$/);
    expect(safe).not.toHaveProperty('parsedProfile');
    expect(safe).not.toHaveProperty('avatar');
    expect(JSON.stringify(source)).toBe(ownerBefore);
  });
  it('handles multiply wrapped/stringified JSON, variant identity keys and contact prose', () => {
    const safe = toRecruiterCandidate(
      candidate(
        JSON.stringify(
          JSON.stringify({
            data: {
              raw_resume_data: {
                fullName: 'Other Private Name',
                summary:
                  'Other Private Name and Lila Karki: linkedin.com/in/private-id or +977 9803 555 210',
                skills: ['TypeScript'],
                personal: {
                  firstName: 'SecretGiven',
                  lastName: 'SecretFamily',
                },
                projects: ['Built an API with SecretGiven SecretFamily'],
              },
            },
          }),
        ),
      ),
    );
    noIdentity(safe, [
      'Other Private Name',
      'private-id',
      '9803 555 210',
      'SecretGiven',
      'SecretFamily',
    ]);
    expect(safe.resume.skills).toContain('TypeScript');
  });
  it('uses the latest saved canvas text while withholding images and hidden objects', () => {
    const source = candidate({ summary: 'Stale summary' });
    source.resumeCanvas = {
      pages: [
        {
          objects: [
            { type: 'text', x: 1, y: 1, text: 'Fresh Private Name' },
            {
              type: 'text',
              x: 1,
              y: 20,
              text: 'Fresh Private Name built the latest Rust API. Email lila.private@example.invalid',
            },
            {
              type: 'text',
              x: 1,
              y: 40,
              hidden: true,
              text: 'hidden-object-secret',
            },
            { type: 'image', x: 1, y: 60, src: 'private-image-data' },
          ],
        },
      ],
      assets: {},
    };
    const safe = toRecruiterCandidate(source);
    noIdentity(safe, ['Fresh Private Name', 'hidden-object-secret']);
    expect(JSON.stringify(safe.resume)).toContain('latest Rust API');
    expect(JSON.stringify(safe.resume)).not.toContain('Stale summary');
  });
  it('does not invent an application for directory-only candidates', () => {
    const row = toApplicantPayload(null, candidate({ skills: ['SQL'] }), null);
    expect(row.kind).toBe('candidate');
    expect(row.appliedAt).toBeNull();
    expect(row.job).toBeNull();
    noIdentity(row);
  });
  it('supports missing resumes without exposing identity', () => {
    const source = candidate(null);
    source.resumeFileName = null;
    const safe = toRecruiterCandidate(source);
    expect(safe.hasResume).toBe(false);
    noIdentity(safe);
  });
  it('redacts case/whitespace variants without removing names from inside other words', () => {
    expect(
      redactIdentity('LILA   KARKI writes annual reports; Ann reviews.', [
        'Lila Karki',
        'Ann',
      ]),
    ).toBe(
      '[hidden identity] writes annual reports; [hidden identity] reviews.',
    );
    expect(redactIdentity('2021-2022, 75%, 3 engineers', [])).toBe(
      '2021-2022, 75%, 3 engineers',
    );
  });
  it('keeps edited canvas pages in document order', () => {
    const source = candidate(null);
    source.resumeCanvas = {
      pages: [
        {
          objects: [
            { type: 'text', text: 'Lila Karki', y: 80 },
            { type: 'text', text: 'FIRST PAGE CONTENT', y: 120 },
          ],
        },
        { objects: [{ type: 'text', text: 'SECOND PAGE CONTENT', y: 0 }] },
      ],
      assets: {},
    };
    const safe = toRecruiterCandidate(source);
    noIdentity(safe);
    const body = JSON.stringify(safe.resume);
    expect(body.indexOf('FIRST PAGE CONTENT')).toBeLessThan(
      body.indexOf('SECOND PAGE CONTENT'),
    );
  });
  it('uses keyed, stable, non-plaintext contact tokens', () => {
    expect(contactTokenShort(' Test@Example.com ')).toBe(
      contactTokenShort('test@example.com'),
    );
    expect(contactTokenShort('other@example.com')).not.toBe(
      contactTokenShort('test@example.com'),
    );
  });
  it('renders a fresh anonymized PDF, including Unicode CV text, with safe metadata', async () => {
    const source = candidate({
      basics: { name: 'Lila Karki', summary: 'इन्जिनियर · TypeScript' },
      skills: ['SQL'],
    });
    const safe = toApplicantPayload(null, source, null);
    noIdentity(safe);
    const bytes = await renderApplicantPdf(safe, 'Recruiter view');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
    expect(pdf.getTitle()).toContain(candidateAlias(source.userId));
    expect(pdf.getTitle()).not.toContain('Lila');
  });
});

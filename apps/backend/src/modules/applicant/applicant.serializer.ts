import type { Application } from '../application/application.entity.js';
import type { Job } from '../job/job.entity.js';
import type { User } from '../user/user.entity.js';
import {
  contactSummary,
  candidateAlias,
  redactIdentity,
  collectContact,
  maskContactFields,
  redactContactTextDeep,
  type MaskedContact,
} from '../../common/crypto/contact-token.js';

/**
 * What a recruiter receives about one applicant.
 *
 * The rule this file exists to enforce: **contact fields are shown, their
 * values are not.** Email / phone / LinkedIn arrive as keyed digests, and the
 * raw values never leave the server — masking in the browser protects nothing,
 * because the browser already has whatever the network handed it.
 */

export type ResumeLine = { heading: string; lines: string[] };

export type ResumeView = {
  name: string;
  headline: string;
  summary: string;
  experience: Array<{ role: string; company: string; period: string; details: string[] }>;
  education: string[];
  skills: string[];
  /** Everything else the parser found, kept as headed lines. */
  sections: ResumeLine[];
};

export type ApplicantPayload = {
  id: string;
  status: string;
  appliedAt: string | null;
  kind: 'application' | 'candidate';
  match: number;
  job: { id: string; title: string; company: string; location: string | null } | null;
  candidate: {
    id: string;
    name: string;
    location: string | null;
    contactMode: 'blurred';
    contact: MaskedContact;
    resumeFileName: string | null;
    resumeUploadedAt: string | null;
    hasResume: boolean;
    resume: ResumeView;
  };
};

/* ------------------------------------------------------------------ helpers */

const text = (value: unknown): string =>
  typeof value === 'string'
    ? value.trim()
    : typeof value === 'number'
      ? String(value)
      : '';

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** `{ resume: { … } }`, `{ data: { … } }`, `{ raw_resume_data: { … } }` … */
const ENVELOPES = ['resume', 'data', 'result', 'parsed', 'document', 'profile', 'output', 'payload', 'raw_resume_data', 'resume_data', 'response', 'content'];

function inner(parsed: Record<string, unknown>): Record<string, unknown> {
  let current = parsed;
  for (let depth = 0; depth < 6; depth++) {
    const child = ENVELOPES.map(key => object(decodeJson(current[key]))).find(value => Object.keys(value).length);
    if (!child) break;
    current = child;
  }
  return current;
}

const firstOf = (source: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = text(source[key]);
    if (value) return value;
  }
  return '';
};

const listOf = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === 'string' && item.trim()) return [item.trim()];
      if (item && typeof item === 'object') {
        const record = object(item);
        const line = firstOf(record, ['text', 'detail', 'description', 'bullet', 'name', 'value']);
        return line ? [line] : [];
      }
      return [];
    });
  }
  const single = text(value);
  return single ? single.split(/\s*[|•·]\s*/).filter(Boolean) : [];
};

/** The column is jsonb today, but rows written by older code hold a JSON
 *  *string* (occasionally stringified twice). Decode through strings so both
 *  shapes render identically instead of coming out blank. */
function decodeJson(value: unknown): unknown {
  let current = value;
  for (let step = 0; step < 3 && typeof current === 'string'; step += 1) {
    const trimmed = current.trim();
    if (!trimmed || !'{["'.includes(trimmed[0])) break;
    try {
      current = JSON.parse(trimmed);
    } catch {
      break;
    }
  }
  return current;
}

/**
 * Rows saved by the OLD editor hold their canvas (`{ pages: [...] }`) as the
 * parsed profile. There is no semantic structure to recover, so the text runs
 * are replayed in reading order — an old row shows its content instead of a
 * blank sheet with junk headings.
 */
function canvasTextLines(payload: Record<string, unknown>): string[] {
  const runs: Array<{ pageIndex: number; y: number; x: number; size: number; text: string }> = [];
  for (const [pageIndex, page] of array(payload.pages).entries()) {
    for (const item of array(object(page).objects)) {
      const run = object(item);
      if ((run.type && run.type !== 'text') || typeof run.text !== 'string' || run.hidden) continue;
      const line = text(run.text);
      if (!line) continue;
      runs.push({
        pageIndex,
        y: Number(run.y ?? 0),
        x: Number(run.x ?? 0),
        size: Number(object(run.style).size ?? 0),
        text: line,
      });
    }
  }
  runs.sort((a, b) => a.pageIndex - b.pageIndex || a.y - b.y || a.x - b.x);
  return runs.map((run) => run.text);
}

/* ------------------------------------------------------------------- resume */

/**
 * Turns the parsed-resume JSON into the recruiter's read-only view: the CV's
 * content stays, every contact value inside it is tokenised first.
 */
export function buildResumeView(parsedProfile: unknown): ResumeView {
  const root = inner(object(decodeJson(parsedProfile)));

  /* Legacy canvas row: replay its text instead of inventing sections. */
  const canvasLines = canvasTextLines(root);
  if (canvasLines.length) {
    const [firstLine, ...rest] = canvasLines;
    const sweptName = redactContactTextDeep(firstLine) as string;
    const sweptLines = redactContactTextDeep(rest.length ? rest : canvasLines) as string[];
    return {
      name: sweptName,
      headline: '',
      summary: '',
      experience: [],
      education: [],
      skills: [],
      sections: [{ heading: 'Saved resume', lines: sweptLines }],
    };
  }

  const basics = (() => {
    const direct = object(root.basics);
    return Object.keys(direct).length ? direct : root;
  })();

  const name =
    firstOf(basics, ['name', 'full_name', 'fullName']) ||
    firstOf(root, ['candidate_name', 'name', 'full_name', 'fullName']);
  const headline =
    firstOf(basics, ['headline', 'title', 'label', 'role']) ||
    firstOf(root, ['headline', 'title', 'label']);
  const summary =
    firstOf(basics, ['summary', 'about', 'profile', 'objective']) ||
    firstOf(root, ['summary', 'about', 'profile', 'objective', 'professional_summary']);

  const workSource = [
    ...array(root.work),
    ...array(root.experience),
    ...array(root.work_experience),
    ...array(root.workExperience),
    ...array(root.employment),
    ...array(root.positions),
  ];
  const experience = workSource.map((item) => {
    const record = object(item);
    const company = firstOf(record, ['company', 'employer', 'organisation', 'organization', 'name']);
    const role = firstOf(record, ['role', 'position', 'title', 'job_title', 'designation']);
    const start = firstOf(record, ['start_date', 'startDate', 'from', 'start']);
    const end = firstOf(record, ['end_date', 'endDate', 'to', 'end']);
    const period =
      firstOf(record, ['period', 'dates', 'duration']) ||
      [start, end].filter(Boolean).join(' — ');
    const details = [
      ...listOf(record.highlights),
      ...listOf(record.bullets),
      ...listOf(record.achievements),
      ...listOf(record.details),
      ...listOf(record.description),
    ];
    return { role: role || company, company: company && role ? company : '', period, details };
  });

  const education = [
    ...listOf(root.education),
    ...array(root.education)
      .map((item) => {
        const record = object(item);
        const title = firstOf(record, ['degree', 'studyType', 'title', 'qualification']);
        const organisation = firstOf(record, ['institution', 'school', 'university', 'organisation', 'organization', 'name']);
        const year = firstOf(record, ['end_date', 'endDate', 'year', 'graduation_date']);
        return [title, organisation, year].filter(Boolean).join(' · ');
      })
      .filter(Boolean),
    ...listOf(root.qualifications),
  ];

  const skills = [
    ...listOf(root.skills),
    ...array(root.skills)
      .map((item) => {
        const record = object(item);
        return firstOf(record, ['name', 'skill', 'text']);
      })
      .filter(Boolean),
    ...array(root.skills).flatMap(item => listOf(object(item).keywords)),
    ...listOf(root.technical_skills),
    ...listOf(root.technologies),
  ];

  /* Headed sections for whatever else the parser produced. */
  const known = new Set([
    'basics', 'name', 'full_name', 'fullName', 'candidate_name', 'headline', 'title', 'label', 'role',
    'summary', 'about', 'profile', 'objective', 'professional_summary',
    'work', 'experience', 'work_experience', 'workExperience', 'employment', 'positions',
    'education', 'qualifications', 'skills', 'technical_skills', 'technologies', ...ENVELOPES,
    /* meta of our own saves — never resume content */
    'kind', 'version', 'app', 'savedAt', 'jobId', 'canvas', 'assets', 'pages', 'objects',
    'id', 'userId', 'fileName', 'uploadedAt', 'createdAt', 'updatedAt', 'meta',
    /* shown elsewhere (drawer / contact block) or withheld from this view */
    'location', 'city', 'country', 'region', 'address',
    'email', 'email_address', 'phone', 'mobile', 'phone_number', 'contact_number', 'contact',
    'linkedin', 'github', 'website', 'url', 'portfolio', 'links',
    'expectedSalary', 'noticePeriod', 'seniority', 'workModes', 'openToWork', 'avatar',
  ]);
  const sections: ResumeLine[] = [];
  const professional = new Set(['projects', 'certifications', 'certificates', 'languages', 'awards', 'publications', 'volunteer', 'volunteering', 'interests', 'achievements', 'training', 'courses', 'hobbies']);
  for (const [key, value] of Object.entries(root)) {
    if (known.has(key) || !professional.has(key.toLowerCase())) continue;
    const lines = listOf(value);
    if (!lines.length) continue;
    sections.push({ heading: key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()), lines });
  }

  /*
   * Two passes, because contact data hides in two places:
   *   1. under a key  — `email`, `phone`, `linkedin` … → keyed digest;
   *   2. inside a sentence — "reach me at x@y.com" → `[hidden email]`.
   * A CV written by hand has plenty of the second kind, so no string leaves
   * this function un-swept.
   */
  const withoutContacts = maskContactFields({ experience, education, skills, sections });
  const swept = redactContactTextDeep({
    headline,
    summary,
    sections: withoutContacts as {
      experience: ResumeView['experience'];
      education: string[];
      skills: string[];
      sections: ResumeLine[];
    },
  });

  /* The parser can repeat a skill (it appears in two CV sections); the sheet
     shows each one once. */
  const unique = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

  return {
    name,
    headline: swept.headline,
    summary: swept.summary,
    experience: swept.sections.experience,
    education: unique(swept.sections.education),
    skills: unique(swept.sections.skills),
    sections: swept.sections.sections.map((section) => ({ ...section, lines: unique(section.lines) })),
  };
}

/* ---------------------------------------------------------------- applicant */

export function toRecruiterCandidate(candidate: User): ApplicantPayload['candidate'] {
  const parsed = decodeJson(candidate.parsedProfile ?? null);
  // Latest edited canvas wins, even when external extraction was unavailable.
  const resume = buildResumeView(candidate.resumeCanvas ?? parsed);
  const structured = buildResumeView(parsed);
  const alias = candidateAlias(candidate.userId);
  const contacts = contactSummary({ ...object(parsed), account: { email: candidate.email, phone: candidate.mobile } });
  const root = inner(object(parsed));
  const identities: string[] = [];
  const collectIdentities = (value: unknown, identityContext = true) => {
    if (Array.isArray(value)) { value.forEach(item => collectIdentities(item, identityContext)); return; }
    for (const [key, item] of Object.entries(object(value))) {
      const normalized = key.toLowerCase().replace(/[^a-z]/g, '');
      if (['fullname', 'firstname', 'lastname', 'candidatename'].includes(normalized) || (normalized === 'name' && identityContext)) {
        if (typeof item === 'string') identities.push(item);
      }
      if (item && typeof item === 'object') collectIdentities(item, ['basics', 'personal', 'personaldetails', 'identity', 'contact', ...ENVELOPES].includes(normalized));
    }
  };
  collectIdentities(parsed);
  const names = [candidate.name, resume.name, structured.name, ...identities,
    ...['name', 'full_name', 'fullName', 'candidate_name', 'firstName', 'lastName'].map(key => text(root[key])),
    candidate.email, candidate.mobile, candidate.contactNumber,
    ...Object.values(collectContact(parsed)),
  ].filter((value): value is string => Boolean(value));
  const sanitized = redactIdentity(resume, names);
  sanitized.name = alias;
  // Never expose arbitrary parsed JSON, original filenames, avatar/photo,
  // original PDF/image bytes, or canvas metadata to a recruiter.
  return {
    id: candidate.userId, name: alias,
    location: redactIdentity(readableLocation(parsed), names),
    contactMode: 'blurred', contact: contacts,
    resumeFileName: candidate.resumeFileName ? 'candidate-resume.pdf' : null,
    resumeUploadedAt: candidate.resumeUploadedAt?.toISOString?.() ?? null,
    hasResume: Boolean(candidate.resumeFileName || candidate.resumeCanvas || parsed),
    resume: sanitized,
  };
}

export function toApplicantPayload(application: Application | null, candidate: User, job: Job | null): ApplicantPayload {
  const safe = toRecruiterCandidate(candidate);
  const haystack = `${job?.title ?? ''} ${job?.description ?? ''} ${job?.metadata?.minimumQualifications ?? ''}`.toLowerCase();
  const matches = safe.resume.skills.filter(skill => haystack.includes(skill.toLowerCase())).length;
  return {
    id: application?.applicationId ?? candidate.userId,
    kind: application ? 'application' : 'candidate',
    status: application?.status ?? 'AVAILABLE',
    appliedAt: application?.createdAt?.toISOString() ?? null,
    match: job && safe.resume.skills.length ? Math.round(matches / safe.resume.skills.length * 100) : 0,
    job: job ? { id: job.id, title: job.title, company: job.company, location: job.location ?? null } : null,
    candidate: safe,
  };
}

function readableLocation(parsedProfile: unknown): string | null {
  const root = inner(object(decodeJson(parsedProfile)));
  const basics = object(root.basics);
  const source = Object.keys(basics).length ? { ...root, ...basics } : root;
  const location = object(source.location);
  // Only explicit coarse fields are shared; free-form location may be an address.
  return [text(location.city || source.city), text(location.region || source.region), text(location.countryCode || source.country)].filter(Boolean).join(', ') || null;
}

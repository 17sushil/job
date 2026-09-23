/**
 * ATS resume service — the ONLY file that talks to the ATS engine.
 *
 * Today it runs a demo generator (staged progress + a real generated PDF built
 * from the candidate profile) so the upload → generate → download flow is fully
 * clickable. When the Python ATS service is ready, point the env var at it:
 *
 *   NEXT_PUBLIC_ATS_ENDPOINT=https://ats.jobdev.app/api/optimize
 *
 * `generateAtsResume()` then POSTs multipart/form-data:
 *   file   the uploaded .pdf / .docx / .doc
 *   fileMeta  JSON — { name, size, kind }
 *   profile   JSON — the candidate profile
 * and expects the optimized file bytes back (`application/pdf`). If the service
 * errors or returns something unexpected, the demo generator is used and the
 * result is flagged `engine: 'service-fallback'` so the UI can say so.
 *
 * Nothing else in the feature needs to change — the UI only knows this module.
 *
 *   TODO(ats-python): delete `demo-resume-pdf.ts` and `buildDemoResumeDocument()`
 *   once the service returns real files. `ResumeDocument` also disappears from
 *   `AtsGenerationResult` at that point (the preview panel hides itself).
 */

import { apiClient } from '@/lib/api-client';

import { resumePdf, type ResumeDocument } from './demo-resume-pdf';
import type { CandidateProfile } from './mock-data';

/* -------------------------------------------------------------------------- */
/*                            Uploads and validation                          */
/* -------------------------------------------------------------------------- */

export type ResumeKind = 'pdf' | 'docx' | 'doc';

export interface AtsUploadedFile {
  name: string;
  size: number;
  kind: ResumeKind;
  /** ISO timestamp of when it was selected/replaced. */
  uploadedAt: string;
}

export const ATS_MAX_BYTES = 5 * 1024 * 1024;
export const ATS_ACCEPTED_LABEL = 'PDF, DOCX or DOC · up to 5 MB';
export const ATS_ACCEPT_ATTR =
  '.pdf,.docx,.doc,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function resumeKindOf(fileName: string): ResumeKind | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.doc')) return 'doc';
  return null;
}

export function toUploadedFile(file: File): AtsUploadedFile | null {
  const kind = resumeKindOf(file.name);
  if (!kind) return null;
  return { name: file.name, size: file.size, kind, uploadedAt: new Date().toISOString() };
}

/** Returns a message to show the candidate, or `null` when the file is fine. */
export function validateAtsUpload(file: File): string | null {
  if (!resumeKindOf(file.name)) {
    return 'That format is not supported. Upload your resume as PDF, DOCX or DOC.';
  }
  if (file.size === 0) {
    return 'That file looks empty — download it again and re-upload.';
  }
  if (file.size > ATS_MAX_BYTES) {
    return `That file is ${formatBytes(file.size)}. Keep resumes under 5 MB; bigger files get rejected by most ATS gateways.`;
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** `bibek-thapa-ats-resume.pdf` — the name the candidate downloads. */
export function resumeFileName(profile: CandidateProfile): string {
  const person = profile.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${person || 'candidate'}-ats-resume.pdf`;
}

/* -------------------------------------------------------------------------- */
/*                                  Pipeline                                  */
/* -------------------------------------------------------------------------- */

export const ATS_PIPELINE_STEPS = [
  'Uploading your file',
  'Generating the ATS version',
  'Preparing your download',
] as const;

export interface AtsProgress {
  step: string;
  /** 0-100. */
  percent: number;
}

export interface AtsGenerationResult {
  fileName: string;
  blob: Blob;
  pages: number;
  generatedAt: string;
  engine: 'demo' | 'service' | 'service-fallback';
  /** One line the UI shows under the result. */
  note: string;
  /** Present for demo results only — drives the in-page preview. */
  document?: ResumeDocument;
}

export interface GenerateAtsResumeInput {
  file: AtsUploadedFile;
  profile: CandidateProfile;
  /** The real File, when the candidate uploaded one (needed by the service). */
  rawFile?: File | null;
  onProgress?: (progress: AtsProgress) => void;
}

/** Copy shown while the engine is the local one. */
export const DEMO_ENGINE_NOTE =
  'Demo engine: this file was generated in the browser from your JobDev profile. Connect the ATS service and the same button returns its output instead.';

/* -------------------------------------------------------------------------- */
/*                            Demo document builder                           */
/* -------------------------------------------------------------------------- */

/**
 * Builds the ATS-friendly structure: one column, standard headings, no tables,
 * no images, no page headers — everything a parser can read.
 * Delete this with the rest of the demo scaffolding once the service is live.
 */
export function buildDemoResumeDocument(profile: CandidateProfile): ResumeDocument {
  const sections: ResumeDocument['sections'] = [
    {
      title: 'Summary',
      blocks: [
        {
          kind: 'text',
          text: `${profile.seniority} ${profile.headline.split('·')[0].trim()} with ${
            profile.experienceYears
          } years shipping production software. ${profile.about}`,
        },
      ],
    },
    { title: 'Skills', blocks: [{ kind: 'text', text: profile.skills.join(', ') }] },
    {
      title: 'Experience',
      blocks: profile.experience.flatMap((role) => [
        { kind: 'entry' as const, text: `${role.role} - ${role.company} - ${role.period}` },
        ...role.highlights.map((highlight) => ({ kind: 'bullet' as const, text: highlight })),
      ]),
    },
    {
      title: 'Education',
      blocks: profile.education.map((entry) => ({
        kind: 'entry' as const,
        text: `${entry.degree} - ${entry.school} - ${entry.period}`,
      })),
    },
    {
      title: 'Links',
      blocks: profile.links.map((link) => ({
        kind: 'text' as const,
        text: `${link.label}: ${link.url}`,
      })),
    },
    {
      title: 'Additional',
      blocks: [
        {
          kind: 'text',
          text: [
            profile.openToWork ? 'Open to work' : 'Not currently looking',
            `Preferred setup: ${profile.workModes.join(', ')}`,
            `Notice period: ${profile.noticePeriod}`,
            `Expected salary: ${profile.expectedSalary}`,
          ].join(' | '),
        },
      ],
    },
  ];

  return {
    name: profile.name,
    headline: profile.headline,
    contacts: [profile.location, profile.phone, profile.email, ...profile.links.map((l) => l.url)],
    sections,
  };
}

/* -------------------------------------------------------------------------- */
/*                              Generator entry point                         */
/* -------------------------------------------------------------------------- */

async function runDemoPipeline(
  input: GenerateAtsResumeInput,
): Promise<AtsGenerationResult> {
  const perStep = 100 / ATS_PIPELINE_STEPS.length;
  for (let index = 0; index < ATS_PIPELINE_STEPS.length; index += 1) {
    input.onProgress?.({
      step: ATS_PIPELINE_STEPS[index],
      percent: Math.round(index * perStep),
    });
    // Stands in for the round trip to the ATS engine.
    await new Promise((resolve) => window.setTimeout(resolve, 340));
  }

  const document = buildDemoResumeDocument(input.profile);
  const { blob, pages } = resumePdf(document);
  input.onProgress?.({ step: 'Ready to download', percent: 100 });

  return {
    fileName: resumeFileName(input.profile),
    blob,
    pages,
    generatedAt: new Date().toISOString(),
    engine: 'demo',
    note: DEMO_ENGINE_NOTE,
    document,
  };
}

async function runServicePipeline(
  endpoint: string,
  input: GenerateAtsResumeInput,
): Promise<AtsGenerationResult> {
  const form = new FormData();
  if (input.rawFile) form.append('file', input.rawFile, input.rawFile.name);
  form.append('fileMeta', JSON.stringify(input.file));
  form.append('profile', JSON.stringify(input.profile));

  input.onProgress?.({ step: 'Sending to the ATS engine', percent: 20 });
  const response = await apiClient.post<ArrayBuffer>(endpoint, form, {
    responseType: 'arraybuffer',
  });
  input.onProgress?.({ step: 'Preparing your download', percent: 80 });

  const bytes = response.data;
  if (!bytes || bytes.byteLength === 0) throw new Error('service returned an empty file');

  const contentType = String(
    response.headers['content-type'] ?? 'application/pdf',
  );
  const fileName = response.headers['x-file-name']
    ? String(response.headers['x-file-name'])
    : resumeFileName(input.profile);

  return {
    fileName,
    blob: new Blob([bytes], { type: contentType }),
    pages: Number(response.headers['x-pages'] ?? '1') || 1,
    generatedAt: new Date().toISOString(),
    engine: 'service',
    note: 'Generated by the JobDev ATS service.',
  };
}

/**
 * Upload → generate. Uses the configured ATS service when there is one, and the
 * local demo generator otherwise (or when the service is unreachable).
 */
export async function generateAtsResume(
  input: GenerateAtsResumeInput,
): Promise<AtsGenerationResult> {
  const endpoint = process.env.NEXT_PUBLIC_ATS_ENDPOINT;

  if (endpoint) {
    try {
      return await runServicePipeline(endpoint, input);
    } catch (error) {
      const fallback = await runDemoPipeline(input);
      return {
        ...fallback,
        engine: 'service-fallback',
        note: `The ATS service could not be reached (${
          error instanceof Error ? error.message : 'unknown error'
        }) — this file came from the demo engine instead.`,
      };
    }
  }

  return runDemoPipeline(input);
}

/* -------------------------------------------------------------------------- */
/*                                  Download                                  */
/* -------------------------------------------------------------------------- */

export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

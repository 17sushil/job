'use client';
import { saveResumeDraftRequest } from '../../auth/api';

import { useEffect, useRef, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  CircleAlert,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FileUp,
  Gauge,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { apiClient } from '@/lib/api-client';
import { readApiError } from '@/features/auth/api';
import { useAuthStore } from '@/store/auth';

import {
  ATS_ACCEPT_ATTR,
  ATS_ACCEPTED_LABEL,
  type AtsGenerationResult,
  type AtsUploadedFile,
  formatBytes,
  parseAtsResume,
  canParseResume,
  toResumeDocument,
  toUploadedFile,
  triggerDownload,
  validateAtsUpload,
  generateAtsResume,
} from './ats-service';
import {
  flowToCanvas,
  resumePdf,
  resumePdfFromCanvas,
  type CanvasDocument,
  type CanvasTextObject,
  type ResumeDocument,
} from './demo-resume-pdf';
import { loadDraft, saveDraft } from './edit-draft';
import { ResumeEditor } from './resume-editor';
import type { CandidateProfile } from './mock-data';

/* The sketch caps the uploaded resume at 1 MB (PDF or Word). */
const MAX_RESUME_BYTES = 1_000_000;

type StudioTab = 'preview' | 'experience' | 'qualifications' | 'skills' | 'review';

const TABS: Array<{ id: StudioTab; label: string; icon: typeof Eye }> = [
  { id: 'preview', label: 'Canvas Preview', icon: Eye },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'qualifications', label: 'Qualifications', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Sparkles },
  { id: 'review', label: 'Overall review', icon: Gauge },
];

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

function fileKindLabel(kind: AtsUploadedFile['kind']): string {
  return kind === 'pdf' ? 'PDF' : 'Word';
}

/** The paper preview. Deliberately white-on-black-text: this is the printed page. */
function ResumePreview({ document }: { document: ResumeDocument }) {
  return (
    <article className="mx-auto w-full max-w-[720px] rounded-lg bg-white px-8 py-9 text-neutral-900 shadow-md ring-1 ring-black/10">
      <h2 className="text-center text-[19px] font-bold leading-tight">{document.name}</h2>
      <p className="mt-1 text-center text-[11.5px]">{document.headline}</p>
      <p className="mt-1 text-center text-[10.5px] text-neutral-600">
        {document.contacts.join('  |  ')}
      </p>

      {document.sections.map((section) => (
        <section key={section.title} className="mt-5">
          <h3 className="border-b border-neutral-300 pb-1 text-[11px] font-bold uppercase tracking-wide">
            {section.title}
          </h3>
          {section.blocks.map((block, index) => (
            <p
              key={`${section.title}-${index}`}
              className={cn(
                'mt-1.5 whitespace-pre-line text-[11.5px] leading-relaxed',
                block.kind === 'entry' && 'font-bold',
                block.kind === 'bullet' && '-indent-3 pl-3',
              )}
            >
              {block.kind === 'bullet' ? `- ${block.text}` : block.text}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   View                                     */
/* -------------------------------------------------------------------------- */

export function ResumeStudioView({
  profile,
  file,
  onFileChange,
  result,
  onResultChange,
  onNotify,
  onSave,
}: {
  profile: CandidateProfile;
  file: AtsUploadedFile | null;
  onFileChange: (file: AtsUploadedFile | null) => void;
  result: AtsGenerationResult | null;
  onResultChange: (result: AtsGenerationResult | null) => void;
  onNotify?: (message: string) => void;
  onSave: (next: CandidateProfile) => void;
}) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const rawFileRef = useRef<File | null>(null);
  const fileRevision = useRef(0);
  const resultRef = useRef(result);
  resultRef.current = result;
  const [restoring, setRestoring] = useState(Boolean(user?.resumeFileName));
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [restoreFailed, setRestoreFailed] = useState(false);

  const [tab, setTab] = useState<StudioTab>('preview');
  /* Local working copy; the Save button pushes it up (and to the database). */
  const [draft, setDraft] = useState<CandidateProfile>(profile);
  const [skillInput, setSkillInput] = useState('');

  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ step: string; percent: number }>({ step: '', percent: 0 });
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CanvasDocument | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  /* The watermarked ATS-friendly PDF the service returns from /v1/format/pdf —
     viewable on demand, separate from our own rendered preview. */
  const [watermarkedUrl, setWatermarkedUrl] = useState<string | null>(null);
  const [showWatermarked, setShowWatermarked] = useState(false);
  const [watermarkedBusy, setWatermarkedBusy] = useState(false);

  // The gate and studio share the database upload, not a browser File reference.
  useEffect(() => {
    if (!user?.id || !user.resumeFileName || rawFileRef.current) {
      setRestoring(false);
      return;
    }
    let cancelled = false;
    const revision = fileRevision.current;
    setRestoring(true);
    setRestoreFailed(false);
    const controller = new AbortController();
    async function restoreUpload() {
      try {
        const response = await apiClient('/api/auth/resume', { signal: controller.signal });
        if (!response.ok) throw new Error(await readApiError(response));
        const body = await response.json() as { data: { resume: {
          fileName: string;
          dataBase64: string;
          uploadedAt: string | null;
          parsedProfile: Record<string, unknown> | null;
        } | null } };
        if (cancelled || revision !== fileRevision.current) return;
        const saved = body.data.resume;
        if (!saved) throw new Error('The saved resume file could not be found. Please replace it.');
        const extension = saved.fileName.split('.').pop()?.toLowerCase();
        const type = extension === 'pdf' ? 'application/pdf' : extension === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/msword';
        const bytes = Uint8Array.from(atob(saved.dataBase64), (char) => char.charCodeAt(0));
        const original = new File([bytes], saved.fileName, { type });
        const metadata = toUploadedFile(original);
        if (!metadata) throw new Error('The saved resume format is not supported. Please replace it.');
        onFileChange({ ...metadata, uploadedAt: saved.uploadedAt ?? metadata.uploadedAt });
        if (!resultRef.current && saved.parsedProfile) {
          // Saved edits may be canvas JSON instead of the initial ATS response.
          const canvas = Array.isArray(saved.parsedProfile.pages) && saved.parsedProfile.assets
            ? saved.parsedProfile as unknown as CanvasDocument : null;
          const document = canvas ? undefined : toResumeDocument(saved.parsedProfile);
          const rendered = canvas ? resumePdfFromCanvas(canvas) : resumePdf(document!);
          onResultChange({
            ...rendered,
            fileName: `${saved.fileName.replace(/\.[^.]+$/, '')}-ats-resume.pdf`,
            generatedAt: saved.uploadedAt ?? new Date().toISOString(),
            engine: 'service',
            note: 'Restored from your saved resume. No second upload needed.',
            document,
            canvas: canvas ?? flowToCanvas(document!),
          });
        }
        rawFileRef.current = original;
      } catch (problem) {
        if (!cancelled && revision === fileRevision.current) {
          setRestoreFailed(true);
          setError(problem instanceof Error ? problem.message : 'Could not load your saved resume.');
        }
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }
    void restoreUpload();
    return () => { cancelled = true; controller.abort(); };
  }, [user?.id, user?.resumeFileName, restoreAttempt, onFileChange, onResultChange]);

  useEffect(() => {
    return () => { if (watermarkedUrl) URL.revokeObjectURL(watermarkedUrl); };
  }, [watermarkedUrl]);

  /* Keep the draft in step when the orchestrator re-hydrates the profile. */
  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  useEffect(() => {
    if (!result || result.document) {
      setPdfPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(result.blob);
    setPdfPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  const pdfPreviewSrc = pdfPreviewUrl
    ? `${pdfPreviewUrl}#toolbar=0&navpanes=0&statusbar=0&view=FitH`
    : null;

  const canEmbedPreview =
    !!result &&
    !result.document &&
    (result.blob.type === 'application/pdf' || result.fileName.toLowerCase().endsWith('.pdf'));

  /* ------------------------------ file handling ---------------------------- */

  function acceptFile(candidate: File) {
    if (candidate.size > MAX_RESUME_BYTES) {
      setError(
        `That file is ${formatBytes(candidate.size)}. Keep it under 1 MB (PDF or Word).`,
      );
      return;
    }
    const problem = validateAtsUpload(candidate);
    if (problem) {
      setError(problem);
      return;
    }
    const uploaded = toUploadedFile(candidate);
    if (!uploaded) {
      setError('Only PDF and Word files are supported. Export your resume to one of those first.');
      return;
    }
    fileRevision.current += 1;
    setRestoring(false);
    setRestoreFailed(false);
    setShowWatermarked(false);
    setWatermarkedUrl(null);
    setError(null);
    onFileChange(uploaded);
    rawFileRef.current = candidate;
    if (result) onResultChange(null);
    void extract(candidate);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) acceptFile(dropped);
  }

  /* Upload to our backend: it forwards the file to the ATS extraction
     service, stores the parsed data on the account and hands it back. */
  async function extract(candidate: File | null) {
    if (!candidate || busy) return;
    setBusy(true);
    setError(null);
    setProgress({ step: 'Extracting resume…', percent: 40 });
    try {
      const dataBase64 = await readAsBase64(candidate);
      const res = await apiClient('/api/auth/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: candidate.name, dataBase64 }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      const body = (await res.json()) as {
        data: {
          user: Parameters<typeof setUser>[0];
          parsed: Record<string, unknown> | null;
          atsError: string | null;
        };
      };
      setUser(body.data.user);
      /* Ritik's version history: the parsed resume becomes v1. */
      if (body.data.parsed) {
        saveResumeDraftRequest(body.data.parsed).catch(() => {});
      }
      setProgress({ step: 'Saved', percent: 100 });
      if (body.data.parsed) {
        const document = toResumeDocument(body.data.parsed);
        const { blob, pages } = resumePdf(document);
        const slug = candidate.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        onResultChange({
          fileName: `${slug || 'resume'}-ats-resume.pdf`,
          blob,
          pages,
          generatedAt: new Date().toISOString(),
          engine: 'service',
          note: 'Data extracted by the ATS service and saved to your account.',
          document,
          canvas: flowToCanvas(document),
        });
        setTab('preview');
        onNotify?.('Resume extracted and saved to your account.');
      } else {
        onNotify?.(
          body.data.atsError
            ? `Resume saved. ${body.data.atsError}.`
            : 'Resume saved to your account.',
        );
      }
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Could not save the resume. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result) return;
    triggerDownload(result.blob, result.fileName);
    onNotify?.(`Downloading ${result.fileName}`);
  }

  async function openEditor() {
    if (editBusy) return;
    setError(null);

    /* This session's canvas first, then the draft kept by the draft store so
       an edit survives a reload; only then flow the parsed text onto pages. */
    if (result?.canvas) {
      setEditing(result.canvas);
      return;
    }
    if (result) {
      const stored = await loadDraft({
        ...(result.jobId ? { jobId: result.jobId } : {}),
        ...(result.fileName ? { fileName: result.fileName } : {}),
      });
      if (stored) {
        setEditing(stored.canvas);
        const { blob, pages } = resumePdfFromCanvas(stored.canvas);
        onResultChange({
          ...result,
          blob,
          pages,
          canvas: stored.canvas,
          note: 'Reopened from your saved edit — Download PDF matches what you edited.',
        });
        return;
      }
    }
    if (result?.document) {
      setEditing(flowToCanvas(result.document));
      return;
    }
    if (!result?.parseUrl && !canParseResume()) {
      setError(
        'Editing a file from the service needs the parser endpoint (NEXT_PUBLIC_ATS_PARSE_ENDPOINT).',
      );
      return;
    }

    setEditBusy(true);
    try {
      const parsed = await parseAtsResume({
        parseUrl: result?.parseUrl ?? null,
        jobId: result?.jobId ?? null,
        parsedJson: (result as any)?.parsedJson ?? null,
        rawFile: rawFileRef.current,
      });
      setEditing(flowToCanvas(parsed));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not open the editor.');
    } finally {
      setEditBusy(false);
    }
  }

  async function saveEdit(canvas: CanvasDocument) {
    try {
      const { blob, pages } = resumePdfFromCanvas(canvas);
      const stored = await saveDraft(canvas, {
        ...(result?.jobId ? { jobId: result.jobId } : {}),
        ...(result?.fileName ? { fileName: result.fileName } : {}),
      });
      /* Version history: every saved edit becomes the next resume version. */
      saveResumeDraftRequest(canvas as unknown as Record<string, unknown>).catch(() => {});
      const draftNote = stored.ok
        ? ' Your edit JSON is saved and will reopen next time.'
        : ` The edit JSON did not save: ${stored.reason}`;
      const title = (canvas.pages[0]?.objects ?? []).find(
        (object): object is CanvasTextObject => object.type === 'text',
      );
      const slug = (title?.text ?? result?.fileName ?? 'resume')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      onResultChange({
        fileName: result?.fileName ?? `${slug || 'resume'}-ats-resume.pdf`,
        blob,
        pages,
        generatedAt: new Date().toISOString(),
        engine: result?.engine ?? 'demo',
        note: `Edited in the studio — this PDF was rendered from your edited page.${draftNote}`,
        endpoint: result?.endpoint,
        jobId: result?.jobId,
        parseUrl: result?.parseUrl,
        document: result?.document,
        canvas,
      });
      setEditing(null);
      setTab('preview');
      onNotify?.('Saved — use Download PDF for the new file.');
    } catch {
      setError('Could not render the edited resume. Your changes are still open in the editor.');
    }
  }

  /** Generates (once per click) and toggles the watermarked ATS-friendly PDF
   *  the service returns from /v1/format/pdf. */
  async function viewWatermarked() {
    if (watermarkedBusy) return;
    if (showWatermarked) {
      setShowWatermarked(false);
      return;
    }
    const candidate = rawFileRef.current;
    if (!candidate) {
      setError('Upload a resume first to generate the watermarked ATS-friendly PDF.');
      return;
    }
    const uploaded = toUploadedFile(candidate);
    if (!uploaded) {
      setError('That file type cannot be sent to the ATS service.');
      return;
    }
    setWatermarkedBusy(true);
    setError(null);
    try {
      const generated = await generateAtsResume({
        file: uploaded,
        profile: draft,
        rawFile: candidate,
      });
      setWatermarkedUrl(URL.createObjectURL(generated.blob));
      setShowWatermarked(true);
      onNotify?.(
        generated.engine === 'service'
          ? 'Watermarked ATS-friendly PDF from the service is ready in the preview.'
          : 'The service was unreachable — showing the in-browser ATS-friendly PDF instead.',
      );
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not generate the watermarked PDF.');
    } finally {
      setWatermarkedBusy(false);
    }
  }

  /* ------------------------------ draft editing ---------------------------- */

  function patchDraft(patch: Partial<CandidateProfile>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function patchExperience(index: number, patch: Partial<CandidateProfile['experience'][number]>) {
    patchDraft({
      experience: draft.experience.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    });
  }

  function patchEducation(index: number, patch: Partial<CandidateProfile['education'][number]>) {
    patchDraft({
      education: draft.education.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    });
  }

  function addSkill() {
    const skill = skillInput.trim();
    if (!skill) return;
    if (draft.skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      setSkillInput('');
      return;
    }
    patchDraft({ skills: [...draft.skills, skill] });
    setSkillInput('');
  }

  /* ------------------------------- overall review -------------------------- */

  const reviewItems: Array<{ ok: boolean; label: string; hint: string }> = [
    {
      ok: Boolean(draft.headline.trim()),
      label: 'Professional headline',
      hint: 'One line under your name on the resume.',
    },
    {
      ok: draft.skills.length > 0,
      label: `Skills (${draft.skills.length})`,
      hint: 'Recruiters filter by skills first.',
    },
    {
      ok: draft.experience.length > 0,
      label: `Experience entries (${draft.experience.length})`,
      hint: 'Role, company and period for each job.',
    },
    {
      ok: draft.education.length > 0,
      label: `Qualifications (${draft.education.length})`,
      hint: 'Degree, school and period.',
    },
    {
      ok: Boolean(file),
      label: 'Resume file uploaded',
      hint: 'PDF or Word, under 1 MB.',
    },
    {
      ok: Boolean(result),
      label: 'ATS-friendly resume generated',
      hint: 'The parser-safe version you send out.',
    },
  ];
  const doneCount = reviewItems.filter((item) => item.ok).length;

  /* ---------------------------------- render ------------------------------- */

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* ------------------------- Left: resume file ------------------------- */}
      <aside className="animate-fade-in-up space-y-3 self-start rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Your resume file</h3>
        <p className="text-xs text-muted-foreground">
          {restoring
            ? 'Reusing the resume saved to your account.'
            : file
            ? 'Already uploaded — PDF or Word, under 1 MB.'
            : 'Upload a PDF or Word file, under 1 MB.'}
        </p>

        {restoring ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your saved resume…
          </p>
        ) : file ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light">
              <FileText className="h-5 w-5 text-primary-dark" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {fileKindLabel(file.kind)} · {formatBytes(file.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              className="text-destructive hover:bg-destructive/10"
              onClick={() => {
                fileRevision.current += 1;
                rawFileRef.current = null;
                setShowWatermarked(false);
                setWatermarkedUrl(null);
                onFileChange(null);
                onResultChange(null);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors',
              dragActive ? 'border-primary bg-primary-light' : 'border-border bg-muted/30',
            )}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light">
              <UploadCloud className="h-5 w-5 text-primary-dark" />
            </span>
            <p className="text-sm font-semibold">Drag your resume here</p>
            <p className="text-xs text-muted-foreground">{ATS_ACCEPTED_LABEL} · under 1 MB</p>
            <Button size="sm" className="mt-1" onClick={() => inputRef.current?.click()}>
              <FileUp className="h-3.5 w-3.5" />
              Upload
            </Button>
          </div>
        )}

        {restoreFailed && (
          <Button size="sm" variant="outline" onClick={() => setRestoreAttempt((value) => value + 1)}>
            Retry loading saved resume
          </Button>
        )}
        {file && !result && !restoring && !restoreFailed && (
          <Button size="sm" disabled={busy} onClick={() => void extract(rawFileRef.current)}>
            {busy ? 'Extracting…' : 'Extract saved resume'}
          </Button>
        )}
        {file && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Replace file
          </Button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ATS_ACCEPT_ATTR}
          className="hidden"
          onChange={(event) => {
            const picked = event.target.files?.[0];
            if (picked) acceptFile(picked);
            event.target.value = '';
          }}
        />

        <Button
          className="w-full"
          onClick={() => extract(rawFileRef.current)}
          disabled={!file || busy || !rawFileRef.current}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
          {busy ? 'Extracting…' : result ? 'Re-run extraction' : 'Extract & save'}
        </Button>

        {busy && (
          <div className="space-y-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{progress.step || 'Working…'}</p>
          </div>
        )}

        {error && (
          <p className="animate-pop-in flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
      </aside>

      {/* ------------------------------ Main column -------------------------- */}
      <section className="min-w-0 space-y-4">
        {/* Candidate header bar */}
        <div className="animate-fade-in-up rounded-2xl border border-border bg-card px-5 py-4 text-center shadow-sm">
          <h2 className="text-lg font-bold tracking-tight">{draft.name || 'Candidate'}</h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {draft.headline || 'Add a headline in the review tab'}
            {draft.email ? ` · ${draft.email}` : ''}
          </p>
        </div>

        {/* Tabs */}
        <div className="animate-fade-in-up flex flex-wrap gap-2">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'bg-card text-muted-foreground hover:bg-primary-light hover:text-primary-dark',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="animate-fade-in-up min-h-[440px] rounded-2xl border border-border bg-card p-5 shadow-sm">
          {tab === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Canvas Preview</h3>
                {result && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={openEditor} disabled={editBusy}>
                      {editBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
                      {editBusy ? 'Opening…' : 'Edit'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={viewWatermarked}
                      disabled={watermarkedBusy || restoring || restoreFailed}
                    >
                      {watermarkedBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {showWatermarked ? 'Hide watermarked' : 'Watermarked PDF'}
                    </Button>
                    <Button size="sm" onClick={download}>
                      <Download className="h-3.5 w-3.5" />
                      Download PDF
                    </Button>
                  </div>
                )}
              </div>

              {showWatermarked && watermarkedUrl ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                  <iframe
                    title="Watermarked ATS-friendly resume from the service"
                    src={`${watermarkedUrl}#toolbar=0&navpanes=0&statusbar=0&view=FitH`}
                    className="h-[560px] w-full"
                  />
                </div>
              ) : null}

              {result?.document ? (
                <div className="max-h-[560px] overflow-y-auto rounded-2xl bg-muted/40 p-4 scrollbar-slim">
                  <ResumePreview document={result.document} />
                </div>
              ) : canEmbedPreview && pdfPreviewSrc ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                  <iframe
                    title={`Preview of ${result?.fileName ?? 'resume'}`}
                    src={pdfPreviewSrc}
                    className="h-[560px] w-full"
                  />
                </div>
              ) : result ? (
                <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                  This file cannot be previewed in the page — use Download PDF to open it.
                </p>
              ) : (
                <div className="flex min-h-[380px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
                  <Eye className="h-8 w-8 text-muted-foreground/50" />
                  <h4 className="text-sm font-semibold">Nothing to preview yet</h4>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Upload your resume on the left and generate the ATS-friendly
                    version — the page will show here exactly as it will print.
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === 'experience' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Experience</h3>
              {draft.experience.length === 0 && (
                <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                  No experience added yet — use “Add experience” below.
                </p>
              )}
              {draft.experience.map((entry, index) => (
                <div key={index} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <div className="space-y-1">
                    <Label className="text-xs">Role</Label>
                    <Input
                      value={entry.role}
                      placeholder="Frontend Engineer"
                      onChange={(event) => patchExperience(index, { role: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Company</Label>
                    <Input
                      value={entry.company}
                      placeholder="Company name"
                      onChange={(event) => patchExperience(index, { company: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Period</Label>
                    <Input
                      value={entry.period}
                      placeholder="2022 – now"
                      onChange={(event) => patchExperience(index, { period: event.target.value })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-end text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      patchDraft({ experience: draft.experience.filter((_, i) => i !== index) })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  patchDraft({
                    experience: [
                      ...draft.experience,
                      { role: '', company: '', period: '', highlights: [] },
                    ],
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Add experience
              </Button>
            </div>
          )}

          {tab === 'qualifications' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Qualifications</h3>
              {draft.education.length === 0 && (
                <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                  No qualifications added yet — use “Add qualification” below.
                </p>
              )}
              {draft.education.map((entry, index) => (
                <div key={index} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <div className="space-y-1">
                    <Label className="text-xs">Degree</Label>
                    <Input
                      value={entry.degree}
                      placeholder="BSc CSIT"
                      onChange={(event) => patchEducation(index, { degree: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">School</Label>
                    <Input
                      value={entry.school}
                      placeholder="Tribhuvan University"
                      onChange={(event) => patchEducation(index, { school: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Period</Label>
                    <Input
                      value={entry.period}
                      placeholder="2018 – 2022"
                      onChange={(event) => patchEducation(index, { period: event.target.value })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-end text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      patchDraft({ education: draft.education.filter((_, i) => i !== index) })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  patchDraft({
                    education: [...draft.education, { degree: '', school: '', period: '' }],
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Add qualification
              </Button>
            </div>
          )}

          {tab === 'skills' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Skills</h3>
              {draft.skills.length === 0 ? (
                <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                  No skills yet — add the ones recruiters should find you for.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {draft.skills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      title={`Remove ${skill}`}
                      onClick={() =>
                        patchDraft({ skills: draft.skills.filter((item) => item !== skill) })
                      }
                      className="flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary-dark transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      {skill}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex max-w-sm items-center gap-2">
                <Input
                  value={skillInput}
                  placeholder="Add a skill and press Enter"
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={addSkill}>
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>
          )}

          {tab === 'review' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Overall review</h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  {doneCount} of {reviewItems.length} complete
                </span>
              </div>
              <ul className="space-y-2">
                {reviewItems.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl border border-border p-3"
                  >
                    {item.ok ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.hint}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Save — bottom right, as sketched */}
        <div className="flex justify-end">
          <Button
            onClick={() => {
              onSave(draft);
              onNotify?.('Resume saved.');
            }}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </section>

      {editing ? (
        <ResumeEditor canvas={editing} onSave={saveEdit} onCancel={() => setEditing(null)} />
      ) : null}
    </div>
  );
}

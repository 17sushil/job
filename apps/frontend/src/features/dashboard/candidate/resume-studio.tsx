'use client';

import { useRef, useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  Download,
  FileCheck2,
  FileSearch,
  FileText,
  FileUp,
  Info,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  ATS_ACCEPT_ATTR,
  ATS_ACCEPTED_LABEL,
  ATS_PIPELINE_STEPS,
  type AtsGenerationResult,
  type AtsProgress,
  type AtsUploadedFile,
  formatBytes,
  generateAtsResume,
  toUploadedFile,
  triggerDownload,
  validateAtsUpload,
} from './ats-service';
import type { ResumeDocument } from './demo-resume-pdf';
import type { CandidateProfile } from './mock-data';

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function fileKindLabel(kind: AtsUploadedFile['kind']): string {
  if (kind === 'pdf') return 'PDF';
  if (kind === 'docx') return 'DOCX';
  return 'DOC';
}

function FileChip({
  file,
  onRemove,
  disabled,
}: {
  file: AtsUploadedFile;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light">
        <FileText className="h-5 w-5 text-primary-dark" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {fileKindLabel(file.kind)} · {formatBytes(file.size)} · ready to process
        </p>
      </div>
      {onRemove ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onRemove}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </Button>
      ) : (
        <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
          Ready
        </span>
      )}
    </div>
  );
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
                'mt-1.5 text-[11.5px] leading-relaxed',
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
}: {
  profile: CandidateProfile;
  file: AtsUploadedFile | null;
  onFileChange: (file: AtsUploadedFile | null) => void;
  result: AtsGenerationResult | null;
  onResultChange: (result: AtsGenerationResult | null) => void;
  onNotify?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  /* The real File is only needed once the ATS service is wired up, so it lives
     in a ref rather than in React state. */
  const rawFileRef = useRef<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<AtsProgress>({ step: '', percent: 0 });
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const stepSize = 100 / ATS_PIPELINE_STEPS.length;

  function acceptFile(candidate: File) {
    const problem = validateAtsUpload(candidate);
    if (problem) {
      setError(problem);
      return;
    }
    const uploaded = toUploadedFile(candidate);
    if (!uploaded) {
      setError('That format is not supported. Upload your resume as PDF, DOCX or DOC.');
      return;
    }
    setError(null);
    onFileChange(uploaded);
    rawFileRef.current = candidate;
    if (result) {
      onResultChange(null);
      onNotify?.('New file selected — generate again to refresh the download.');
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) acceptFile(dropped);
  }

  function useSampleFile() {
    setError(null);
    rawFileRef.current = null;
    onFileChange({
      name: profile.resumeFileName,
      size: 246_800,
      kind: 'pdf',
      uploadedAt: new Date().toISOString(),
    });
    onResultChange(null);
    onNotify?.('Sample resume attached — hit generate.');
  }

  async function generate() {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setProgress({ step: ATS_PIPELINE_STEPS[0], percent: 0 });
    try {
      const generated = await generateAtsResume({
        file,
        profile,
        rawFile: rawFileRef.current,
        onProgress: setProgress,
      });
      onResultChange(generated);
      onNotify?.('ATS-friendly resume is ready to download.');
    } catch (problem) {
      setError(
        problem instanceof Error
          ? `Generation failed: ${problem.message}`
          : 'Generation failed. Try again.',
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="animate-fade-in-up">
          <h2 className="text-xl font-bold">ATS resume</h2>
          <p className="text-sm text-muted-foreground">
            Upload the resume you are sending out and download the ATS-friendly version.
          </p>
        </div>
        {result ? (
          <Button className="animate-fade-in-up" onClick={download}>
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* ------------------------------- Steps ------------------------------ */}
        <div className="space-y-4">
          {/* 1 — upload */}
          <div
            className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm"
            style={{ animationDelay: '60ms' }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                1
              </span>
              <h3 className="text-sm font-semibold">Upload your resume</h3>
              {file ? (
                <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Uploaded
                </span>
              ) : null}
            </div>

            {file ? (
              <FileChip
                file={file}
                disabled={busy}
                onRemove={() => {
                  rawFileRef.current = null;
                  onFileChange(null);
                  onResultChange(null);
                }}
              />
            ) : (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-colors',
                  dragActive ? 'border-primary bg-primary-light' : 'border-border bg-muted/30',
                )}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                  <UploadCloud className="h-6 w-6 text-primary-dark" />
                </span>
                <p className="text-sm font-semibold">Drag your resume here</p>
                <p className="text-xs text-muted-foreground">{ATS_ACCEPTED_LABEL}</p>
                <Button className="mt-1" onClick={() => inputRef.current?.click()}>
                  <FileUp className="h-4 w-4" />
                  Upload resume
                </Button>
                <button
                  type="button"
                  onClick={useSampleFile}
                  className="text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  or try it with a sample file
                </button>
              </div>
            )}

            {file ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
                  <FileUp className="h-3.5 w-3.5" />
                  Replace file
                </Button>
              </div>
            ) : null}

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

            {error ? (
              <p className="animate-pop-in mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            ) : null}
          </div>

          {/* 2 — generate */}
          <div
            className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm"
            style={{ animationDelay: '120ms' }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                2
              </span>
              <h3 className="text-sm font-semibold">Generate the ATS-friendly version</h3>
            </div>

            <ol className="space-y-2">
              {ATS_PIPELINE_STEPS.map((step, index) => {
                const done = !busy && Boolean(result);
                const running = busy && progress.percent < (index + 1) * stepSize;
                const complete = busy ? progress.percent >= (index + 1) * stepSize : done;
                return (
                  <li key={step} className="flex items-center gap-2.5 text-sm">
                    {complete ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : running ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                    )}
                    <span
                      className={cn(
                        complete || running ? 'text-foreground' : 'text-muted-foreground',
                        running && 'font-semibold text-primary-dark',
                      )}
                    >
                      {step}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${busy ? progress.percent : result ? 100 : 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {busy
                ? progress.step || 'Working…'
                : result
                  ? 'Done — your download is on the right.'
                  : file
                    ? 'Ready when you are.'
                    : 'Upload a file to enable this step.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button onClick={generate} disabled={!file || busy}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : result ? (
                  <RotateCcw className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {busy ? 'Generating…' : result ? 'Regenerate' : 'Generate ATS resume'}
              </Button>
              {result ? (
                <Button variant="outline" onClick={download}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              ) : null}
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-info/10 p-3 text-xs text-info">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Demo engine for now: the file is generated in the browser from your JobDev
                profile. Plug the Python ATS service into{' '}
                <code className="font-semibold">ats-service.ts</code> and this same button
                returns its output — the interface does not change.
              </span>
            </p>
          </div>
        </div>

        {/* ------------------------------ Result ------------------------------ */}
        <div
          className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm"
          style={{ animationDelay: '180ms' }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Your ATS resume</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {result
                  ? `${result.pages} page${result.pages === 1 ? '' : 's'} · ${formatBytes(
                      result.blob.size,
                    )} · ${result.engine === 'service' ? 'ATS service' : 'demo engine'}`
                  : 'Nothing generated yet'}
              </p>
            </div>
            {result?.document ? (
              <button
                type="button"
                onClick={() => setShowPreview((value) => !value)}
                className="text-xs font-semibold text-primary hover:text-primary-hover"
              >
                {showPreview ? 'Hide preview' : 'Show preview'}
              </button>
            ) : null}
          </div>

          {busy ? (
            <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-semibold">{progress.step || 'Working…'}</p>
              <p className="text-xs text-muted-foreground">
                Rewriting your resume so parsers read every section correctly.
              </p>
            </div>
          ) : !result ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                <FileSearch className="h-6 w-6 text-primary" />
              </span>
              <h4 className="text-sm font-semibold">Your download will appear here</h4>
              <p className="max-w-sm text-sm text-muted-foreground">
                Upload a PDF, DOCX or DOC and generate the ATS-friendly version. You will be
                able to download it as a PDF.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15">
                  <FileCheck2 className="h-5 w-5 text-success" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{result.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    PDF · {result.pages} page{result.pages === 1 ? '' : 's'} · ready to send
                  </p>
                </div>
                <Button size="sm" onClick={download}>
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </Button>
              </div>

              <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                {result.note}
              </p>

              {showPreview && result.document ? (
                <div className="max-h-[560px] overflow-y-auto rounded-2xl bg-muted/40 p-4 scrollbar-slim">
                  <ResumePreview document={result.document} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

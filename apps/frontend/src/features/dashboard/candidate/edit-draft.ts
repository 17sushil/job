/** Account-owned draft compatibility helpers. The database is authoritative;
 * no public service credentials, browser storage, or arbitrary job-id access. */
import { apiClient } from '@/lib/api-client';
import { readApiError } from '@/features/auth/api';
import { useAuthStore } from '@/store/auth';
import { resumePdfFromCanvas } from './demo-resume-pdf';
import { pruneCanvas } from './demo-resume-pdf';
import type {
  CanvasAsset,
  CanvasDocument,
  CanvasFont,
  CanvasImageObject,
  CanvasObject,
  CanvasTextObject,
  CanvasTextStyle,
  ResumeAlign,
} from './demo-resume-pdf';

export const DRAFT_KIND = 'resume-canvas-draft';
export const DRAFT_VERSION = 1;

export const ATS_DRAFT_ENDPOINT = '/api/auth/resume/current';
export function draftUrl(_jobId: string): string { return ATS_DRAFT_ENDPOINT; }
export function draftsConfigured(): boolean { return true; }

export interface EditDraft {
  kind: string;
  version: number;
  app: 'jobdev-candidate-editor';
  savedAt: string;
  /** The job the PDF came from, when the service gave one. */
  jobId?: string;
  /** What the PDF was called — the draft is keyed by this when there is no job id. */
  fileName?: string;
  /** Quick counts, handy when reading the file by eye. */
  pages: number;
  objects: number;
  canvas: CanvasDocument;
}

export interface DraftMeta {
  jobId?: string;
  fileName?: string;
}

export interface DraftRead {
  canvas: CanvasDocument;
  key: string;
  savedAt?: string;
  jobId?: string;
  fileName?: string;
  /** Everything the reader repaired or dropped, in plain words. */
  repairs: string[];
}

/* -------------------------------------------------------------------------- */
/*                                  Writing                                   */
/* -------------------------------------------------------------------------- */

/** One draft per resume: job id when the service gave one, else the file name. */
export function draftKey(meta: DraftMeta): string {
  if (meta.jobId) return `job-${meta.jobId}`;
  const slug = (meta.fileName ?? '')
    .replace(/\.pdf$/i, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'current';
}

export function buildDraft(canvas: CanvasDocument, meta: DraftMeta = {}): EditDraft {
  const pruned = pruneCanvas(canvas);
  return {
    kind: DRAFT_KIND,
    version: DRAFT_VERSION,
    app: 'jobdev-candidate-editor',
    savedAt: new Date().toISOString(),
    jobId: meta.jobId,
    fileName: meta.fileName,
    pages: pruned.pages.length,
    objects: pruned.pages.reduce((total, page) => total + page.objects.length, 0),
    canvas: pruned,
  };
}

export interface DraftSaveResult {
  ok: boolean;
  key: string;
  savedAt?: string;
  bytes?: number;
  /** True when there was simply nowhere to save (no job id / no service). */
  skipped?: boolean;
  /** Why it did not save, in a sentence a candidate can read. */
  reason?: string;
}

/**
 * Write the edit to the store. Never throws: the PDF has already been made, so
 * a storage hiccup is reported, not fatal.
 */
export async function saveDraft(canvas: CanvasDocument, meta: DraftMeta = {}): Promise<DraftSaveResult> {
  const key = draftKey(meta);
  try {
    const { blob } = resumePdfFromCanvas(canvas);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    const response = await apiClient(ATS_DRAFT_ENDPOINT, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: meta.fileName?.endsWith('.pdf') ? meta.fileName : 'edited-resume.pdf',
        pdfBase64: btoa(binary), canvas, profile: useAuthStore.getState().user?.parsedProfile ?? {} }),
    });
    if (!response.ok) return { ok: false, key, reason: await readApiError(response) };
    const body = await response.json();
    useAuthStore.getState().setUser(body.data.user);
    return { ok: true, key, savedAt: new Date().toISOString(), bytes: blob.size };
  } catch (error) { return { ok: false, key, reason: error instanceof Error ? error.message : 'Could not save the draft.' }; }
}

/* -------------------------------------------------------------------------- */
/*                                  Reading                                    */
/* -------------------------------------------------------------------------- */

const ALIGNMENTS: ResumeAlign[] = ['left', 'center', 'right'];
const COLOUR = /^#[0-9a-f]{6}$/i;
/** The faces this build knows. An unknown one falls back with a note. */
const FONTS: CanvasFont[] = ['helvetica', 'times', 'courier'];

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function textStyle(raw: unknown, repairs: string[]): CanvasTextStyle {
  const style = (raw ?? {}) as Record<string, unknown>;
  const size = numberOr(style.size, 11);
  const safeSize = size >= 4 && size <= 400 ? size : 11;
  if (safeSize !== size) repairs.push('a text size was out of range, set back to 11 pt');
  const align = ALIGNMENTS.includes(style.align as ResumeAlign)
    ? (style.align as ResumeAlign)
    : undefined;
  const colour = typeof style.color === 'string' && COLOUR.test(style.color) ? style.color : undefined;
  const lineHeight = numberOr(style.lineHeight, 1.35);
  const font = FONTS.includes(style.font as CanvasFont) ? (style.font as CanvasFont) : undefined;
  if (typeof style.font === 'string' && !font) {
    repairs.push(`the font "${style.font}" is not in this build, so a standard one is used`);
  }
  return {
    font,
    size: safeSize,
    bold: style.bold === true,
    italic: style.italic === true,
    color: colour,
    align,
    lineHeight: lineHeight >= 0.8 && lineHeight <= 3 ? lineHeight : 1.35,
  };
}

/** One object from a draft → what the editor can draw, or nothing + a note. */
function readObject(
  raw: unknown,
  assets: Record<string, CanvasAsset>,
  repairs: string[],
): CanvasObject | null {
  if (!raw || typeof raw !== 'object') {
    repairs.push('an entry was not an object and was skipped');
    return null;
  }
  const item = raw as Record<string, unknown>;
  const base = {
    id: typeof item.id === 'string' && item.id ? item.id : undefined,
    x: Math.round(numberOr(item.x, 0) * 10) / 10,
    y: Math.round(numberOr(item.y, 0) * 10) / 10,
    rotation: typeof item.rotation === 'number' ? item.rotation : undefined,
    opacity: typeof item.opacity === 'number' ? item.opacity : undefined,
    hidden: item.hidden === true ? true : undefined,
    locked: item.locked === true ? true : undefined,
    name: typeof item.name === 'string' ? item.name : undefined,
  };

  if (item.type === 'text') {
    const object: CanvasTextObject = {
      ...base,
      type: 'text',
      w: Math.max(8, numberOr(item.w, 220)),
      text: typeof item.text === 'string' ? item.text : '',
      style: textStyle(item.style, repairs),
    };
    return object;
  }

  if (item.type === 'image') {
    const assetId = typeof item.assetId === 'string' ? item.assetId : '';
    const asset = assetId ? assets[assetId] : undefined;
    if (!asset) {
      repairs.push('an image had no picture attached and was skipped');
      return null;
    }
    const object: CanvasImageObject = {
      ...base,
      type: 'image',
      w: Math.max(8, numberOr(item.w, 160)),
      h: Math.max(8, numberOr(item.h, 120)),
      assetId,
    };
    return object;
  }

  repairs.push(
    `a "${String(item.type ?? 'unknown')}" object is not something this editor draws and was skipped`,
  );
  return null;
}

/**
 * Read a draft (or a bare canvas) back.
 *
 * Accepts, in this order:
 *   1. `{ …, canvas: { pages: [...] } }`  — what we write
 *   2. `{ pages: [...] }`                 — a canvas on its own
 *   3. `{ …, data: { canvas… } }`         — a service envelope
 *
 * Throws an Error with a sentence a candidate can read when there is nothing
 * usable inside.
 */
export function parseDraft(text: string): Omit<DraftRead, 'key'> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That saved edit is not readable JSON.');
  }
  if (!raw || typeof raw !== 'object') {
    throw new Error('That saved edit is empty.');
  }

  const root = raw as Record<string, unknown>;
  const inside = (root.data as Record<string, unknown> | undefined) ?? root;
  const canvasRaw = (inside.canvas ?? root.canvas ?? inside) as Record<string, unknown>;
  const pagesRaw = canvasRaw?.pages;
  if (!Array.isArray(pagesRaw)) {
    throw new Error('No pages found in that saved edit — it does not look like an edit draft.');
  }

  const repairs: string[] = [];
  /* Both places a draft may keep its pictures, without a cast that would make
     the fallback look unreachable to the type checker. */
  const assetsRaw: Record<string, CanvasAsset> =
    (canvasRaw.assets as Record<string, CanvasAsset> | undefined) ??
    (inside.assets as Record<string, CanvasAsset> | undefined) ??
    {};
  const assets: Record<string, CanvasAsset> = {};
  for (const [id, asset] of Object.entries(assetsRaw)) {
    if (asset && typeof asset.src === 'string' && asset.src.startsWith('data:image/')) {
      assets[id] = { src: asset.src, pxW: asset.pxW, pxH: asset.pxH };
    } else {
      repairs.push('an image file was unreadable and was skipped');
    }
  }

  const pages: Array<{ id?: string; objects: CanvasObject[] }> = pagesRaw.map((pageRaw) => {
    const page = (pageRaw ?? {}) as Record<string, unknown>;
    const objectsRaw = Array.isArray(page.objects) ? page.objects : [];
    const objects: CanvasObject[] = [];
    for (const objectRaw of objectsRaw) {
      const object = readObject(objectRaw, assets, repairs);
      if (object) objects.push(object);
    }
    return { id: typeof page.id === 'string' ? page.id : undefined, objects };
  });

  if (!pages.some((page) => page.objects.length)) {
    throw new Error('That saved edit has no blocks in it yet — nothing to open.');
  }

  /* Only keep the pictures something still points at. */
  const used = new Set<string>();
  for (const page of pages) {
    for (const object of page.objects) {
      if (object.type === 'image') used.add(object.assetId);
    }
  }
  for (const id of Object.keys(assets)) {
    if (!used.has(id)) delete assets[id];
  }

  return {
    canvas: { pages, assets },
    savedAt: typeof inside.savedAt === 'string' ? inside.savedAt : undefined,
    jobId: typeof inside.jobId === 'string' ? inside.jobId : undefined,
    fileName: typeof inside.fileName === 'string' ? inside.fileName : undefined,
    repairs: [...new Set(repairs)],
  };
}

/**
 * The draft saved for this resume, or null when there is nothing to open.
 * Never throws: a broken file simply means "start from the PDF".
 */
export async function loadDraft(meta: DraftMeta): Promise<DraftRead | null> {
  try {
    const response = await apiClient('/api/auth/resume');
    if (!response.ok) return null;
    const body = await response.json();
    const canvas = body.data.resume?.canvas;
    return canvas ? { ...parseDraft(JSON.stringify(canvas)), key: draftKey(meta) } : null;
  } catch { return null; }
}

/**
 * DEMO-ONLY PDF writer.
 *
 * The upload/generate/download UI needs a real file to hand back today, before
 * the Python ATS service exists, so this module writes a small, valid PDF
 * in-browser: A4, single column, base-14 Helvetica, plain selectable text.
 *
 * When the ATS service is connected it returns the finished PDF itself and
 * NOTHING in this file is needed any more — delete it and drop the import in
 * `ats-service.ts` (the only place it is used).
 */

export interface ResumeDocument {
  name: string;
  headline: string;
  contacts: string[];
  sections: Array<{
    title: string;
    blocks: Array<{ kind: 'entry' | 'bullet' | 'text'; text: string }>;
  }>;
}

const PAGE_W = 595; // A4, in points
const PAGE_H = 842;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** Average glyph width per font size — good enough for honest line wrapping. */
const AVG_CHAR = 0.5;

function measure(text: string, size: number): number {
  return text.length * size * AVG_CHAR;
}

function wrap(text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];
  for (let index = 1; index < words.length; index += 1) {
    const candidate = `${current} ${words[index]}`;
    if (measure(candidate, size) <= maxWidth) current = candidate;
    else {
      lines.push(current);
      current = words[index];
    }
  }
  lines.push(current);
  return lines;
}

/** PDF strings are ASCII-only: no embedded font, nothing to mis-encode. */
function escapePdfText(value: string): string {
  return value
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[\u2022\u00B7]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u20B9/g, 'Rs ')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

interface Row {
  text: string;
  size: number;
  bold: boolean;
  center: boolean;
  gapBefore: number;
  /** Draw a hairline under this row (section headings). */
  ruleAfter?: boolean;
}

function rowsFor(document: ResumeDocument): Row[] {
  const rows: Row[] = [];
  const push = (row: Row) => rows.push({ ...row, text: escapePdfText(row.text) });

  push({ text: document.name, size: 17, bold: true, center: true, gapBefore: 0 });
  if (document.headline) {
    push({ text: document.headline, size: 10.5, bold: false, center: true, gapBefore: 5 });
  }
  if (document.contacts.length) {
    push({
      text: document.contacts.join(' | '),
      size: 9.5,
      bold: false,
      center: true,
      gapBefore: 3,
    });
  }

  for (const section of document.sections) {
    push({
      text: section.title.toUpperCase(),
      size: 10.5,
      bold: true,
      center: false,
      gapBefore: 14,
      ruleAfter: true,
    });

    for (const block of section.blocks) {
      if (block.kind === 'entry') {
        wrap(block.text, 10.5, CONTENT_W).forEach((line, index) => {
          push({
            text: line,
            size: 10.5,
            bold: true,
            center: false,
            gapBefore: index === 0 ? 7 : 0,
          });
        });
        continue;
      }

      const prefix = block.kind === 'bullet' ? '- ' : '';
      const width = CONTENT_W - prefix.length * 5;
      wrap(block.text, 10, width).forEach((line, index) => {
        push({
          text: index === 0 ? `${prefix}${line}` : line,
          size: 10,
          bold: false,
          center: false,
          gapBefore: index === 0 ? (block.kind === 'bullet' ? 2 : 3) : 0,
        });
      });
    }
  }

  return rows;
}

function buildPages(document: ResumeDocument): string[] {
  const pages: string[] = [];
  let ops: string[] = [];
  let y = PAGE_H - MARGIN;

  const flush = () => {
    pages.push(ops.join('\n'));
    ops = [];
    y = PAGE_H - MARGIN;
  };

  for (const row of rowsFor(document)) {
    const leading = row.size * 1.4;
    y -= row.gapBefore;
    if (y - leading < MARGIN) flush();

    if (row.text) {
      const x = row.center
        ? MARGIN + Math.max((CONTENT_W - measure(row.text, row.size)) / 2, 0)
        : MARGIN;
      ops.push(
        `BT /${row.bold ? 'F2' : 'F1'} ${row.size} Tf 1 0 0 1 ${x.toFixed(
          2,
        )} ${y.toFixed(2)} Tm (${row.text}) Tj ET`,
      );
      y -= leading;
    } else {
      y -= leading;
    }

    if (row.ruleAfter) {
      ops.push(`0.75 G 0.7 w ${MARGIN} ${y.toFixed(2)} m ${PAGE_W - MARGIN} ${y.toFixed(2)} l S`);
      y -= 6;
    }
  }

  flush();
  return pages.length ? pages : [''];
}

/** " | " joined plain text — the most parser-proof export there is. */
export function resumePlainText(document: ResumeDocument): string {
  const lines: string[] = [document.name];
  if (document.headline) lines.push(document.headline);
  if (document.contacts.length) lines.push(document.contacts.join(' | '));
  for (const section of document.sections) {
    lines.push('', section.title.toUpperCase());
    for (const block of section.blocks) {
      lines.push(block.kind === 'bullet' ? `- ${block.text}` : block.text);
    }
  }
  return lines.join('\n').trim();
}

/** Builds the PDF bytes. Returns the blob plus the page count for the UI. */
export function resumePdf(document: ResumeDocument): { blob: Blob; pages: number } {
  const pages = buildPages(document);
  const pageIds = pages.map((_, index) => 3 + index * 2);
  const fontRegularId = 3 + pages.length * 2;
  const fontBoldId = fontRegularId + 1;

  const objects: Array<{ id: number; body: string }> = [
    { id: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' },
    {
      id: 2,
      body: `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds
        .map((id) => `${id} 0 R`)
        .join(' ')}] >>`,
    },
  ];

  pages.forEach((content, index) => {
    const pageId = pageIds[index];
    objects.push({
      id: pageId,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${
        pageId + 1
      } 0 R >>`,
    });
    objects.push({
      id: pageId + 1,
      body: `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    });
  });

  objects.push({
    id: fontRegularId,
    body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  });
  objects.push({
    id: fontBoldId,
    body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  });

  objects.sort((a, b) => a.id - b.id);

  const encoder = new TextEncoder();
  const bytes = (value: string) => encoder.encode(value).length;

  let pdf = '%PDF-1.4\n';
  const offsets: Record<number, number> = {};
  for (const object of objects) {
    offsets[object.id] = bytes(pdf);
    pdf += `${object.id} 0 obj\n${object.body}\nendobj\n`;
  }

  const startxref = bytes(pdf);
  const size = objects.length + 1;
  let xref = `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (const object of objects) {
    xref += `${String(offsets[object.id]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `${xref}trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return { blob: new Blob([pdf], { type: 'application/pdf' }), pages: pages.length };
}

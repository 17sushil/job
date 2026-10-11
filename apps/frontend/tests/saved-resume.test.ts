import test from 'node:test';
import assert from 'node:assert/strict';
import {
  restoreResult,
  type SavedResume,
} from '../src/features/dashboard/candidate/saved-resume';

const stored: SavedResume = {
  fileName: 'resume.pdf',
  dataBase64: '',
  uploadedAt: '2026-10-11T00:00:00Z',
  parsedProfile: null,
  canvas: null,
  atsPdfBase64: Buffer.from('stored service PDF').toString('base64'),
  atsPdfPages: 2,
};
test('restores the stored ATS preview and its actual page count', async () => {
  const restored = restoreResult(stored)!;
  assert.equal(restored.pages, 2);
  assert.equal(await restored.blob.text(), 'stored service PDF');
});
test('latest edited canvas takes precedence over a stale ATS PDF cache', async () => {
  const canvas = {
    pages: [
      {
        objects: [
          {
            type: 'text' as const,
            text: 'Latest edited content',
            x: 20,
            y: 20,
            w: 300,
            style: { size: 12 },
          },
        ],
      },
    ],
    assets: {},
  };
  const restored = restoreResult({ ...stored, canvas })!;
  assert.equal(restored.canvas, canvas);
  assert.equal(restored.pages, 1);
  assert.match(await restored.blob.text(), /Latest edited content/);
  assert(!(await restored.blob.text()).includes('stored service PDF'));
});

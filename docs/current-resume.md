# Current resume and recruiter previews

- Candidate canvas **Save changes** awaits `PUT /api/auth/resume/current`.
- The endpoint validates the PDF and canvas, attempts bounded ATS extraction of the edited PDF, then atomically replaces the candidate's current resume.
- `users.resumePdf` is the edited PDF (`bytea`); `resumeCanvas` is layout JSON with asset references. The previous Base64 upload is cleared.
- `resume_assets.data` holds image bytes (`bytea`, PostgreSQL's binary/BLOB equivalent). The editor converts non-JPEG images to JPEG for PDF embedding. Images unused by the latest canvas are removed. No browser `blob:` URL is persisted.
- Older `resume_versions` rows for that candidate are deleted on a successful canvas save or replacement upload. This implements latest-only storage, not version history. Failed saves leave the previous data intact.
- `parsedProfile` holds structured profile data, not canvas JSON. If ATS extraction is unavailable, the last supplied profile fields are retained and an explicit warning asks the candidate to review them.
- `GET /api/auth/resume` restores the authenticated candidate's current PDF, hydrated canvas assets and profile data.
- `GET /api/candidates/:id/resume` uses the existing recruiter/admin candidate-directory permissions and stamps JobDev onto every page of a copy of the current PDF. It never changes the candidate's clean PDF. Word uploads require the ATS PDF conversion service.
- The recruiter drawer opens and downloads that branded PDF. Candidate watermark controls are removed.
- Experience/Qualifications/Skills tabs edit structured profile fields; **Save profile fields** does not overwrite the separately designed canvas PDF. Use **Edit → Save changes** for PDF/layout changes.
- Completeness uses ten supported, data-derived profile checks; no manually checked signals, video/reference requirements, or reply-rate promises.
- Legacy canvas-only profiles are preserved by a data migration and recognized fields are recovered from their text. Saving the canvas again replaces legacy data with the current storage format and re-extracts profile fields when ATS is available.

## Deployment

Run `pnpm install`, then restart both apps. The backend runs additive migrations automatically. No environment changes are needed. Frontend proxy timeout allows the bounded extraction step to finish.

## Regression checks

From `apps/backend`:

- `pnpm exec vitest run tests/resume/current-resume.test.ts --maxWorkers=1 --minWorkers=1`
- `pnpm exec tsx tests/resume/smoke-current-resume.ts` (opt-in database integration test; creates temporary users and removes them; mocks the ATS response)

From `apps/frontend` (after workspace installation):

- `../backend/node_modules/.bin/tsx --test tests/profile-data.test.ts tests/canvas-pdf.test.ts`

Browser verification also exercised a real ATS extraction: restored upload → add PNG in editor → save → PostgreSQL JPEG bytes → reload → reopen canvas → recruiter View resume. Temporary test accounts were removed afterwards.

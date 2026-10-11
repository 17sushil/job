# Recruiter privacy + candidate view-history integration

## Status and source credit

Prepared on 2026-10-11 on `integration/privacy-and-view-history`, based on stable `f8f5641`.

| Source | Preserved author | Linear integration commit |
| --- | --- | --- |
| `5b97cfd` | Sumit | `4e0a34e` |
| `65fd5df` | Sumit | `5f4eb3d` |
| `74583ac` | Ritik Thakur | `eb5bd8b` |

These are source imports, **not standalone release points**. Deploy only the final integration tip containing the privacy/security and persistence fixes after them. All integration commits use Sushil Ghimire's verified committer identity and subjects ending `- Sushil`. No merge commits or feature-branch rewrites were needed. Source trees and Ritik's combined patch identity were checked before recording the source commits; the working tree was not reset or replayed.

Publication is separate: no public or private branches were pushed from this workspace. Public main/stable were last checked at `f8f5641`. Private main's publication/history remains unverified; do not force-push it.

## Combined behavior

- Sumit's reflowed recruiter resume preview, hidden contact rows, and recruiter-branded PDF download remain available.
- A shared server-side allowlist now returns a keyed candidate alias instead of a readable name. Recruiter responses omit raw parsed profiles, original filenames, original file bytes, images, and canvas metadata.
- Known account/resume identities and recognized contact patterns are removed from professional prose. Contact rows contain keyed HMAC tokens, not readable addresses/numbers concealed only by CSS.
- New applicant APIs, legacy candidate detail/list/PDF APIs, the compatibility applicant route, and recruiter history use the same privacy policy. PDFs are newly generated from sanitized text; the original PDF is never sent to recruiters.
- Candidate discovery remains uncapped, alongside applications to the recruiter's own jobs. Application-specific reads still enforce job ownership. Directory-only rows do not expose another recruiter's application data or show application status controls.
- Application counters/recent-applicant lists exclude directory-only profiles. Directory search uses the visible candidate alias, skills, or role rather than the hidden real name.
- Ritik's unique recruiter/candidate view records, recruiter history, candidate count, and **Who viewed me** screen remain. GET requests do not create views. Reopening a profile does not increase the unique count. Candidate history is scoped to the authenticated candidate, with loading/error/retry states.
- **There is no 50-profile quota or paywall.** Existing abuse rate limits remain; they are not a profile allowance or subscription limit.
- Candidate editing still performs an awaited account save, preserves failed edits, replaces the previous saved PDF/canvas, and stores image bytes in the database. A newer canvas takes precedence over an older ATS preview cache.
- Sumit's download/edit/skip choices and stored ATS-preview recovery remain. ATS PDFs must parse successfully; page counts are measured rather than assumed to be one. DOCX uploads use the correct MIME type, and saved PDF downloads use a `.pdf` filename.
- Owner resume copies retain their identity/images and are not given the recruiter watermark. Existing nonempty login email/mobile values are not replaced by extracted CV contacts; recognized CV names still update the profile.
- Native Axios interceptors, cookie-only auth, Origin/CSRF checks, and account-scoped TanStack queries remain. No API fetching was added to effects; UI lifecycle effects remain where needed.

## Verification

- Backend: **22/22 automated tests passed**, TypeScript build passed, backend ESLint passed without warnings.
- Frontend: **22/22 automated tests passed**, TypeScript passed, production Next build passed.
- Real DB/API suites passed for cookie auth/CSRF/session revocation, current-resume replacement and binary assets, Ritik view isolation/concurrency/cleanup, recruiter privacy/ownership, and ATS-preview handling.
- Privacy API test created temporary fixture accounts, verified **52 distinct viewed candidates without a quota**, and removed its fixtures. It checked masked new/legacy responses, both PDF routes, unchanged owner bytes, cross-recruiter application denial, deleted-account denial, and read-only GET behavior.
- ATS-preview API test used a **mocked upstream transport** with the real database and HTTP handlers: DOCX MIME, `no_watermark=true`, two-page PDF recovery, invalid PDF/JSON fallback, and retained login contacts.
- Browser regressions passed against a production-built frontend and compiled backend, using development cookie mode on localhost: job publication failure/retry, real job fields after F5, candidate job search, unique view history after F5, candidate Who viewed me failure/retry, editor save failure/retry, image persistence, restore after F5, recruiter preview, and PDF download. Recruiter application requests were Axios XHR with CSRF headers on writes; no browser exceptions were observed.
- Independent PDF extraction checked that owner output retained its test name/photo and lacked the JOBDEV watermark; recruiter output retained professional text but omitted the test identity, image resources, and attachments. Both recruiter PDF routes were checked. The browser recruiter preview was visually inspected.
- Unicode generation and multipage canvas reading order are covered by regression tests.

Database suites create UUID-tagged fixtures and remove only their own records in `finally`. Use a dedicated test database when running these yourself. They consume database connections and writes; they are not read-only checks.

### Reproduce from the repository root

Each command is a single line and works independently of shell chaining:

```text
pnpm --filter @jobdev/backend test
pnpm --filter @jobdev/backend exec tsc --noEmit
pnpm --filter @jobdev/frontend exec tsc --noEmit
pnpm --filter @jobdev/backend exec tsx --tsconfig ../frontend/tsconfig.json --test ../frontend/tests/api-client.test.ts ../frontend/tests/canvas-pdf.test.ts ../frontend/tests/profile-data.test.ts ../frontend/tests/query-cache.test.ts ../frontend/tests/saved-resume.test.ts
pnpm build
pnpm --filter @jobdev/backend exec tsx tests/security/cookie-auth-smoke.ts
pnpm --filter @jobdev/backend exec tsx tests/resume/smoke-current-resume.ts
pnpm --filter @jobdev/backend exec tsx tests/ritik/smoke-profile-views.ts
pnpm --filter @jobdev/backend exec tsx tests/privacy/smoke-recruiter-privacy.ts
pnpm --filter @jobdev/backend exec tsx tests/privacy/smoke-ats-preview.ts
```

Browser harnesses and screenshots are workspace verification artifacts, not an installed cross-platform test runner in the repository.

## Deployment notes and limits

- Deploy frontend and backend together at the final integration tip. Run the existing migrations, including the profile-view migration, before serving traffic. No new table is introduced by this integration.
- Keep backend ATS credentials server-only. Use a strong deployment JWT secret. `CONTACT_PEPPER` is optional, minimum 32 characters; if omitted, a domain-separated key is derived from the JWT secret. An explicit random pepper is preferable when aliases should survive JWT-secret rotation. Rotating the effective pepper changes displayed aliases/tokens but not UUID-based view records.
- Bundle `apps/backend/assets/fonts` with the backend. Fonts are local OFL-licensed Noto files; the renderer locates them from source or compiled paths. Latin/Devanagari PDF generation is covered, not universal script/emoji typography certification.
- This is **not a formal anonymity guarantee**. Unknown names, deliberately obfuscated contacts, and identifying career-history details can escape pattern-based prose redaction or permit inference. Original image-only material is withheld, so a resume without usable structured/text content can produce a sparse sanitized copy. Do not use the current redactor as the sole security design for a future paid identity-unlock feature.
- Watermarks are a visual deterrent, not tamper-proof tracking or the privacy boundary. An editable screenshot cannot be guaranteed attributable.
- The existing application shortlist/interview workflow remains session-local where it already was in stable; this integration does not add persistence or delivery for those actions.
- The external ATS service showed an extraction-warning path in one browser run and a response without that warning in another. The live upstream **PDF** endpoint's watermark behavior was not independently certified; its request/validation/fallback contract was tested with a mock. Owner locally generated edited PDFs were independently checked clean.
- Builds still report the existing Next ESLint-plugin configuration notice. Database runs report the driver's upcoming SSL-mode semantics notice. Neither prevented the checks, but review TLS configuration before a future driver upgrade.
- These checks do not substitute for a deployed Render smoke test. No production deployment or remote publication is claimed.

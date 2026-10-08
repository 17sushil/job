# Ritik review integration

## Source and approach

- Source branch: `ritik-review`, tip `8ff14a04707d4a1a5e807bbe8980b72ce0d3b83b`.
- Feature author: **Ritik Thakur**, `188522288+ritikthakur22@users.noreply.github.com`.
- Integration baseline: `08fb63c`, which already contains the cookie-session,
  native Axios-interceptor and TanStack Query changes.
- Integration is linear: port Ritik's feature additions onto the current baseline,
  not a blanket merge of his older auth/storage implementation or pre-repair
  author history. The original review branch is not force-pushed or deleted.

A review of `8ff14a0` and the preceding merge (`dd38269`) against their pre-security
baseline found the following application changes. Supporting files are preserved
under `contrib/ritik-review/`; none are silently discarded.

| Ritik's work | Integrated result |
| --- | --- |
| Job description textarea | Required in the posting UI; sent through the existing Axios/TanStack mutation, stored in `jobs.description`, restored after refresh and visible to candidates/recruiters |
| Minimum qualifications | Required in the UI; validated when supplied, persisted in job metadata, mapped back into both dashboards and shown in job details |
| Preferred qualifications | Optional; same complete write/read/display path |
| Optional salary label | Preserved |
| Viewed candidates sidebar/page | Preserved as an account-scoped query with loading, error/retry and empty states |
| Profile-view entity and unique-view intent | Added migration, unique recruiter/candidate index, history index and foreign keys; concurrent opens cannot create duplicate rows |
| Record profile opens | An explicit UI action issues a CSRF-protected POST mutation; GET profile reads remain side-effect-free |
| Reopen a viewed profile | Loads the actual candidate record and parsed profile; no fabricated application/job/experience stub; recruiter-watermarked resume remains accessible |
| Keyword-box/search refinements | Retained through the existing single upstream keyword/search implementation: no duplicate bar, AND chips, text applied only by Search/Enter, options remain available on empty results |
| Human-readable posted time | Uses `postedTimeText` rather than only a day count |
| Playwright tools, screenshots, diagnostics and empty `FETCH_HEAD` | Retained in `contrib/ritik-review`; diagnostic `test2.js` network call converted to Axios; tools are archival rather than application startup code |

The old change to pass **unfiltered** jobs into the candidate list was not copied:
it would bypass the working Search/AND filters. Its keyword-selection intent is
already supported by the single current search component. Qualification text is
also included in the search match text.

## Integration fixes

The original feature added a TypeORM entity without a migration despite
`synchronize: false`. `1791400000000-ProfileViews.ts` now creates the schema at
backend startup. It does not delete existing data. If a manually-created table
already contains duplicate pairs or orphaned IDs, migration deliberately fails
for review instead of silently removing those records.

New/updated endpoints:

- `GET /api/candidates/views`: only the current recruiter's history; other actors'
  IDs supplied in query strings cannot change the scope.
- `POST /api/candidates/:id/views`: recruiter-only; actor comes from the cookie
  session, not the body; candidate must exist and be active. Returns whether a
  new unique view was created. Repeats preserve the first-view timestamp.
- `GET /api/candidates/:id`: existing authorized profile read, with no tracking write.
- `GET /api/candidates/views/me`: candidate-only count of distinct active recruiter
  viewers. The candidate dashboard's view count is now derived from this endpoint.
- `POST /api/jobs`: validates new fields; authenticated company/poster identity
  cannot be overridden by the body. Optional API fields preserve old title-only
  clients, while the new UI requires description and minimum qualifications.

Queries own all reads and mutations own all writes. No new data-fetching effects,
browser token storage, bearer authentication, browser ATS credentials, or automatic
page-reload effects were introduced. Existing keyboard/focus/URL cleanup effects
remain. A failed job-post mutation keeps the form and every entered field open.
History-only profiles do not show invented application dates, match scores or
pipeline actions. Soft-deleted candidates are omitted from history; permanent
user deletion cascades to their view rows.

## Verification

- Frontend production build and both TypeScript checks passed.
- 20 frontend tests and 13 backend tests passed.
- `tests/ritik/smoke-profile-views.ts`: real migration/database/API checks for role
  and CSRF guards, no tracking on GET, concurrent duplicate suppression, recruiter
  isolation, candidate counts, job-field persistence, soft deletion and FK cleanup.
- Existing cookie/OTP/logout/password-revocation and latest-resume/image/watermark
  database integration tests passed.
- Browser checks passed: failed publish retains draft; successful job fields survive
  refresh and reach candidates; viewed history survives refresh; actual profile and
  PDF reopen; second recruiter has separate history; one search bar; Axios XHR
  requests and CSRF headers.
- Browser auth/cache/F5/logout and manual-deployment-update regressions passed.
- Browser resume editing/image/database save/refresh/recruiter-PDF regression passed.
  External ATS extraction returned the existing save-with-warning response in this
  run; fresh external extraction success is not claimed.
- Test accounts/jobs were UUID-tagged and deleted in cleanup. Real candidate
  resumes were not overwritten.

Run the new integration test from the repository root (development/test DB only):

```cmd
pnpm --filter @jobdev/backend exec tsx tests/ritik/smoke-profile-views.ts
```

The committed API test uses Axios. A source scan found no application `fetch()`
calls and no remaining `fetch()` call in Ritik's copied JavaScript helpers.

## History and publishing boundaries

The integration credits Ritik and preserves the existing corrected `@17sushil`
identity. No pre-repair `sushil@users.noreply.github.com` identity is introduced into
`main` or `stable`. The separately uploaded `ritik-review` source branch still
contains its old ancestry; this integration does not rewrite or delete that branch.
Private repository branches are not changed by a public push. Update your local
`stable` by fast-forward and use a normal push to private `origin/stable`—do not
merge the old review branch wholesale or force-push over teammates' work.

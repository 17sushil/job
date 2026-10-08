# Data flow and local-development performance

## The simple version

1. A screen asks **React Query** for data (session, jobs, applications, resume).
2. React Query checks its **in-memory cache**. A fresh result is reused; concurrent reads of the same key share their work.
3. If a request is needed, **Axios** calls the same-origin `/api/...` endpoint. Cookies travel automatically. There is no browser-readable authentication token.
4. Express checks the cookie, the database session version, authorization, and **Zod** input validation. Unsafe requests also require the CSRF handshake and an allowed Origin.
5. A user action runs a **mutation**. After the server confirms success, we update or invalidate the affected cache entries.

React Query is the server-data owner, not another store beside Zustand. The old authentication store and Response-style Axios facade are gone. Lists are no longer fetched in effects and copied into separate arrays. Forms, selected tabs, canvas edits, and local preview artifacts are still ordinary React UI state.

## Small set of files

| File | Responsibility |
| --- | --- |
| `src/lib/query-client.ts` | One client per browser runtime; isolated clients on server renders; no persistence plugin |
| `src/components/query-provider.tsx` | Provides that client to the app |
| `src/lib/api-client.ts` | Native Axios request/response interceptors, cookie/CSRF transport, typed JSON/blob results, one error shape |
| `src/features/auth/api.ts` | Auth endpoint functions and payload types |
| `src/features/auth/queries.ts` | Shared session query, session cache updates, account-scoped reads |
| Dashboard components | Queries for reads and mutations for actions |
| `candidate/saved-resume.ts` | Pure restoration of a saved file/preview, not another save mechanism |

Paths above are relative to `apps/frontend`.

### Cache and security rules

- Default freshness: 30 seconds; unused data is collected after five minutes. Saved-resume data has a shorter unused-cache lifetime of one minute.
- Private list/resume keys include the account ID. Logout, session expiry, and changing accounts clear the cache.
- Successful OTP verification puts its returned user in `['session']`; it does not immediately call `/me` again. Refresh starts with an empty memory cache and revalidates via `/me`.
- Mutations are never automatically retried; validation/authentication errors are not hidden behind repeated requests.
- Request cancellation uses AbortSignal. In React Strict Mode **development**, a mount/unmount/remount can show an aborted GET followed by its replacement. This is not two completed production reads.
- UI lifecycle effects remain for keyboard handlers, event subscriptions, focus, timers, theme, and object-URL cleanup. API/data loading is not performed inside effects. Deployment mismatches show a manual **Reload to update** button; they never reload automatically from an effect.
- Cookies remain HttpOnly; server-side revocation, role checks, CSRF/Origin protection, and backend-only ATS credentials remain intact.

### What was removed, and what was not

Removed: the duplicate auth store/session helper, Response reconstruction/error parsing wrappers, unused frontend form/Zod dependencies, legacy ATS demo/network fallback scaffolding, unused draft helpers, forced-remount admin refreshes, and obsolete `/api/auth/format` and `/api/auth/resume/draft` routes that the current UI did not call.

Profile updates now accept a JSON object (or null) for `parsedProfile`, not a JSON string wrapped inside JSON. Zod remains at the backend trust boundary; the OTP schema requires six **digits**.

**Real database persistence was not removed.** Original upload, latest-only edited PDF/canvas, binary resume images, recruiter-only watermarking, and factual profile extraction still use the existing supported resume endpoints. Local UI-only interactions were not expanded into new backend features in this refactor.

## Performance changes

- Ordinary account lookups explicitly exclude CV/PDF/canvas columns. Resume endpoints load those columns only when needed. Session-version checks still hit the database.
- OTP issuance no longer re-reads the account immediately after its update when the result is unused.
- Candidate applications and their jobs are read with one join rather than one extra job query per application.
- Role dashboards, resume studio, and canvas editor are lazy loaded.
- `pnpm dev` uses Next 15's Turbopack. The development-only build-check request is disabled; deployment checking is still enabled in production, with an explicit user-controlled update prompt.
- The blanket `no-store` header no longer overrides caching for fingerprinted static JS/CSS. API responses retain `no-store`.

### Observed here, not a promise for your laptop

Environment: the agent's approximately 2 GB Linux sandbox, the configured remote PostgreSQL database, Next 15.5.25 development mode, Chromium, temporary test accounts. No real candidate's resume was changed.

| Measurement | Result |
| --- | --- |
| Serialized repository account result, same account before/after narrow selection | 418,776 bytes → 509 bytes |
| Five lookup durations before | 362 / 121 / 64 / 64 / 63 ms |
| Five lookup durations after | 64 / 61 / 61 / 60 / 61 ms |
| Separate read-only database diagnostic | connection 819 ms; median `SELECT 1` 67 ms |
| Browser login API, after changes | 661 ms |
| Browser OTP verification API | 229 ms |
| Browser `/me` after refresh | 63 ms |
| OTP click → dashboard UI visible | 2,464 ms |
| Next first `/dashboard` compilation in that run | 1,331 ms |
| Next subsequent `/dashboard` responses | 156–257 ms |

The byte measurement is `JSON.stringify` of the repository result, **not** HTTP response size or PostgreSQL wire traffic. The lookup sample is small and includes warm-up effects. There is no before/after end-to-end laptop benchmark here. Reducing the selected row does not mean a proportional reduction in login time.

During editing, the previous long-lived Webpack process also hit memory pressure and took 47.2 seconds to compile the unnecessary `/buildcheck` route. That demonstrates development compilation can dominate a wait; it does not prove the same event caused your laptop's reported 15 seconds.

### Check the laptop separately

Windows CMD, from the project root:

```cmd
set "NODE_ENV=development" && pnpm dev
```

Then, in a second terminal:

```cmd
curl.exe -s -o NUL -w "health=%{http_code} time=%{time_total}s\n" http://localhost:4000/health
```

```cmd
pnpm --filter @jobdev/backend perf:db
```

`perf:db` only connects and runs `SELECT 1` five times; it prints no credentials/user records and changes no data. Health checks alone do not measure database-query latency.

In browser DevTools → Network, compare `/api/auth/login` and `/api/auth/verify-otp` durations with the Next terminal's `Compiling ...` time. Repeat once after the routes are warm. A slow API suggests database/network/password/OTP work; a fast API plus a slow first route suggests compilation, bundle loading, or browser work. If the backend does not start, fix that first: static OTP is deliberately forbidden with `NODE_ENV=production`.

## Verification

- Frontend TypeScript check and production build passed.
- Backend TypeScript check passed.
- Frontend tests: 20 passed, including native Axios interceptors, query deduplication, freshness, account isolation, cache clearing, and no automatic write retries.
- Backend tests: 11 passed, including effect/request boundaries, light account selection, simpler profile validation, resume and security tests.
- Real-database cookie/CSRF/OTP/revocation integration and resume replacement/image/watermark integration passed.
- Browser auth test passed: no browser token storage/headers/query parameters, no immediate `/me` after OTP, one completed `/me` on refresh, saved resume read, and sidebar logout revocation.
- Browser resume test passed: restored upload → editor → image → confirmed database save → refresh → reopened canvas → recruiter PDF. The external ATS service was unavailable in this run; the supported save-with-warning path passed. Fresh external extraction success is **not** claimed for this run.

Unit/integration commands (single-line Windows-compatible commands):

```cmd
pnpm --filter @jobdev/backend test
```
```cmd
cd apps\frontend && ..\backend\node_modules\.bin\tsx --test tests/*.test.ts
```
```cmd
pnpm --filter @jobdev/backend exec tsx tests/security/cookie-auth-smoke.ts
```
```cmd
pnpm --filter @jobdev/backend exec tsx tests/resume/smoke-current-resume.ts
```

## Native Axios interceptors and refresh behavior (2026-10-08)

The shared Axios instance now registers `api.interceptors.request.use(...)` and
`api.interceptors.response.use(...)` **once at module initialization**, not every
render or effect. The old `send()` function no longer implements interception.

- Request interceptor: enforce same-origin API paths, cookie credentials, no
  bearer/basic auth, and a deduplicated CSRF handshake for unsafe methods.
- Response interceptor: normalize JSON and failed-PDF JSON/blob errors, signal
  an expired session to the existing UI boundary, and preserve Axios cancellation.
- A CSRF rejection clears only the handshake cache. It **never automatically
  replays a write**; the next explicit attempt obtains a fresh handshake.
- Endpoint helpers only unwrap response data. They do not duplicate transport
  policies, loading flags, caches or retries.
- TanStack `queryOptions` defines one shared session key/function/freshness policy;
  query observers share in-flight reads and reuse fresh data across screen mounts.
  Queries and mutations still own all API operations.

### What F5 should do

A hard browser refresh starts a new JavaScript runtime and therefore a new
in-memory QueryClient. The HttpOnly authentication cookie survives; the user-data
cache intentionally does not. The refreshed dashboard must read `/me` and its
visible data again. This is **not** an effect loop. We do not hide it with
persisted user records, disabled session checks, infinite freshness or automatic
mutation retries. No browser storage persistence has been introduced.

Within one document, concurrent session consumers are deduplicated, an OTP
response seeds the session without an immediate extra read, and switching screens
reuses fresh queries. Development Strict Mode can still cancel and replace a GET
on its intentional remount; cancellation is preserved and is not a failed write.

New regression coverage includes native interceptor headers/CSRF/error/cancellation
behavior, concurrent Axios-backed session observers, remount cache reuse, and
fresh-cache revalidation. The source-boundary check also rejects page reloads from
effects. Necessary UI lifecycle effects remain by explicit user agreement.

Latest checks for the interceptor update: frontend production build and both
TypeScript checks passed; 20 frontend / 11 backend tests passed. Browser auth,
refresh, cached view switching and saved-resume reopening passed in both Next
Turbopack development mode and a production frontend build (against the
**development test backend**, not a deployed production OTP service). A forced
build-ID mismatch showed the update button without automatic navigation; clicking
it caused exactly one reload. The browser image/save/refresh/recruiter-PDF test
also passed; external ATS extraction returned its supported warning, so fresh
external-extraction success is not claimed.

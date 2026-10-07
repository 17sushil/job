# Cookie-only authentication and Axios

## Implemented boundaries

- Axios is the application HTTP transport in the frontend and backend. `apiClient` returns a Response-compatible facade for existing JSON/PDF consumers; it does not call fetch.
- The browser talks only to the frontend origin, which proxies `/api` to Express. `withCredentials: true` sends the cookie. There is no token response field, Authorization header, custom bearer header, URL token, localStorage or sessionStorage auth fallback.
- The backend uses a signed, HttpOnly, host-only session cookie with SameSite=Lax, Path=/ and a seven-day expiry. Secure is enabled in production. Never put session data in JavaScript-readable preference cookies.
- Browser user/profile state exists only in memory. Every dashboard mount authenticates against `/api/auth/me`. A rejected session cannot be rescued by stale client state.
- Old `jobdev-*` Web Storage entries are deleted automatically on page mount. Theme and simple UI preference cookies are non-sensitive and JavaScript-readable; notifications are memory-only.
- All mutating API requests, including login and logout, require a signed double-submit CSRF token. The matching cookie is HttpOnly; Axios holds the returned CSRF token in memory. Allowed browser origins are listed explicitly in `WEB_ORIGINS`. No wildcard credentialed CORS.
- JWTs are restricted to HS256, issuer `jobdev-cookie-v2`, audience `jobdev-web`, and a database session version. Earlier exported tokens are rejected even if placed in a cookie.
- Logout increments the account's session version, invalidating all existing sessions for that account. Password changes also invalidate previous sessions and issue a new cookie for the current browser.
- OTP verification consumes the OTP atomically; auth endpoints use rate limiting. No OTPs or tokens are logged.
- ATS credentials stay in the backend environment. Browser resume editing/generation/draft operations use account-owned API routes, not a public API key or arbitrary service job IDs.
- Sensitive API responses use Cache-Control: private, no-store.

## Laptop update

Install dependencies, restart both apps, and sign in again. Backend startup runs the additive session-version migration automatically. Local development still supports testing OTP 123456.

The backend defaults to `WEB_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`. If using a different frontend port/host, add its exact origin. Browser-cookie-blocked embedded previews must be opened directly; there is deliberately no insecure fallback.

## Production blockers / operational work

This is not a certification or a full application penetration test.

1. **Real OTP delivery is not implemented in this repository.** Production registration/login/OTP verification intentionally fail closed with 503 until a real delivery integration replaces the guard. Static OTP values are rejected in production. Do not switch NODE_ENV to development to bypass this for a public deployment.
2. Set a strong, random JWT_SECRET (32+ characters), exact HTTPS WEB_ORIGINS, valid database TLS verification, and server-only ATS_API_KEY. The Render template no longer specifies static OTP or disables database certificate checks.
3. The earlier frontend ATS key was public, including in Git history. Removing it from current code does not make that value secret: rotate it at the ATS service and update the backend configuration. Rotate/restrict any other previously published credentials. Do not rewrite shared Git history without team coordination.
4. Existing development/test accounts in a shared database are not deleted automatically. Remove/disable them and use a separate production database before launch. Automatic test-account seeding is disabled in production.
5. Review authorization/privacy policy (including recruiter candidate-directory access), file-upload validation, deployment headers, secrets, rate-limit proxy/IP configuration, logging, backups and dependency updates as a separate full audit.
6. `pnpm audit --prod` reported zero advisories after patched transitive-dependency overrides were installed for this change. This is a point-in-time dependency check, not proof of application security.

## Verification

From apps/backend:
- `pnpm exec vitest run tests/security/source-boundaries.test.ts tests/resume/current-resume.test.ts --maxWorkers=1 --minWorkers=1`
- `pnpm exec tsx tests/security/cookie-auth-smoke.ts` (real DB, temporary account, cleaned up)
- `pnpm exec tsx tests/resume/smoke-current-resume.ts` (real DB, mocked ATS, temporary users cleaned up)

Browser checks exercised Axios/XHR login, OTP, legacy-storage cleanup, HttpOnly cookies, reload revalidation, logout, rejected-session redirects, resume image saving/restoration and recruiter watermarked previews. Cookie and CSRF tests cover missing/invalid CSRF, untrusted Origin, bearer/query/legacy token rejection, OTP replay, logout and password-change revocation.

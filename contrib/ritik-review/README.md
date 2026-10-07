# Ritik's supporting review artifacts

Source: `ritik-review` commit `8ff14a04707d4a1a5e807bbe8980b72ce0d3b83b`, authored by Ritik Thakur.

All supporting files from that commit are retained here: the original screenshots,
Playwright skill/tooling files, diagnostic scripts, and the accidentally tracked
empty `FETCH_HEAD`. They are outside application/agent entry points and do not run
on application startup. The `.agents` documentation here is archival reference,
not application instructions or an installed dependency.

`test2.js` has its network call converted to Axios (authenticated browser cookies
are forwarded within the diagnostic). The old scripts target earlier login/signup
forms and are preserved for reference, **not** advertised as the current regression
suite. They require their own Playwright installation. Do not run them against live
user accounts. Current API integration tests live in `apps/backend/tests/ritik/`.

The application features are integrated into current `apps/backend/src` and
`apps/frontend/src`, rather than copying the old auth/storage/network stack.
See `docs/ritik-integration.md` for the complete feature-by-feature disposition.

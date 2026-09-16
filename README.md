# JobDev

**Get hired faster. Resume to interview-ready in seconds.**

JobDev is a full-stack hiring platform connecting two kinds of users:

- **Job seekers (candidates)**: browse and filter open roles, apply, track every
  application through the hiring pipeline, and see interview schedules and
  notifications in one dashboard.
- **Recruiters**: post jobs, move applicants through a strict hiring workflow
  (New, Shortlisted, Interview, Hired/Rejected), watch analytics, and get
  notified on every applicant action.

---

## Tech stack

| Layer | Technology |
|---|---|
| Workspace | pnpm 9.15.0 + Turborepo monorepo |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3.4, shadcn/ui, lucide-react, react-hook-form, Zod, Zustand |
| Backend | Node.js + Express 4, Zod, TypeORM, bcrypt |
| Data | Postgres 16 (`docker-compose.yml`), Redis 7 (optional) |
| Quality | ESLint 9 flat configs, strict TypeScript, GitHub Actions CI (lint + build) |

## Features

### Auth and onboarding

- Animated role chooser on first visit (Job seeker / Recruiter); the role
  travels in the URL query (`/register?role=...`) into the register request.
- Signup with a single **email-or-phone** identifier, live password strength
  meter, confirm password, and terms checkbox.
- Login with identifier + password, show/hide password, keep me signed in.
- bcrypt password hashing; generic error messages to prevent account
  enumeration.
- Role-aware routing: candidates and recruiters land on their own dashboards.

### Candidate dashboard

- Job search with filters; job cards open a detail drawer.
- Applications tracked through the hiring workflow: New, Shortlisted,
  Interview, Hired, Rejected.
- Interview schedule with a persisted calendar date.
- Profile completeness and notifications that survive reloads.

### Recruiter dashboard

- Job posting with posted date plus pause/cancel dates.
- Applicant pipeline with strict stage rules:
  - New applicant: Shortlist or Reject.
  - Shortlisted: Schedule Interview or Reject.
  - After the interview: Hire, Reject, or Reschedule.
- Analytics: views, applicants, and conversion funnel; stat cards are
  clickable and deep-link into filtered lists.
- Candidate profile views with clickable view counters.
- Persistent notifications.

### UI system

- shadcn/ui + Tailwind; lucide-react icons everywhere (no emoji).
- Dark charcoal-green theme and warm off-white light theme; orange CTA;
  zero gradients.
- Three commented, switchable palette pairs in `globals.css`
  (Forest & Ember active, Plum & Apricot, Crimson & Gold).
- Mobile-first responsive: single viewport on laptops, scrolling on phones.
- Fast micro-animations with no performance cost.

---

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9.15.0 (`npm install -g pnpm@9.15.0`)
- Postgres 16+ on `localhost:5432`, either:
  - Docker: `docker compose up -d postgres` (user/pass/db all `jobdev`), or
  - Native install:
    ```bash
    psql -U postgres -c "CREATE USER jobdev WITH PASSWORD 'jobdev' CREATEDB;"
    psql -U postgres -c "CREATE DATABASE jobdev OWNER jobdev;"
    ```

### Setup

```bash
git clone <repo-url>
cd <repo>
pnpm install
cp apps/backend/.env.example apps/backend/.env   # optional, defaults are sane
pnpm --filter backend migration:run
pnpm dev
```

- Frontend: http://localhost:3000 (login at `/login`, signup at `/register`)
- Backend: http://localhost:4000 (health check at `/health`)

The frontend proxies `/api/*` to the backend via `next.config.js` rewrites, so
the browser only ever talks to one origin.

### Environment variables

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:4000` | backend origin |
| `PORT` | backend | `4000` | API port |
| `DATABASE_URL` | backend | `postgresql://jobdev:jobdev@localhost:5432/jobdev?schema=public` | Postgres connection |

---

## Folder structure

```
apps/
  frontend/
    src/app/(auth)/            # login + register + role chooser
    src/app/(dashboard)/       # role-aware dashboards
    src/components/ui/         # shadcn/ui primitives
    src/features/auth/         # forms, schemas, api client
    src/features/dashboard/    # candidate + recruiter views
    src/store/                 # zustand auth + theme stores
  backend/
    src/modules/auth/          # register + login
    src/modules/user/          # user entity + CRUD
    src/database/              # TypeORM data source + migrations
    src/middlewares/           # validate, errorHandler, auth
.github/workflows/ci.yml       # lint + build on every push
packages/                      # shared types + configs
docker-compose.yml             # postgres + redis
```

---

## Auth API

| Method | Endpoint | Body | Success |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ identifier, role: "candidate" \| "recruiter", password, confirmPassword }` (identifier = email or phone) | `201` + user |
| `POST` | `/api/auth/login` | `{ identifier, password }` | `200` + `{ user, token }` |

Error responses use `{ message, errors?: [{ field, message }] }`.

---

## Design system

Charcoal-green dark theme, warm off-white light theme, orange CTA, no
gradients. The full palette lives as HSL CSS variables in
`apps/frontend/src/app/globals.css` (three commented palette pairs) and is
mapped into Tailwind in `tailwind.config.ts`.

---

## Commit conventions

- **Branches:** `<type>/<scope>/<YourName>`, e.g. `feat/auth/Sushil`
- **Commits:** Conventional Commits with your name at the end, e.g.
  `feat(auth): add login and signup with role selection - Sushil`
- Keep commits atomic so reviewers can follow one logical change per commit.

---

## Known gaps / next tickets

- [x] Postgres persistence via TypeORM + bcrypt hashing
- [x] Strict hiring workflow + recruiter analytics
- [ ] Real JWTs + httpOnly cookie sessions (demo tokens today)
- [ ] Resume upload + parsing inside the 30-second budget
- [ ] ATS-tailored resume generation
- [ ] Real-time messaging (the Messages UI is demo-only today)
- [ ] Recruiter spam filtering + business-email verification

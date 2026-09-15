import type { ReactNode } from 'react';
import { FileText, ShieldCheck, Timer, Zap } from 'lucide-react';

import { Logo } from '@/components/logo';

const HIGHLIGHTS = [
  {
    icon: FileText,
    title: 'Resume → profile, instantly',
    text: 'Upload once and we auto-build your profile with accurate data.',
  },
  {
    icon: Zap,
    title: 'ATS-ready resume in <30s',
    text: 'Tailored to the job and ATS the recruiter requires.',
  },
  {
    icon: ShieldCheck,
    title: 'Your data stays private',
    text: 'Resumes are encrypted and shared only with verified recruiters.',
  },
  {
    icon: Timer,
    title: 'Beat the clock',
    text: 'Parsing, profile sync and resume generation — all under 30 seconds.',
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-info p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative">
          <Logo variant="light" size={44} />
        </div>

        <div className="relative max-w-md space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            From resume to interview,{' '}
            <span className="text-white/80">in under 30 seconds.</span>
          </h2>
          <p className="text-sm leading-relaxed text-white/80">
            JobDev matches you with jobs you&apos;ll actually love, rebuilds
            your resume for each ATS, and gets you noticed faster.
          </p>

          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-white/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} JobDev · Trusted by job seekers &amp;
          verified recruiters
        </p>
      </aside>

      {/* Form column */}
      <main className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
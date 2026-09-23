'use client';

import type { ReactNode } from 'react';
import {
  FileText,
  ShieldCheck,
  Sparkles,
  Timer,
  Zap,
} from 'lucide-react';

import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCountUp } from '@/lib/use-count-up';
import { useThemeEffect } from '@/store/theme';

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
    text: 'Parsing, profile sync and resume generation - all under 30 seconds.',
  },
];

function PanelStat({
  value,
  suffix,
  label,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  delay: number;
}) {
  const count = useCountUp(value);
  return (
    <div
      className="animate-fade-in-up flex flex-col items-center rounded-xl bg-white/10 px-2 py-3 backdrop-blur transition-transform hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-xl font-bold">
        {count.toLocaleString()}
        <span className="text-white/70">{suffix}</span>
      </span>
      <span className="text-[11px] font-medium text-white/70">{label}</span>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  useThemeEffect();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-panel p-10 text-panel-foreground lg:flex lg:flex-col lg:justify-between">
        {/* Animated light blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-blob"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-blob"
          style={{ animationDelay: '-7s' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/3 top-1/2 h-56 w-56 rounded-full bg-white/5 blur-2xl animate-blob"
          style={{ animationDelay: '-12s' }}
        />

        <div className="relative flex items-center justify-between">
          <div className="animate-pop-in">
            <Logo variant="light" size={44} />
          </div>
          <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold backdrop-blur" style={{ animationDelay: '150ms' }}>
            <Sparkles className="h-3.5 w-3.5 animate-pulse-dot" />
            Hiring made human
          </span>
        </div>

        <div className="relative max-w-md space-y-6">
          <h2
            className="animate-fade-in-up text-3xl font-bold leading-tight"
            style={{ animationDelay: '200ms' }}
          >
            From resume to interview,{' '}
            <span className="text-cta">
              in under 30 seconds.
            </span>
          </h2>
          <p
            className="animate-fade-in-up text-sm leading-relaxed text-white/80"
            style={{ animationDelay: '280ms' }}
          >
            JobDev matches you with jobs you&apos;ll actually love, rebuilds
            your resume for each ATS, and gets you noticed faster.
          </p>

          <ul className="space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }, index) => (
              <li
                key={title}
                className="sheen-hover animate-fade-in-up flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur transition-all duration-300 hover:translate-x-1 hover:bg-white/15"
                style={{ animationDelay: `${360 + index * 90}ms` }}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 transition-transform group-hover:scale-110">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-white/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div
            className="animate-fade-in-up grid grid-cols-3 gap-3"
            style={{ animationDelay: '760ms' }}
          >
            <PanelStat value={12400} suffix="+" label="Live jobs" delay={760} />
            <PanelStat value={3200} suffix="+" label="Companies" delay={840} />
            <PanelStat value={96} suffix="%" label="Match score" delay={920} />
          </div>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} JobDev · Trusted by job seekers &amp;
          verified recruiters
        </p>
      </aside>

      {/* Form column - stacks logo above the form on small screens. */}
      <main className="relative flex flex-col items-center justify-center bg-background p-6 sm:p-10">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>
        <div className="mb-6 lg:hidden">
          <Logo size={40} />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
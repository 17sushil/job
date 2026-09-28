'use client';

import type { ReactNode } from 'react';
import { Briefcase, ShieldCheck, UserRound } from 'lucide-react';

import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useThemeEffect } from '@/store/theme';

const HIGHLIGHTS = [
  {
    icon: UserRound,
    title: 'For candidates',
    text: 'Create an account, browse open roles and apply in one click.',
  },
  {
    icon: Briefcase,
    title: 'For recruiters',
    text: 'Complete your company profile and start to hire.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by default',
    text: 'OTP-protected sign in and private profile data.',
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  useThemeEffect();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between gap-6 overflow-hidden bg-panel p-8 text-panel-foreground lg:flex lg:sticky lg:top-0 lg:h-screen xl:p-10">
        <Logo variant="light" size={44} />

        <div className="flex min-h-0 flex-col justify-center gap-5">
          <h2 className="animate-fade-in-up text-2xl font-bold leading-tight xl:text-3xl">
            The simple way to connect candidates and recruiters.
          </h2>
          <img
            src="/jobdev-auth-poster.png"
            alt="JobDev - get hired faster"
            className="mx-auto hidden max-h-[42vh] w-auto max-w-full rounded-2xl border border-white/10 object-contain shadow-lg lg:block"
          />
          <ul className="space-y-2.5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex items-start gap-3 rounded-xl bg-white/10 p-3"
              >
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

        <p className="text-xs text-white/60">
          © {new Date().getFullYear()} JobDev
        </p>
      </aside>

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

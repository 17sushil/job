'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Building2,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
} from 'lucide-react';

import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/lib/use-count-up';
import { useAuthStore } from '@/store/auth';
import { useThemeEffect } from '@/store/theme';
import type { UserRole } from '@/features/auth/schemas';

const OPTIONS: Array<{
  value: UserRole;
  title: string;
  description: string;
  icon: typeof UserRound;
}> = [
  {
    value: 'candidate',
    title: 'Job seeker',
    description:
      'Find your next opportunity and get an ATS-ready resume in under 30 seconds.',
    icon: UserRound,
  },
  {
    value: 'recruiter',
    title: 'Recruiter',
    description:
      'Post jobs and get matched with the highest-ranking candidates.',
    icon: Briefcase,
  },
];

const MARQUEE_ITEMS = [
  'Engineering',
  'Design',
  'Product',
  'Data Science',
  'Marketing',
  'Remote-first',
  'Operations',
  'Finance',
  'Internships',
  'Startups',
];

const FLOATING_CHIPS = [
  { icon: Briefcase, className: 'left-[8%] top-[18%] animate-float' },
  { icon: Search, className: 'right-[10%] top-[24%] animate-float-slow' },
  { icon: MapPin, className: 'left-[14%] bottom-[22%] animate-float-slow' },
  { icon: Building2, className: 'right-[12%] bottom-[18%] animate-float' },
];

function Stat({
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
      className="animate-fade-in-up flex flex-col items-center gap-0.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {count.toLocaleString()}
        <span className="text-primary">{suffix}</span>
      </span>
      <span className="text-xs font-medium text-muted-foreground sm:text-sm">
        {label}
      </span>
    </div>
  );
}

export function RoleChooser() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [selected, setSelected] = useState<UserRole | null>(null);

  useThemeEffect();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  function choose(role: UserRole) {
    if (selected) return;
    setSelected(role);
    // Pass the role through the URL instead of localStorage.
    // Instant client-side navigation - no artificial delay.
    router.push(`/register?role=${role}`);
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-14">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      {/* Layered animated background - transform-only, GPU composited. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.05)_1px,transparent_1px)] bg-[size:36px_36px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl animate-blob"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-info/15 blur-3xl animate-blob"
        style={{ animationDelay: '-5s' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-success/10 blur-3xl animate-blob"
        style={{ animationDelay: '-10s' }}
      />

      {/* Floating icon chips */}
      {FLOATING_CHIPS.map(({ icon: Icon, className }, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute hidden h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card/80 text-primary shadow-lg backdrop-blur lg:flex',
            className,
          )}
          style={{ animationDelay: `${index * -1.7}s` }}
        >
          <Icon className="h-5 w-5" />
        </span>
      ))}

      <div
        className={cn(
          'relative flex w-full max-w-3xl flex-col items-center text-center transition-all duration-500',
          selected && '-translate-y-3 scale-[0.98] opacity-0',
        )}
      >
        <div className="animate-pop-in">
          <Logo size={52} />
        </div>

        <div
          className="animate-fade-in-up mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-primary-dark shadow-sm"
          style={{ animationDelay: '100ms' }}
        >
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
          Hiring made human - 2,400+ matches this week
        </div>

        <h1
          className="animate-fade-in-up mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl"
          style={{ animationDelay: '180ms' }}
        >
          Where great teams
          <br />
          meet <span className="text-animated-gradient">great talent</span>
        </h1>

        <p
          className="animate-fade-in-up mt-4 max-w-md text-muted-foreground"
          style={{ animationDelay: '260ms' }}
        >
          One platform for both sides of the offer letter. Pick your path to
          get started.
        </p>

        {/* Animated stats */}
        <div
          className="animate-fade-in-up mt-8 grid w-full max-w-md grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card/70 py-4 shadow-sm backdrop-blur"
          style={{ animationDelay: '340ms' }}
        >
          <Stat value={12400} suffix="+" label="Live jobs" delay={340} />
          <Stat value={3200} suffix="+" label="Companies" delay={420} />
          <Stat value={96} suffix="%" label="Match score" delay={500} />
        </div>

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
          {OPTIONS.map(({ value, title, description, icon: Icon }, index) => {
            const isSelected = selected === value;
            const dimmed = selected !== null && !isSelected;

            return (
              <button
                key={value}
                type="button"
                onClick={() => choose(value)}
                disabled={selected !== null}
                className={cn(
                  'group sheen-hover animate-fade-in-up relative flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none',
                  isSelected &&
                    'scale-[1.02] border-primary shadow-xl ring-4 ring-primary/20',
                  dimmed && 'scale-95 opacity-40 blur-[1px]',
                )}
                style={{ animationDelay: `${420 + index * 100}ms` }}
              >
                <span
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg',
                    isSelected && 'bg-primary text-primary-foreground',
                  )}
                >
                  <Icon className="h-7 w-7 group-hover:animate-wiggle" />
                </span>
                <span>
                  <span className="block text-lg font-semibold">{title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {description}
                  </span>
                </span>
                <span
                  className={cn(
                    'mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary',
                    isSelected && 'text-primary-dark',
                  )}
                >
                  {isSelected ? (
                    'Continue…'
                  ) : (
                    <>
                      Continue as {title}
                      <TrendingUp className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <p
          className="animate-fade-in-up mt-10 text-sm text-muted-foreground"
          style={{ animationDelay: '640ms' }}
        >
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Category marquee */}
      <div
        aria-hidden="true"
        className="animate-fade-in pointer-events-none absolute inset-x-0 bottom-0 border-t border-border bg-card/60 py-3 backdrop-blur"
        style={{ animationDelay: '800ms' }}
      >
        <div className="flex overflow-hidden">
          <div className="flex min-w-full shrink-0 animate-marquee items-center justify-around gap-8">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
              <span
                key={index}
                className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                <Sparkles className="h-3.5 w-3.5 text-info" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div className="animate-fade-in absolute inset-x-0 bottom-24 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Preparing your space…
        </div>
      )}
    </main>
  );
}

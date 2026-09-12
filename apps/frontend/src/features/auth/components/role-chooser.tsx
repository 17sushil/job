'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, Sparkles, UserRound } from 'lucide-react';

import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
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

export function RoleChooser() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [selected, setSelected] = useState<UserRole | null>(null);

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  function choose(role: UserRole) {
    if (selected) return;
    setSelected(role);
    // Pass the role through the URL instead of localStorage.
    setTimeout(() => router.push(`/register?role=${role}`), 700);
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-info/10 blur-3xl"
      />

      <div
        className={cn(
          'relative flex w-full max-w-3xl flex-col items-center text-center transition-all duration-500',
          selected && '-translate-y-3 scale-[0.98] opacity-0',
        )}
      >
        <div className="animate-fade-in-up">
          <Logo size={48} />
        </div>

        <h1
          className="animate-fade-in-up mt-8 text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ animationDelay: '80ms' }}
        >
          Welcome to JobDev
        </h1>
        <p
          className="animate-fade-in-up mt-3 max-w-md text-muted-foreground"
          style={{ animationDelay: '160ms' }}
        >
          How would you like to use JobDev? Pick one to get started.
        </p>

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
                  'group animate-fade-in-up flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none',
                  isSelected &&
                    'scale-[1.02] border-primary shadow-xl ring-4 ring-primary/20',
                  dimmed && 'scale-95 opacity-40 blur-[1px]',
                )}
                style={{ animationDelay: `${220 + index * 90}ms` }}
              >
                <span
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary transition-colors',
                    isSelected && 'bg-primary text-primary-foreground',
                  )}
                >
                  <Icon className="h-7 w-7" />
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
                  {isSelected ? 'Continue…' : `Continue as ${title}`}
                </span>
              </button>
            );
          })}
        </div>

        <p
          className="animate-fade-in-up mt-10 text-sm text-muted-foreground"
          style={{ animationDelay: '420ms' }}
        >
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary-hover"
          >
            Sign in
          </Link>
        </p>
      </div>

      {selected && (
        <div className="animate-fade-in absolute inset-x-0 bottom-10 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Preparing your space…
        </div>
      )}
    </main>
  );
}
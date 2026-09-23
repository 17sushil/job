'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Loader2, Sparkles, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { AccountMenu } from '@/features/dashboard/account-menu';
import { meRequest } from '@/features/auth/api';
import { errorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth';
import { useThemeEffect } from '@/store/theme';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useThemeEffect();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate the session from the httpOnly cookie exactly once per visit.
  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;

    meRequest()
      .then((sessionUser) => {
        if (!cancelled) setUser(sessionUser);
      })
      .catch((error) => {
        if (cancelled) return;
        // No valid session cookie: back to sign-in.
        console.warn(errorMessage(error, 'Session expired'));
        logout();
        router.replace('/login');
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, setUser, logout, router]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4">
          <Link href="/dashboard">
            <Logo size={34} showTagline={false} />
          </Link>

          {mounted && (
            <div className="flex items-center gap-2 sm:gap-3">
              {user && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark">
                  {user.role === 'recruiter' ? (
                    <Briefcase className="h-3.5 w-3.5" />
                  ) : (
                    <UserRound className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {user.role === 'recruiter' ? 'Recruiter' : 'Job seeker'}
                  </span>
                </span>
              )}
              {/* Premium upsell sits on the same level as the theme toggle. */}
              <button
                type="button"
                title="Go Premium - AI ranking, unlimited posts & priority listing (coming soon)"
                aria-label="Go Premium"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cta text-cta-foreground shadow-sm transition-all hover:scale-110"
              >
                <Sparkles className="h-4 w-4" />
              </button>
              <ThemeToggle />
              {user && <AccountMenu />}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 lg:py-4">
        {!hydrated ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
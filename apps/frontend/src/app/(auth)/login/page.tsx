import type { Metadata } from 'next';
import Link from 'next/link';

import { Logo } from '@/components/logo';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = { title: 'Login' };

export default function LoginPage() {
  return (
    <div className="animate-fade-in-up space-y-6">
      <header className="space-y-2 text-center lg:text-left">
        <Logo className="mx-auto justify-center lg:hidden" />
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue your job search.
        </p>
      </header>

      <LoginForm />

      <details className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <summary className="cursor-pointer select-none font-semibold text-muted-foreground">
          Shared team logins (demo)
        </summary>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>
            Candidate: <span className="font-mono">candidate@jobdev.app</span>{' '}
            / <span className="font-mono">Candidate123</span>
          </li>
          <li>
            Recruiter: <span className="font-mono">recruiter@jobdev.app</span>{' '}
            / <span className="font-mono">Recruiter123</span>
          </li>
          <li>
            Admin: <span className="font-mono">admin@jobdev.app</span> /{' '}
            <span className="font-mono">Admin12345</span>
          </li>
        </ul>
      </details>

      <p className="text-center text-sm text-muted-foreground">
        New to JobDev?{' '}
        <Link
          href="/register"
          className="font-medium text-primary hover:text-primary-hover"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
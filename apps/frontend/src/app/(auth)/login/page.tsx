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

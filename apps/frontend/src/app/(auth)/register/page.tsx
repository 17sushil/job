import type { Metadata } from 'next';
import Link from 'next/link';

import { Logo } from '@/components/logo';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center lg:text-left">
        <Logo className="mx-auto justify-center lg:hidden" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join JobDev and get hired faster.
        </p>
      </header>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary-hover"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
import type { Metadata } from 'next';
import Link from 'next/link';

import { Logo } from '@/components/logo';
import { RegisterForm } from '@/features/auth/components/register-form';
import type { UserRole } from '@/features/auth/schemas';

export const metadata: Metadata = { title: 'Create account' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  // Extract the role from the address bar (URL query param) and hand it to
  // the client form, which merges it into the register request.
  const { role } = await searchParams;
  const initialRole: UserRole | undefined =
    role === 'candidate' || role === 'recruiter' ? role : undefined;

  return (
    <div className="animate-fade-in-up space-y-6">
      <header className="space-y-2 text-center lg:text-left">
        <Logo className="mx-auto justify-center lg:hidden" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join JobDev and get hired faster.
        </p>
      </header>

      <RegisterForm initialRole={initialRole} />

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
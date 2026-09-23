import type { Metadata } from 'next';

import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return (
    <div className="animate-fade-in-up space-y-6">
      <header className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your account email and we will issue a one-time code.
        </p>
      </header>

      <ForgotPasswordForm />
    </div>
  );
}

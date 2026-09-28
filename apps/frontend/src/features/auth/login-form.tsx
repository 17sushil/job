'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginRequest, readApiError } from '@/features/auth/api';
import { OtpStep } from '@/features/auth/otp-step';
import { PasswordInput } from '@/features/auth/password-input';

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCredentials = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier.trim() || !password) {
      toast({ title: 'Enter your email/phone and password', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await loginRequest(identifier.trim(), password);

      if (!res.ok) {
        toast({ title: await readApiError(res), variant: 'destructive' });
        return;
      }

      toast({ title: 'Password verified. Enter the OTP sent to you.', variant: 'success' });
      setStep('otp');
    } catch {
      toast({ title: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'otp') {
    return (
      <OtpStep
        identifier={identifier.trim()}
        notice="Enter the OTP for"
        backLabel="Back to password"
        onBack={() => setStep('credentials')}
        onVerified={() => {
          toast({ title: 'Logged in successfully', variant: 'success' });
          router.push('/dashboard');
        }}
      />
    );
  }

  return (
    <form onSubmit={handleCredentials} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="identifier">Email or phone</Label>
        <Input
          id="identifier"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="you@example.com or 98XXXXXXXX"
          autoComplete="username"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Checking…' : 'Continue'}
      </Button>
    </form>
  );
}

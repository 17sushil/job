'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  loginRequest,
  readApiError,
  verifyOtpRequest,
} from '@/features/auth/api';

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const handleCredentials = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier.trim() || !password) {
      toast.error('Enter your email/phone and password');
      return;
    }

    setSubmitting(true);
    try {
      const res = await loginRequest(identifier.trim(), password);

      if (!res.ok) {
        toast.error(await readApiError(res));
        return;
      }

      toast.success('Password verified. Enter the OTP sent to you.');
      setStep('otp');
      setTimeout(() => otpInputRef.current?.focus(), 50);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }

    setSubmitting(true);
    try {
      const res = await verifyOtpRequest(identifier.trim(), otp);

      if (!res.ok) {
        toast.error(await readApiError(res));
        return;
      }

      toast.success('Logged in successfully');
      router.push('/dashboard');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'otp') {
    return (
      <form onSubmit={handleOtp} className="animate-pop-in space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-primary-light px-3 py-2.5 text-sm text-primary-dark">
          <KeyRound className="h-4 w-4 shrink-0" />
          <span>
            Enter the 6-digit OTP for <strong>{identifier}</strong>. For
            testing, use <strong>123456</strong>.
          </span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">One-time password</Label>
          <Input
            id="otp"
            ref={otpInputRef}
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="text-center text-lg tracking-[0.5em]"
            autoComplete="one-time-code"
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Verifying…' : 'Verify and log in'}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setStep('credentials');
            setOtp('');
          }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to password
        </Button>
      </form>
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
        <Input
          id="password"
          type="password"
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

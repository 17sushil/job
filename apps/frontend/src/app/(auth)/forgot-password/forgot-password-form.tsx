'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Loader2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  forgotPasswordRequest,
  verifyOtpRequest,
  type ApiEnvelope,
} from '@/features/auth/api';
import { FormBanner } from '@/features/auth/components/form-banner';
import { InputWithIcon } from '@/features/auth/components/input-with-icon';
import { PasswordInput } from '@/features/auth/components/password-input';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ForgotPasswordForm() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function onSubmitRequest(event: React.FormEvent) {
    event.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    setNotice('');
    try {
      const response = await forgotPasswordRequest(email.trim());
      const body = (await response
        .json()
        .catch(() => null)) as ApiEnvelope<unknown> | null;
      if (!response.ok) {
        throw new Error(body?.message ?? 'Something went wrong. Please try again.');
      }
      setStep('reset');
      setNotice(
        'If this email is registered, a 6-digit code has been issued. Demo mode: the code is printed in the backend console.',
      );
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong.',
      );
    }
  }

  async function onSubmitReset(event: React.FormEvent) {
    event.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    setNotice('');
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setErrorMessage('Passwords do not match');
      return;
    }
    try {
      const response = await verifyOtpRequest({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      const body = (await response
        .json()
        .catch(() => null)) as ApiEnvelope<unknown> | null;
      if (!response.ok) {
        throw new Error(body?.message ?? 'Something went wrong. Please try again.');
      }
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong.',
      );
    }
  }

  if (status === 'success') {
    return (
      <Card className="w-full">
        <CardContent className="space-y-4 p-6">
          <FormBanner tone="success">Password reset successfully.</FormBanner>
          <Link href="/login" className="block">
            <Button type="button" size="lg" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {status === 'error' && (
            <FormBanner tone="error">{errorMessage}</FormBanner>
          )}
          {step === 'reset' && notice && (
            <FormBanner tone="success">{notice}</FormBanner>
          )}
        </div>

        {step === 'request' ? (
          <form
            onSubmit={onSubmitRequest}
            className="mt-4 space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">Account email</Label>
              <InputWithIcon
                id="forgot-email"
                icon={<Mail className="h-4 w-4" />}
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={status === 'submitting' || !email.trim()}
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending code…
                </>
              ) : (
                'Send one-time code'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={onSubmitReset} className="mt-4 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="otp">6-digit code</Label>
              <InputWithIcon
                id="otp"
                icon={<KeyRound className="h-4 w-4" />}
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput
                id="new-password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-new-password">Confirm new password</Label>
              <PasswordInput
                id="confirm-new-password"
                placeholder="Re-enter the new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={
                status === 'submitting' || !otp.trim() || !newPassword
              }
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting…
                </>
              ) : (
                'Reset password'
              )}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep('request');
                setOtp('');
                setStatus('idle');
                setErrorMessage('');
              }}
              className="mx-auto block text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Remembered it?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary-hover"
          >
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

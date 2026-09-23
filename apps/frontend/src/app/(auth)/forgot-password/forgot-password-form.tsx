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
} from '@/features/auth/api';
import { FormBanner } from '@/features/auth/components/form-banner';
import { errorMessage as getErrorMessage } from '@/lib/api-client';
import { InputWithIcon } from '@/features/auth/components/input-with-icon';
import { PasswordInput } from '@/features/auth/components/password-input';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ForgotPasswordForm() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function onSubmitRequest(event: React.FormEvent) {
    event.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    setNotice('');
    try {
      await forgotPasswordRequest(identifier.trim());
      setStep('reset');
      setNotice(
        'If this account exists, a 6-digit code has been issued. Demo mode: the code is printed in the backend console.',
      );
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        getErrorMessage(error, 'Something went wrong. Please try again.'),
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
      await verifyOtpRequest({
        identifier: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        getErrorMessage(error, 'Something went wrong. Please try again.'),
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
              <Label htmlFor="forgot-identifier">Email or phone</Label>
              <InputWithIcon
                id="forgot-identifier"
                icon={<Mail className="h-4 w-4" />}
                placeholder="you@company.com or +977 98…"
                autoComplete="email"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={status === 'submitting' || !identifier.trim()}
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
              Use a different email or phone
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

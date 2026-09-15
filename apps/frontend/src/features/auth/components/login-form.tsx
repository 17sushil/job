'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, Loader2, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  loginRequest,
  type ApiEnvelope,
  type LoginResult,
} from '@/features/auth/api';
import { loginSchema, type LoginInput } from '@/features/auth/schemas';
import { FormBanner } from '@/features/auth/components/form-banner';
import { InputWithIcon } from '@/features/auth/components/input-with-icon';
import { PasswordInput } from '@/features/auth/components/password-input';
import { useAuthStore } from '@/store/auth';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  async function onSubmit(values: LoginInput) {
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await loginRequest(values.identifier, values.password);
      const body = (await response
        .json()
        .catch(() => null)) as ApiEnvelope<LoginResult> | null;

      if (!response.ok) {
        throw new Error(body?.message ?? 'Login failed. Please try again.');
      }

      // Persist the signed-in user (with their role) for the dashboard.
      if (body?.data?.user) {
        setUser(body.data.user);
      }

      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong.',
      );
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {status === 'error' && (
            <FormBanner tone="error">{errorMessage}</FormBanner>
          )}
          {status === 'success' && (
            <FormBanner tone="success">
              Logged in successfully. Redirecting…
            </FormBanner>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="identifier">Email or phone</Label>
            <InputWithIcon
              id="identifier"
              icon={<AtSign className="h-4 w-4" />}
              placeholder="you@company.com or +977 98…"
              autoComplete="email"
              aria-invalid={Boolean(errors.identifier)}
              {...register('identifier')}
            />
            {errors.identifier && (
              <p className="text-xs text-destructive">
                {errors.identifier.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:text-primary-hover"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              icon={<Lock className="h-4 w-4" />}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <Label
              htmlFor="remember"
              className="text-sm font-normal text-muted-foreground"
            >
              Keep me signed in
            </Label>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={status === 'submitting' || status === 'success'}
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
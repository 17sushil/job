'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, Mail, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { registerRequest } from '@/features/auth/api';
import { registerSchema, type RegisterInput } from '@/features/auth/schemas';
import { FormBanner } from '@/features/auth/components/form-banner';
import { InputWithIcon } from '@/features/auth/components/input-with-icon';
import { PasswordInput } from '@/features/auth/components/password-input';
import { PasswordStrength } from '@/features/auth/components/password-strength';
import { RoleSelector } from '@/features/auth/components/role-selector';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function RegisterForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const password = watch('password');

  async function onSubmit(values: RegisterInput) {
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await registerRequest(values);
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          body?.message ?? 'Registration failed. Please try again.',
        );
      }

      setStatus('success');
      setTimeout(() => router.push('/login'), 1200);
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
              Account created. Redirecting to sign in…
            </FormBanner>
          )}

          <div className="space-y-1.5">
            <Label>I am a…</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <RoleSelector value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <InputWithIcon
              id="email"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              placeholder="you@company.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <InputWithIcon
              id="phone"
              type="tel"
              inputMode="tel"
              icon={<Phone className="h-4 w-4" />}
              placeholder="+977 98XXXXXXXX"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              icon={<Lock className="h-4 w-4" />}
              placeholder="Create a strong password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <PasswordStrength value={password} />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              icon={<Lock className="h-4 w-4" />}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <Controller
              name="terms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="terms"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  className="mt-0.5"
                />
              )}
            />
            <div className="space-y-0.5">
              <Label
                htmlFor="terms"
                className="text-sm font-normal text-muted-foreground"
              >
                I agree to the{' '}
                <Link
                  href="/terms"
                  className="font-medium text-primary hover:text-primary-hover"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="font-medium text-primary hover:text-primary-hover"
                >
                  Privacy Policy
                </Link>
              </Label>
              {errors.terms && (
                <p className="text-xs text-destructive">
                  {errors.terms.message}
                </p>
              )}
            </div>
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
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
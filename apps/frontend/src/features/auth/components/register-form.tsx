'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, Loader2, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { registerRequest } from '@/features/auth/api';
import { errorMessage as getErrorMessage } from '@/lib/api-client';
import {
  registerSchema,
  type RegisterInput,
  type UserRole,
} from '@/features/auth/schemas';
import { FormBanner } from '@/features/auth/components/form-banner';
import { InputWithIcon } from '@/features/auth/components/input-with-icon';
import { PasswordInput } from '@/features/auth/components/password-input';
import { PasswordStrength } from '@/features/auth/components/password-strength';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function RegisterForm({ initialRole }: { initialRole?: UserRole }) {
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
      identifier: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const password = watch('password');

  // A role must arrive via the URL (from the landing page) before signing up.
  useEffect(() => {
    if (!initialRole) {
      router.replace('/');
    }
  }, [initialRole, router]);

  async function onSubmit(values: RegisterInput) {
    if (!initialRole) return;
    setStatus('submitting');
    setErrorMessage('');

    try {
      // Merge the role (extracted from the URL) into the register request.
      await registerRequest({
        identifier: values.identifier,
        role: initialRole.toUpperCase(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      setStatus('success');
      setTimeout(() => router.push('/login'), 1200);
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        getErrorMessage(error, 'Registration failed. Please try again.'),
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
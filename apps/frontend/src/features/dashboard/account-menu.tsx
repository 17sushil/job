'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronDown,
  KeyRound,
  Loader2,
  LogOut,
  UserRound,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  changePasswordRequest,
  logoutRequest,
  updateProfileRequest,
} from '@/features/auth/api';
import { errorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth';

type ModalKind = 'profile' | 'password' | null;

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-pop-in w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AccountMenu() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!user) return null;

  const displayName = user.name || user.identifier;
  const initials = displayName
    .split(/[@\s]/)[0]
    .slice(0, 2)
    .toUpperCase();

  function closeAll() {
    setOpen(false);
    setModal(null);
    setError('');
    setSuccess('');
  }

  async function submitProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const updated = await updateProfileRequest({ name: name.trim() });
      setUser(updated);
      setSuccess('Profile updated.');
      setTimeout(closeAll, 900);
    } catch (err) {
      setError(errorMessage(err, 'Could not update profile.'));
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await changePasswordRequest({
        currentPassword,
        newPassword,
      });
      setSuccess('Password changed. Use it next time you sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(closeAll, 1400);
    } catch (err) {
      setError(errorMessage(err, 'Could not change password.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      // Clears the httpOnly session cookie on the server.
      await logoutRequest();
    } catch {
      // Even if the call fails, drop the local session state.
    }
    logout();
    router.push('/login');
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-2 rounded-xl border border-border bg-card py-1.5 pl-1.5 pr-2.5 shadow-sm transition-all hover:border-primary/40 hover:shadow"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </span>
          <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">
            {displayName}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="animate-pop-in absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
              <div className="border-b border-border bg-muted/50 px-4 py-3">
                <p className="truncate text-sm font-semibold">
                  {user.name || 'Set your name'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.identifier}
                </p>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setName(user.name ?? '');
                    setModal('profile');
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-light hover:text-primary-dark"
                >
                  <UserRound className="h-4 w-4" />
                  Update profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModal('password');
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-light hover:text-primary-dark"
                >
                  <KeyRound className="h-4 w-4" />
                  Change password
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modal === 'profile' && (
        <ModalShell title="Update profile" onClose={closeAll}>
          <form onSubmit={submitProfile} className="space-y-4">
            {error && (
              <p className="animate-pop-in rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {error}
              </p>
            )}
            {success && (
              <p className="animate-pop-in flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
                <Check className="h-3.5 w-3.5" /> {success}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Display name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Sushil Sharma"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Account</Label>
              <Input value={user.identifier} disabled />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </ModalShell>
      )}

      {modal === 'password' && (
        <ModalShell title="Change password" onClose={closeAll}>
          <form onSubmit={submitPassword} className="space-y-4">
            {error && (
              <p className="animate-pop-in rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {error}
              </p>
            )}
            {success && (
              <p className="animate-pop-in flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
                <Check className="h-3.5 w-3.5" /> {success}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="pw-current">Current password</Label>
              <Input
                id="pw-current"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-new">New password</Label>
              <Input
                id="pw-new"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Min 8 chars, letter + number"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-confirm">Confirm new password</Label>
              <Input
                id="pw-confirm"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </ModalShell>
      )}
    </>
  );
}
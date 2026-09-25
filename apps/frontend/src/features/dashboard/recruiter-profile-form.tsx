'use client';

import { useRef, useState } from 'react';
import { Building2, Camera, Loader2, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfileRequest } from '@/features/auth/api';
import { errorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth';

/** Same static check the backend enforces. */
const PHONE_RE = /^[+]?[0-9\s()-]{7,15}$/;
const MAX_AVATAR_BYTES = 300 * 1024;

/**
 * Recruiter profile editor: company name, statically validated contact
 * number and an uploaded profile image (stored as a data URL).
 * Used by the company profile page and by the blocking onboarding gate.
 */
export function RecruiterProfileForm({ onSaved }: { onSaved?: () => void }) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [companyName, setCompanyName] = useState(user?.companyName ?? '');
  const [contactNumber, setContactNumber] = useState(
    user?.contactNumber ?? '',
  );
  const [avatar, setAvatar] = useState(user?.avatar ?? null as string | null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPickImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Image is too large. Keep it under 300 KB.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    const company = companyName.trim();
    const contact = contactNumber.trim();

    if (company.length < 2) {
      setError('Company name is required.');
      return;
    }
    if (!PHONE_RE.test(contact)) {
      setError('Enter a valid contact number, e.g. +977 9812345678.');
      return;
    }
    if (!avatar) {
      setError('Please upload a profile image.');
      return;
    }

    setBusy(true);
    try {
      const updated = await updateProfileRequest({
        companyName: company,
        contactNumber: contact,
        avatar,
      });
      setUser(updated);
      onSaved?.();
    } catch (err) {
      setError(errorMessage(err, 'Could not save the profile.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <p className="animate-pop-in rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Upload profile image"
          className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted transition-transform hover:scale-105"
        >
          {avatar ? (
            <img
              src={avatar}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" />
          </span>
        </button>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">Profile image</p>
          <p className="text-xs text-muted-foreground">
            PNG or JPG, up to 300 KB. Shown on your job posts.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onPickImage(event.target.files?.[0])}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rp-company">Company name</Label>
        <Input
          id="rp-company"
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="e.g. JobDev Labs Pvt. Ltd."
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rp-contact">Contact number</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="rp-contact"
            value={contactNumber}
            onChange={(event) => setContactNumber(event.target.value)}
            placeholder="+977 9812345678"
            inputMode="tel"
            className="pl-9"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Checked instantly in the browser and re-validated by the API.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Save profile
      </Button>
    </form>
  );
}

/** True until the recruiter has completed company, contact and image. */
export function recruiterProfileIncomplete(user: {
  companyName?: string | null;
  contactNumber?: string | null;
  avatar?: string | null;
} | null) {
  if (!user) return false;
  return (
    !user.companyName || !user.contactNumber || !user.avatar
  );
}

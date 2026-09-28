'use client';

import { useRef, useState } from 'react';
import { BadgeCheck, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  readApiError,
  updateProfileRequest,
  type AuthUser,
} from '@/features/auth/api';

const MAX_IMAGE_BYTES = 300 * 1024;

interface RecruiterProfileFormProps {
  user: AuthUser;
  onSaved: (user: AuthUser) => void;
}

export function RecruiterProfileForm({ user, onSaved }: RecruiterProfileFormProps) {
  const [companyName, setCompanyName] = useState(user.companyName ?? '');
  const [contactNumber, setContactNumber] = useState(user.contactNumber ?? '');
  const [avatar, setAvatar] = useState<string | null>(user.avatar);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be under 300 KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (companyName.trim().length < 2) {
      toast.error('Company name is required');
      return;
    }
    if (!/^[+]?[0-9\s()-]{7,15}$/.test(contactNumber.trim())) {
      toast.error('Enter a valid contact number');
      return;
    }
    if (!avatar) {
      toast.error('Please upload a profile image');
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfileRequest({
        companyName: companyName.trim(),
        contactNumber: contactNumber.trim(),
        avatar,
      });

      if (!res.ok) {
        toast.error(await readApiError(res));
        return;
      }

      const body = await res.json();
      toast.success('Profile saved');
      onSaved(body.data.user as AuthUser);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted transition-colors hover:border-primary"
          aria-label="Upload profile image"
        >
          {avatar ? (
            <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          )}
        </button>
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Profile image</p>
          <p>Company logo works best. PNG/JPG under 300 KB.</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImage}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-name">Company name</Label>
        <Input
          id="company-name"
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="Acme Pvt. Ltd."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-number" className="flex items-center gap-1.5">
          Contact number
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
            <BadgeCheck className="h-3 w-3" /> Verified
          </span>
        </Label>
        <Input
          id="contact-number"
          value={contactNumber}
          onChange={(event) => setContactNumber(event.target.value)}
          placeholder="+977 98XXXXXXXX"
        />
        <p className="text-xs text-muted-foreground">
          Verification is static for now and stored with your profile.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  );
}

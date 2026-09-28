'use client';

import { Building2 } from 'lucide-react';

import { recruiterProfileIncomplete } from '@/features/auth/api';
import { RecruiterProfileForm } from '@/features/dashboard/recruiter-profile-form';
import { useAuthStore } from '@/store/auth';

/**
 * Blocking popup: a recruiter cannot use any other page until the company
 * profile (company name, contact number, profile image) is complete.
 */
export function RecruiterProfileGate() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  if (!user || !recruiterProfileIncomplete(user)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="animate-pop-in w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light">
            <Building2 className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Complete your recruiter profile
            </h2>
            <p className="text-sm text-muted-foreground">
              You need a complete profile before accessing other pages.
            </p>
          </div>
        </div>

        <RecruiterProfileForm user={user} onSaved={setUser} />
      </div>
    </div>
  );
}

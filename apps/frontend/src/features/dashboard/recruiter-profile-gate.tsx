'use client';

import { Building2 } from 'lucide-react';

import { recruiterProfileIncomplete } from '@/features/auth/api';
import { RecruiterProfileForm } from '@/features/dashboard/recruiter-profile-form';
import { useAuthStore } from '@/store/auth';

/**
 * Blocking modal: a recruiter cannot use any other page until the company
 * profile (company name, contact number, profile image) is complete. The
 * dashboard stays visible but blurred behind the modal.
 */
export function RecruiterProfileGate() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  if (!user || !recruiterProfileIncomplete(user)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/50 p-4 backdrop-blur-md">
      <div className="animate-pop-in w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light">
            <Building2 className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h2 className="text-base font-semibold leading-tight text-foreground">
              Complete your profile
            </h2>
            <p className="text-xs text-muted-foreground">
              Required before you can use other pages.
            </p>
          </div>
        </div>

        <RecruiterProfileForm user={user} onSaved={setUser} />
      </div>
    </div>
  );
}

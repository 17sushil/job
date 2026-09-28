'use client';

import { useEffect, useState } from 'react';
import { Building2, PencilLine, Users, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import type { AuthUser } from '@/features/auth/api';
import { RecruiterProfileForm } from '@/features/dashboard/recruiter-profile-form';
import {
  apiGet,
  EmptyState,
  formatDate,
  Section,
  type UserRow,
} from '@/features/dashboard/shared';
import { useAuthStore } from '@/store/auth';

export function RecruiterDashboard({ user }: { user: AuthUser }) {
  const setUser = useAuthStore((state) => state.setUser);
  const [candidates, setCandidates] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    apiGet<{ candidates: UserRow[] }>('/api/candidates')
      .then((data) => setCandidates(data.candidates))
      .catch((error: Error) =>
        toast({ title: error.message, variant: 'destructive' }),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">
            {user.companyName ?? 'Recruiter dashboard'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your candidates and company profile.
          </p>
        </div>
        <Button onClick={() => setProfileOpen(true)}>
          <PencilLine className="h-4 w-4" /> Edit profile
        </Button>
      </header>

      <Section title={`Candidates (${loading ? '…' : candidates.length})`}>
        {loading ? (
          <EmptyState title="Loading candidates…" />
        ) : candidates.length === 0 ? (
          <EmptyState
            title="No candidates yet"
            hint="Candidates appear here as soon as they sign up."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">Candidate</th>
                      <th className="hidden px-5 py-3 font-semibold sm:table-cell">
                        Contact
                      </th>
                      <th className="px-5 py-3 font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((candidate) => (
                      <tr
                        key={candidate.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            {candidate.name ?? candidate.identifier}
                          </span>
                        </td>
                        <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">
                          {candidate.email ?? candidate.phone}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {formatDate(candidate.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </Section>

      {profileOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/50 p-4 backdrop-blur-md">
          <div className="animate-pop-in w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light">
                  <Building2 className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h2 className="text-base font-semibold leading-tight text-foreground">
                    Company profile
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    How candidates see your company.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <RecruiterProfileForm
              user={user}
              onSaved={(nextUser) => {
                setUser(nextUser);
                setProfileOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

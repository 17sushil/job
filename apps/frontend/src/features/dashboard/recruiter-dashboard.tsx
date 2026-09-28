'use client';

import { useEffect, useState } from 'react';
import { Building2, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <header>
        <h1 className="page-title">
          {user.companyName ?? 'Recruiter dashboard'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your company profile and the candidates available to you.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
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
                <table className="w-full text-sm">
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
              </CardContent>
            </Card>
          )}
        </Section>

        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" /> Company profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecruiterProfileForm user={user} onSaved={setUser} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

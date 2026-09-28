'use client';

import { useEffect, useState } from 'react';
import { Briefcase, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent } from '@/components/ui/card';
import type { AuthUser } from '@/features/auth/api';
import {
  apiGet,
  EmptyState,
  formatDate,
  type JobRow,
  Section,
} from '@/features/dashboard/shared';

export function CandidateDashboard({ user }: { user: AuthUser }) {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ jobs: JobRow[] }>('/api/jobs')
      .then((data) => setJobs(data.jobs))
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="page-title">
          Welcome{user.name ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse the latest openings posted by recruiters.
        </p>
      </header>

      <Section title={`Open jobs (${loading ? '…' : jobs.length})`}>
        {loading ? (
          <EmptyState title="Loading jobs…" />
        ) : jobs.length === 0 ? (
          <EmptyState
            title="No jobs posted yet"
            hint="Check back soon — new roles appear here as recruiters post them."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {jobs.map((job) => (
              <Card key={job.id} className="transition-colors hover:border-primary/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.company}
                      </p>
                    </div>
                    <Briefcase className="h-4 w-4 shrink-0 text-primary" />
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {job.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                      </span>
                    )}
                    <span>Posted {formatDate(job.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

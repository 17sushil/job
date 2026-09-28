'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Briefcase,
  FileText,
  LayoutDashboard,
  MapPin,
  Send,
  UserRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import {
  readApiError,
  updateProfileRequest,
} from '@/features/auth/api';
import {
  apiGet,
  apiPost,
  EmptyState,
  formatDate,
  Section,
  StatCard,
  type JobRow,
} from '@/features/dashboard/shared';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

type CandidateView = 'overview' | 'jobs' | 'applications' | 'profile';

interface ApplicationRow {
  id: string;
  status: string;
  createdAt: string;
  job: JobRow | null;
}

const NAV_ITEMS: Array<{ id: CandidateView; label: string; icon: typeof Briefcase }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'applications', label: 'My applications', icon: FileText },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-info/10 text-info',
  REVIEWING: 'bg-warning/10 text-warning',
  INTERVIEW: 'bg-primary-light text-primary-dark',
  HIRED: 'bg-success/10 text-success',
  REJECTED: 'bg-destructive/10 text-destructive',
};

export function CandidateDashboard() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [view, setView] = useState<CandidateView>('overview');
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyJob, setBusyJob] = useState<string | null>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  const load = useCallback(async () => {
    try {
      const [jobsData, applicationsData] = await Promise.all([
        apiGet<{ jobs: JobRow[] }>('/api/jobs'),
        apiGet<{ applications: ApplicationRow[] }>('/api/applications'),
      ]);
      setJobs(jobsData.jobs);
      setApplications(applicationsData.applications);
    } catch (error) {
      toast({ title: (error as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) return null;

  const appliedJobIds = new Set(
    applications.map((application) => application.job?.id).filter(Boolean),
  );

  const handleApply = async (job: JobRow) => {
    setBusyJob(job.id);
    try {
      await apiPost('/api/applications', { jobId: job.id });
      toast({ title: `Applied to ${job.title}`, variant: 'success' });
      await load();
    } catch (error) {
      toast({ title: (error as Error).message, variant: 'destructive' });
    } finally {
      setBusyJob(null);
    }
  };

  const handleSaveName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast({ title: 'Name is too short', variant: 'destructive' });
      return;
    }
    setSavingName(true);
    try {
      const res = await updateProfileRequest({ name: name.trim() });
      if (!res.ok) {
        toast({ title: await readApiError(res), variant: 'destructive' });
        return;
      }
      const body = await res.json();
      setUser(body.data.user);
      toast({ title: 'Profile updated', variant: 'success' });
    } catch {
      toast({ title: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1.5 lg:flex-col">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97]',
                view === id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:-translate-y-px hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="space-y-8">
        {view === 'overview' && (
          <>
            <header>
              <h1 className="page-title">
                Welcome{user.name ? `, ${user.name}` : ''}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here is what is happening with your job search.
              </p>
            </header>

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Briefcase} label="Open jobs" value={loading ? '…' : jobs.length} />
              <StatCard icon={FileText} label="My applications" value={loading ? '…' : applications.length} />
            </div>

            <Section title="Recent applications">
              {loading ? (
                <EmptyState title="Loading…" />
              ) : applications.length === 0 ? (
                <EmptyState
                  title="No applications yet"
                  hint="Browse the Jobs tab and apply to your first role."
                />
              ) : (
                <Card>
                  <CardContent className="divide-y divide-border p-0">
                    {applications.slice(0, 5).map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between gap-3 px-5 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {application.job?.title ?? 'Removed job'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {application.job?.company ?? ''} ·{' '}
                            {formatDate(application.createdAt)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            STATUS_STYLES[application.status] ??
                              'bg-muted text-muted-foreground',
                          )}
                        >
                          {application.status}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </Section>
          </>
        )}

        {view === 'jobs' && (
          <Section title={`Open jobs (${loading ? '…' : jobs.length})`}>
            {loading ? (
              <EmptyState title="Loading jobs…" />
            ) : jobs.length === 0 ? (
              <EmptyState
                title="No jobs posted yet"
                hint="New roles appear here as soon as they are published."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {jobs.map((job) => {
                  const applied = appliedJobIds.has(job.id);
                  return (
                    <Card key={job.id} className="transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
                      <CardContent className="flex h-full flex-col p-5">
                        <p className="font-semibold text-foreground">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                        {job.location && (
                          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" /> {job.location}
                          </p>
                        )}
                        <div className="mt-4 pt-2">
                          <Button
                            className="w-full"
                            size="sm"
                            disabled={applied || busyJob === job.id}
                            onClick={() => handleApply(job)}
                          >
                            <Send className="h-3.5 w-3.5" />
                            {applied ? 'Applied' : 'Apply now'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </Section>
        )}

        {view === 'applications' && (
          <Section title={`My applications (${loading ? '…' : applications.length})`}>
            {loading ? (
              <EmptyState title="Loading…" />
            ) : applications.length === 0 ? (
              <EmptyState
                title="No applications yet"
                hint="Apply to a job from the Jobs tab."
              />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="px-5 py-3 font-semibold">Role</th>
                          <th className="px-5 py-3 font-semibold">Company</th>
                          <th className="px-5 py-3 font-semibold">Applied</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((application) => (
                          <tr key={application.id} className="border-b border-border last:border-b-0">
                            <td className="px-5 py-3 font-medium text-foreground">
                              {application.job?.title ?? 'Removed job'}
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {application.job?.company ?? '—'}
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {formatDate(application.createdAt)}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={cn(
                                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                  STATUS_STYLES[application.status] ??
                                    'bg-muted text-muted-foreground',
                                )}
                              >
                                {application.status}
                              </span>
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
        )}

        {view === 'profile' && (
          <Section title="Profile">
            <Card className="max-w-md">
              <CardContent className="space-y-4 p-5">
                <form onSubmit={handleSaveName} className="space-y-2">
                  <Label htmlFor="candidate-name">Display name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="candidate-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your name"
                    />
                    <Button type="submit" disabled={savingName}>
                      {savingName ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                </form>
                <div className="space-y-1 border-t border-border pt-4 text-sm">
                  <p className="text-muted-foreground">
                    Email: <span className="font-medium text-foreground">{user.email ?? '—'}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Phone: <span className="font-medium text-foreground">{user.phone}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Joined: <span className="font-medium text-foreground">{formatDate(user.createdAt)}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </Section>
        )}
      </div>
    </div>
  );
}

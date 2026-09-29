'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Briefcase,
  CalendarCheck,
  CheckCheck,
  Eye,
  Plus,
  Search,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCountUp } from '@/lib/use-count-up';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

import { ApplicationsChart } from './recruiter/charts';
import {
  INITIAL_APPLICANTS,
  INITIAL_JOBS,
  INITIAL_NOTIFICATIONS,
  type Applicant,
  type ApplicantStatus,
  type Job,
  type JobStatus,
  type Notification,
} from './recruiter/mock-data';
import { Sidebar, type RecruiterView } from './recruiter/sidebar';
import {
  AnalyticsView,
  ApplicantDrawer,
  ApplicantsView,
  Avatar,
  CompanyView,
  HelpView,
  JobDrawer,
  JobsView,
  MessagesView,
  SettingsView,
  StatusChip,
} from './recruiter/views';

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  delay,
  onClick,
  hint,
}: {
  label: string;
  value: number;
  delta: string;
  icon: typeof Briefcase;
  delay: number;
  onClick?: () => void;
  hint?: string;
}) {
  const count = useCountUp(value);
  const body = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight xl:text-3xl">
            {count.toLocaleString()}
          </p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-success">{delta}</p>
    </>
  );
  const base =
    'sheen-hover group animate-fade-in-up w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg xl:p-5';

  /* Cards with a destination are buttons; the rest stay plain. */
  if (!onClick) {
    return (
      <div className={base} style={{ animationDelay: `${delay}ms` }}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={cn(
        base,
        'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {body}
    </button>
  );
}

export function RecruiterDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [view, setView] = useState<RecruiterView>('overview');
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [applicants, setApplicants] =
    useState<Applicant[]>(INITIAL_APPLICANTS);
  /* Notifications persist in localStorage so read state survives reloads. */
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
    try {
      const raw = window.localStorage.getItem('jobdev-notifications');
      if (raw) return JSON.parse(raw) as Notification[];
    } catch {
      /* fall back to the demo set */
    }
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        'jobdev-notifications',
        JSON.stringify(notifications),
      );
    } catch {
      /* storage may be unavailable; ignore */
    }
  }, [notifications]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [jobFilter, setJobFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | 'All'>(
    'All',
  );
  const [postJobSignal, setPostJobSignal] = useState(0);
  const [selectedApplicant, setSelectedApplicant] =
    useState<Applicant | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  /* Close the search dropdown on outside click / Escape so an open result
     list never blocks the Post-a-job form or anything else. */
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setQuery('');
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setQuery('');
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const firstName =
    (user?.name || user?.identifier || 'there').split(/[@\s]/)[0] || 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = useMemo<
    Array<{
      label: string;
      value: number;
      delta: string;
      icon: typeof Briefcase;
      hint?: string;
      go?: () => void;
    }>
  >(
    () => [
      {
        label: 'Active jobs',
        value: jobs.filter((job) => job.status === 'Active').length,
        delta: `${jobs.length} total posted`,
        icon: Briefcase,
        hint: 'View your active jobs',
        go: () => setView('jobs'),
      },
      {
        label: 'Total applicants',
        value: applicants.length,
        delta: `${applicants.filter((a) => a.status === 'New').length} new in pipeline`,
        icon: Users,
        hint: 'View all applicants',
        go: () => {
          setStatusFilter('All');
          setView('applicants');
        },
      },
      {
        label: 'Interviews scheduled',
        value: applicants.filter((a) => a.status === 'Interview').length,
        delta: (() => {
          const next = applicants.find(
            (a) => a.status === 'Interview' && a.scheduledDate,
          );
          return next ? `Next: ${next.scheduledDate}` : 'None scheduled yet';
        })(),
        icon: CalendarCheck,
        hint: 'View applicants in interview',
        go: () => {
          setStatusFilter('Interview');
          setView('applicants');
        },
      },
      {
        label: 'Job views',
        value: jobs.reduce((sum, job) => sum + job.views, 0),
        delta: `Across ${jobs.length} job post${jobs.length === 1 ? '' : 's'}`,
        icon: Eye,
        hint: 'Open analytics',
        go: () => setView('analytics'),
      },
    ],
    [jobs, applicants],
  );

  /* Working global search: matches jobs + applicants, click to jump in. */
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return {
      jobs: jobs.filter((job) => job.title.toLowerCase().includes(q)).slice(0, 4),
      applicants: applicants
        .filter((applicant) => applicant.name.toLowerCase().includes(q))
        .slice(0, 4),
    };
  }, [query, jobs, applicants]);

  const unread = notifications.filter((n) => !n.read).length;

  function addJob(job: Job) {
    setJobs((current) => [job, ...current]);
  }

  function setJobStatus(id: string, status: JobStatus) {
    const changedOn =
      status === 'Active'
        ? undefined
        : new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
    setJobs((current) =>
      current.map((job) =>
        job.id === id ? { ...job, status, statusChangedOn: changedOn } : job,
      ),
    );
    setSelectedJob((current) =>
      current && current.id === id
        ? { ...current, status, statusChangedOn: changedOn }
        : current,
    );
  }

  /* Schedule an interview: pick a date in the calendar → status Interview +
     date stored (candidate-side notification arrives with that module). */
  function scheduleInterview(id: string, dateLabel: string) {
    setApplicants((current) =>
      current.map((applicant) =>
        applicant.id === id
          ? { ...applicant, status: 'Interview', scheduledDate: dateLabel }
          : applicant,
      ),
    );
    setSelectedApplicant((current) =>
      current && current.id === id
        ? { ...current, status: 'Interview', scheduledDate: dateLabel }
        : current,
    );
  }

  function setApplicantStatus(id: string, status: ApplicantStatus) {
    setApplicants((current) =>
      current.map((applicant) =>
        applicant.id === id ? { ...applicant, status } : applicant,
      ),
    );
    setSelectedApplicant((current) =>
      current && current.id === id ? { ...current, status } : current,
    );
  }

  function viewApplicantsFor(jobTitle: string) {
    setJobFilter(jobTitle);
    setView('applicants');
  }

  const badges: Partial<Record<RecruiterView, number>> = {
    applicants: applicants.filter((a) => a.status === 'New').length,
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <Sidebar
        active={view}
        onSelect={setView}
        badges={badges}
        onLogout={logout}
      />

      <main className="min-w-0 flex-1 space-y-4">
        {/* Top bar */}
        {/* z-40 only while a dropdown is open so results float above cards;
            otherwise the bar stays low and scrolls under the sticky nav. */}
        <div
          className={cn(
            'animate-fade-in relative flex flex-wrap items-center justify-between gap-3',
            notifOpen || query.trim() ? 'z-40' : 'z-0',
          )}
        >
          <div className="min-w-0 w-full sm:w-auto">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
              {greeting},{' '}
              <span className="text-primary">{firstName}</span>
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Here&apos;s what&apos;s happening with your hiring today.
            </p>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
            <div className="relative min-w-0 flex-1 sm:flex-none" ref={searchRef}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs, people…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full pl-9 sm:w-56"
              />
              {searchResults && (
                <div className="animate-pop-in absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl scrollbar-slim">
                  {searchResults.jobs.length === 0 &&
                    searchResults.applicants.length === 0 && (
                      <p className="p-3 text-center text-xs text-muted-foreground">
                        No matches for “{query}”.
                      </p>
                    )}
                  {searchResults.jobs.length > 0 && (
                    <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                      Jobs
                    </p>
                  )}
                  {searchResults.jobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setSelectedJob(job);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-primary-light"
                    >
                      <Briefcase className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate font-medium">{job.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {job.applicants} applicants
                      </span>
                    </button>
                  ))}
                  {searchResults.applicants.length > 0 && (
                    <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                      People
                    </p>
                  )}
                  {searchResults.applicants.map((applicant) => (
                    <button
                      key={applicant.id}
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setSelectedApplicant(applicant);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-primary-light"
                    >
                      <Avatar name={applicant.name} className="h-6 w-6 text-[9px]" />
                      <span className="truncate font-medium">
                        {applicant.name}
                      </span>
                      <span className="ml-auto">
                        <StatusChip status={applicant.status} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                aria-label={`Notifications (${unread} unread)`}
                onClick={() => setNotifOpen((value) => !value)}
                className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-all hover:scale-105 hover:text-primary-dark"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground animate-pulse-dot">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="animate-pop-in absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                    <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
                      <p className="text-sm font-bold">Notifications</p>
                      <button
                        type="button"
                        onClick={() =>
                          setNotifications((current) =>
                            current.map((n) => ({ ...n, read: true })),
                          )
                        }
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    </div>
                    <ul className="max-h-80 overflow-y-auto p-2 scrollbar-slim">
                      {notifications.map((notification) => (
                        <li key={notification.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setNotifications((current) =>
                                current.map((n) =>
                                  n.id === notification.id
                                    ? { ...n, read: true }
                                    : n,
                                ),
                              );
                              setView(notification.view);
                              setNotifOpen(false);
                            }}
                            className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-primary-light"
                          >
                            <span
                              className={
                                notification.read
                                  ? 'mt-1.5 h-2 w-2 shrink-0 rounded-full bg-border'
                                  : 'mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse-dot'
                              }
                            />
                            <span>
                              <span className="block text-sm font-medium leading-snug">
                                {notification.text}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {notification.time}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={() => {
                setView('jobs');
                setPostJobSignal((signal) => signal + 1);
              }}
              className="hidden sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              Post a job
            </Button>
          </div>
        </div>

        {/* Mobile post-a-job */}
        <Button
          onClick={() => {
            setView('jobs');
            setPostJobSignal((signal) => signal + 1);
          }}
          className="w-full sm:hidden"
        >
          <Plus className="h-4 w-4" />
          Post a job
        </Button>

        {view === 'overview' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, index) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  delta={stat.delta}
                  icon={stat.icon}
                  delay={index * 90}
                  onClick={stat.go}
                  hint={stat.hint}
                />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
              <div
                className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm"
                style={{ animationDelay: '200ms' }}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Application stats</h3>
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Applications
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-info" />
                      Interviews
                    </span>
                  </div>
                </div>
                <ApplicationsChart />
              </div>

              <div
                className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm"
                style={{ animationDelay: '280ms' }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Recent applicants</h3>
                  <button
                    type="button"
                    onClick={() => setView('applicants')}
                    className="text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    View all
                  </button>
                </div>
                {applicants.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No applicants yet - they appear here as soon as someone applies.
                  </p>
                )}
                <ul className="max-h-80 space-y-3 overflow-y-auto pr-1 scrollbar-slim lg:max-h-64 xl:max-h-80">
                  {applicants.slice(0, 5).map((applicant, index) => (
                    <li
                      key={applicant.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${340 + index * 70}ms` }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedApplicant(applicant)}
                        className="flex w-full items-center gap-3 rounded-lg p-1 text-left transition-colors hover:bg-primary-light"
                      >
                        <Avatar name={applicant.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {applicant.name}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {applicant.job}
                          </p>
                        </div>
                        <StatusChip status={applicant.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm"
              style={{ animationDelay: '360ms' }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Live job posts</h3>
                <button
                  type="button"
                  onClick={() => setView('jobs')}
                  className="text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  Manage jobs
                </button>
              </div>
              {jobs.filter((job) => job.status !== 'Closed').length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No live job posts yet - use “Post a job” to publish your first role.
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {jobs
                  .filter((job) => job.status !== 'Closed')
                  .slice(0, 4)
                  .map((job) => (
                    <button
                      type="button"
                      title="Open job details"
                      onClick={() => setSelectedJob(job)}
                      className="group w-full cursor-pointer rounded-xl border border-border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold group-hover:text-primary-dark">
                          {job.title}
                        </p>
                        <StatusChip status={job.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {job.applicants} applicants ·{' '}
                        {job.views.toLocaleString()} views
                      </p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(job.applicants * 2, 100)}%`,
                          }}
                        />
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </>
        )}

        {view === 'jobs' && (
          <JobsView
            jobs={jobs}
            onAdd={addJob}
            onSetStatus={setJobStatus}
            onViewApplicants={viewApplicantsFor}
            onOpenJob={setSelectedJob}
            openSignal={postJobSignal}
          />
        )}

        {view === 'applicants' && (
          <ApplicantsView
            applicants={applicants}
            onSetStatus={setApplicantStatus}
            filterJob={jobFilter}
            onClearJobFilter={() => setJobFilter(null)}
            onOpen={setSelectedApplicant}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onScheduleInterview={scheduleInterview}
          />
        )}

        {view === 'messages' && <MessagesView />}
        {view === 'analytics' && <AnalyticsView />}
        {view === 'company' && <CompanyView />}
        {view === 'settings' && <SettingsView />}
        {view === 'help' && <HelpView />}

        <ApplicantDrawer
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          onSetStatus={setApplicantStatus}
          onScheduleInterview={scheduleInterview}
        />

        <JobDrawer
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSetStatus={setJobStatus}
          onViewApplicants={viewApplicantsFor}
        />
      </main>
    </div>
  );
}
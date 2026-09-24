'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Briefcase,
  Files,
  LayoutDashboard,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  adminCreateUser,
  adminDeleteJob,
  adminDeleteUser,
  adminListApplications,
  adminListJobs,
  adminListUsers,
  adminStats,
  adminUpdateUser,
  type AdminApplication,
  type AdminJob,
  type AdminStats,
  type AdminUser,
} from '@/features/admin/api';
import { errorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

type Tab = 'overview' | 'analytics' | 'users' | 'jobs' | 'applications';

const ALL_ROLES = ['CANDIDATE', 'RECRUITER', 'ADMIN', 'SUPERADMIN'];

const NAV_ITEMS: Array<{
  id: Tab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'applications', label: 'Applications', icon: Files },
];

function prettyRole(role: string) {
  if (role === 'SUPERADMIN') return 'Super admin';
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function RoleChip({ role }: { role: string }) {
  const adminFamily = role === 'ADMIN' || role === 'SUPERADMIN';
  return (
    <span
      className={
        adminFamily
          ? 'inline-flex rounded-full bg-cta/15 px-2.5 py-0.5 text-[11px] font-semibold text-cta'
          : 'inline-flex rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-semibold text-primary-dark'
      }
    >
      {prettyRole(role)}
    </span>
  );
}

function Modal({
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
        role="dialog"
        aria-modal="true"
        className="animate-pop-in max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
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

function Banner({ tone, text }: { tone: 'error' | 'success'; text: string }) {
  return (
    <p
      className={
        tone === 'error'
          ? 'animate-pop-in rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive'
          : 'animate-pop-in rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success'
      }
    >
      {text}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Lightweight SVG charts (no chart library, theme aware)             */
/* ------------------------------------------------------------------ */

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--cta))',
  'hsl(var(--info))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
];

function Bars({
  data,
}: {
  data: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(1, ...data.map((entry) => entry.value));
  return (
    <div className="flex h-40 items-end gap-3">
      {data.map((entry, index) => (
        <div key={entry.label} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-xs font-bold tabular-nums">{entry.value}</span>
          <div
            className="w-full rounded-t-lg transition-all duration-500"
            style={{
              height: `${Math.max(4, (entry.value / max) * 100)}%`,
              backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
            }}
          />
          <span className="text-[10px] font-medium text-muted-foreground">
            {entry.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Donut({
  data,
}: {
  data: Array<{ label: string; value: number }>;
}) {
  const total = Math.max(
    1,
    data.reduce((sum, entry) => sum + entry.value, 0),
  );
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-36 w-36 shrink-0 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="14"
        />
        {data.map((entry, index) => {
          const fraction = entry.value / total;
          const dash = fraction * circumference;
          const circle = (
            <circle
              key={entry.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {data.map((entry, index) => (
          <li key={entry.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
              }}
            />
            <span className="text-muted-foreground">{entry.label}</span>
            <span className="ml-auto pl-4 font-semibold tabular-nums">
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignupsArea({ users }: { users: AdminUser[] }) {
  const days = 14;
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));
    return { date, count: 0 };
  });
  for (const user of users) {
    const created = new Date(user.createdAt);
    created.setHours(0, 0, 0, 0);
    const bucket = buckets.find(
      (entry) => entry.date.getTime() === created.getTime(),
    );
    if (bucket) bucket.count += 1;
  }
  const max = Math.max(1, ...buckets.map((entry) => entry.count));
  const width = 280;
  const height = 90;
  const points = buckets
    .map((entry, index) => {
      const x = (index / (days - 1)) * width;
      const y = height - (entry.count / max) * (height - 10) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height + 4}`} className="h-28 w-full">
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill="hsl(var(--primary))"
          opacity="0.15"
        />
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
        <span>{buckets[0].date.toLocaleDateString()}</span>
        <span>Signups, last 14 days</span>
        <span>{buckets[days - 1].date.toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-bold">{title}</h3>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

function AdminSidebar({
  active,
  onSelect,
  onLogout,
}: {
  active: Tab;
  onSelect: (tab: Tab) => void;
  onLogout: () => void;
}) {
  const nav = NAV_ITEMS.map((item, index) => {
    const Icon = item.icon;
    const isActive = active === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelect(item.id)}
        className={cn(
          'group animate-fade-in-up relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
            : 'text-muted-foreground hover:translate-x-1 hover:bg-primary-light hover:text-primary-dark',
        )}
        style={{ animationDelay: `${80 + index * 50}ms` }}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/80" />
        )}
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110',
            isActive && 'animate-wiggle',
          )}
        />
        <span className="truncate">{item.label}</span>
      </button>
    );
  });

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card p-4 scrollbar-slim lg:flex lg:h-full">
        <div className="space-y-1">
          <p className="px-3.5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Console
          </p>
          {nav}
        </div>
        <div className="mt-auto">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Log out
          </button>
        </div>
      </aside>

      <div className="sticky top-16 z-30 flex gap-2 overflow-x-auto border-b border-border bg-card px-4 py-2.5 scrollbar-slim lg:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'bg-muted text-muted-foreground hover:bg-primary-light hover:text-primary-dark',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function AdminDashboard() {
  const me = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const isSuper = me?.role === 'superadmin';

  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{
    tone: 'error' | 'success';
    text: string;
  } | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [blockedFilter, setBlockedFilter] = useState<
    'ALL' | 'ACTIVE' | 'BLOCKED'
  >('ALL');
  const [appFilter, setAppFilter] = useState('ALL');

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [confirm, setConfirm] = useState<{
    kind: 'user' | 'job';
    id: string;
    label: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, usersData, jobsData, appsData] = await Promise.all([
        adminStats(),
        adminListUsers(),
        adminListJobs(),
        adminListApplications(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setJobs(jobsData);
      setApplications(appsData);
      setNotice(null);
    } catch (error) {
      setNotice({
        tone: 'error',
        text: errorMessage(error, 'Could not load admin data.'),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setCreateOpen(false);
        setEditing(null);
        setConfirm(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter === 'ADMINS') {
        if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') return false;
      } else if (roleFilter !== 'ALL' && user.role !== roleFilter) {
        return false;
      }
      if (blockedFilter === 'BLOCKED' && !user.blocked) return false;
      if (blockedFilter === 'ACTIVE' && user.blocked) return false;
      if (!q) return true;
      const haystack =
        `${user.name ?? ''} ${user.email ?? ''} ${user.mobile ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [users, query, roleFilter, blockedFilter]);

  const filteredApplications = useMemo(() => {
    if (appFilter === 'ALL') return applications;
    return applications.filter((application) => application.status === appFilter);
  }, [applications, appFilter]);

  /** Overview cards deep-link into the lists with filters pre-applied. */
  function openUsers(role?: string, blocked?: 'ALL' | 'ACTIVE' | 'BLOCKED') {
    setRoleFilter(role ?? 'ALL');
    setBlockedFilter(blocked ?? 'ALL');
    setTab('users');
  }

  function openApps(status?: string) {
    setAppFilter(status ?? 'ALL');
    setTab('applications');
  }

  async function run(action: () => Promise<string>, success: string) {
    setBusy(true);
    try {
      await action();
      setNotice({ tone: 'success', text: success });
      await load();
    } catch (error) {
      setNotice({ tone: 'error', text: errorMessage(error, 'Action failed.') });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const titles: Record<Tab, string> = {
    overview: 'Overview',
    analytics: 'Analytics',
    users: 'User management',
    jobs: 'Jobs oversight',
    applications: 'Applications',
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:h-[calc(100vh-6rem)] lg:flex-row lg:items-stretch lg:overflow-hidden">
      <AdminSidebar active={tab} onSelect={setTab} onLogout={handleLogout} />

      <main className="min-w-0 flex-1 space-y-4 p-4 sm:p-6 lg:overflow-y-auto scrollbar-slim">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {titles[tab]}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSuper
                ? 'Super admin: full control, including admin management.'
                : 'Admin: manage candidates, recruiters, jobs and applications.'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {notice && <Banner tone={notice.tone} text={notice.text} />}

        {tab === 'overview' && stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {[
              { label: 'Total users', value: stats.users, go: () => openUsers() },
              {
                label: 'Candidates',
                value: stats.candidates,
                go: () => openUsers('CANDIDATE'),
              },
              {
                label: 'Recruiters',
                value: stats.recruiters,
                go: () => openUsers('RECRUITER'),
              },
              { label: 'Admins', value: stats.admins, go: () => openUsers('ADMINS') },
              {
                label: 'Blocked',
                value: stats.blocked,
                go: () => openUsers(undefined, 'BLOCKED'),
              },
              { label: 'Jobs', value: stats.jobs, go: () => setTab('jobs') },
              { label: 'Open jobs', value: stats.openJobs, go: () => setTab('jobs') },
              {
                label: 'Applications',
                value: stats.applications,
                go: () => openApps(),
              },
              { label: 'Hired', value: stats.hired, go: () => openApps('HIRED') },
            ].map(({ label, value, go }) => (
              <button
                key={label}
                type="button"
                onClick={go}
                className="rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-2xl font-bold tabular-nums">{value}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {label}
                </p>
              </button>
            ))}
          </div>
        )}

        {tab === 'analytics' && stats && (
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Users by role">
              <Donut
                data={[
                  { label: 'Candidates', value: stats.candidates },
                  { label: 'Recruiters', value: stats.recruiters },
                  { label: 'Admins', value: stats.admins },
                ]}
              />
            </ChartCard>
            <ChartCard title="Applications by status">
              <Bars
                data={[
                  {
                    label: 'New',
                    value: applications.filter((a) => a.status === 'NEW').length,
                  },
                  {
                    label: 'Shortlisted',
                    value: applications.filter((a) => a.status === 'SHORTLISTED')
                      .length,
                  },
                  {
                    label: 'Interview',
                    value: applications.filter((a) => a.status === 'INTERVIEW')
                      .length,
                  },
                  {
                    label: 'Hired',
                    value: applications.filter((a) => a.status === 'HIRED')
                      .length,
                  },
                  {
                    label: 'Rejected',
                    value: applications.filter((a) => a.status === 'REJECTED')
                      .length,
                  },
                ]}
              />
            </ChartCard>
            <ChartCard title="Signup activity">
              <SignupsArea users={users} />
            </ChartCard>
            <ChartCard title="Jobs by status">
              <Bars
                data={[
                  {
                    label: 'Open',
                    value: jobs.filter((j) => j.status === 'OPEN').length,
                  },
                  {
                    label: 'Paused',
                    value: jobs.filter((j) => j.status === 'PAUSED').length,
                  },
                  {
                    label: 'Closed',
                    value: jobs.filter((j) => j.status === 'CLOSED').length,
                  },
                  {
                    label: 'Cancelled',
                    value: jobs.filter((j) => j.status === 'CANCELLED').length,
                  },
                ]}
              />
            </ChartCard>
            <ChartCard title="Platform health">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Hire rate</span>
                  <span className="font-bold tabular-nums">
                    {stats.applications
                      ? Math.round((stats.hired / stats.applications) * 100)
                      : 0}
                    %
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Blocked accounts
                  </span>
                  <span className="font-bold tabular-nums">
                    {stats.users
                      ? Math.round((stats.blocked / stats.users) * 100)
                      : 0}
                    %
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Jobs open now</span>
                  <span className="font-bold tabular-nums">
                    {stats.jobs
                      ? Math.round((stats.openJobs / stats.jobs) * 100)
                      : 0}
                    %
                  </span>
                </li>
              </ul>
            </ChartCard>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, phone"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
              >
                <option value="ALL">All roles</option>
                <option value="ADMINS">All admins</option>
                {ALL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {prettyRole(role)}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by status"
                value={blockedFilter}
                onChange={(event) =>
                  setBlockedFilter(
                    event.target.value as 'ALL' | 'ACTIVE' | 'BLOCKED',
                  )
                }
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
              >
                <option value="ALL">Active + blocked</option>
                <option value="ACTIVE">Active only</option>
                <option value="BLOCKED">Blocked only</option>
              </select>
              <Button
                type="button"
                size="sm"
                className="ml-auto bg-cta text-cta-foreground hover:bg-cta"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add user
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.userId}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-medium">
                        {user.name ?? 'No name set'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.email ?? user.mobile}
                        {user.email && user.mobile ? (
                          <span className="block text-xs">{user.mobile}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <RoleChip role={user.role} />
                      </td>
                      <td className="px-4 py-3">
                        {user.blocked ? (
                          <span className="inline-flex rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold text-destructive">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            title={user.blocked ? 'Unblock' : 'Block'}
                            aria-label={user.blocked ? 'Unblock user' : 'Block user'}
                            disabled={busy || user.userId === me?.id}
                            onClick={() =>
                              void run(
                                () =>
                                  adminUpdateUser(user.userId, {
                                    blocked: !user.blocked,
                                  }).then(() => ''),
                                user.blocked ? 'User unblocked.' : 'User blocked.',
                              )
                            }
                            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                          >
                            {user.blocked ? (
                              <ShieldCheck className="h-4 w-4" />
                            ) : (
                              <ShieldOff className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            aria-label="Edit user"
                            disabled={user.userId === me?.id}
                            onClick={() => setEditing(user)}
                            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            aria-label="Delete user"
                            disabled={busy || user.userId === me?.id}
                            onClick={() =>
                              setConfirm({
                                kind: 'user',
                                id: user.userId,
                                label:
                                  user.name ??
                                  user.email ??
                                  user.mobile ??
                                  'user',
                              })
                            }
                            className="rounded-lg border border-border p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                      >
                        No users match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'jobs' && (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Posted</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.jobId}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium">{job.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {job.company}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {job.type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-semibold text-primary-dark">
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          title="Delete job"
                          aria-label="Delete job"
                          disabled={busy}
                          onClick={() =>
                            setConfirm({
                              kind: 'job',
                              id: job.jobId,
                              label: job.title,
                            })
                          }
                          className="rounded-lg border border-border p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      No jobs posted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'applications' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter by application status"
                value={appFilter}
                onChange={(event) => setAppFilter(event.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
              >
                <option value="ALL">All statuses</option>
                {['NEW', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED'].map(
                  (status) => (
                    <option key={status} value={status}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </option>
                  ),
                )}
              </select>
              <span className="text-xs text-muted-foreground">
                {filteredApplications.length} of {applications.length} shown
              </span>
            </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Application</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Interview</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => {
                  const job = jobs.find(
                    (entry) => entry.jobId === application.jobId,
                  );
                  const candidate = users.find(
                    (entry) => entry.userId === application.candidateId,
                  );
                  return (
                    <tr
                      key={application.applicationId}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {application.applicationId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {job?.title ?? application.jobId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {candidate?.name ??
                          candidate?.email ??
                          application.candidateId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-semibold text-primary-dark">
                          {application.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {application.interviewAt
                          ? new Date(application.interviewAt).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
                {filteredApplications.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      No applications match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {createOpen && (
          <CreateUserModal
            isSuper={isSuper}
            busy={busy}
            onClose={() => setCreateOpen(false)}
            onCreated={async (payload) => {
              await run(
                () => adminCreateUser(payload).then(() => ''),
                'User created. They can sign in right away.',
              );
              setCreateOpen(false);
            }}
          />
        )}

        {editing && (
          <EditUserModal
            user={editing}
            isSuper={isSuper}
            busy={busy}
            onClose={() => setEditing(null)}
            onSaved={async (patch) => {
              await run(
                () => adminUpdateUser(editing.userId, patch).then(() => ''),
                'User updated.',
              );
              setEditing(null);
            }}
          />
        )}

        {confirm && (
          <Modal
            title={confirm.kind === 'user' ? 'Delete user' : 'Delete job'}
            onClose={() => setConfirm(null)}
          >
            <p className="text-sm text-muted-foreground">
              Permanently delete{' '}
              <span className="font-semibold text-foreground">
                {confirm.label}
              </span>
              ? This cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive"
                disabled={busy}
                onClick={() =>
                  void run(
                    () =>
                      confirm.kind === 'user'
                        ? adminDeleteUser(confirm.id).then(() => '')
                        : adminDeleteJob(confirm.id).then(() => ''),
                    confirm.kind === 'user' ? 'User deleted.' : 'Job deleted.',
                  )
                }
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}

function CreateUserModal({
  isSuper,
  busy,
  onClose,
  onCreated,
}: {
  isSuper: boolean;
  busy: boolean;
  onClose: () => void;
  onCreated: (payload: {
    identifier: string;
    name?: string;
    password: string;
    role: string;
  }) => Promise<void>;
}) {
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CANDIDATE');
  const options = isSuper ? ALL_ROLES : ['CANDIDATE', 'RECRUITER'];

  return (
    <Modal title="Add user" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onCreated({
            identifier: identifier.trim(),
            name: name.trim() || undefined,
            password,
            role,
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="admin-new-identifier">Email or phone</Label>
          <Input
            id="admin-new-identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="teammate@jobdev.app or +977 98..."
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-new-name">Name (optional)</Label>
          <Input
            id="admin-new-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Ritik K."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-new-password">Temporary password</Label>
          <Input
            id="admin-new-password"
            type="text"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Share it with the teammate"
            minLength={6}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-new-role">Role</Label>
          <select
            id="admin-new-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {prettyRole(option)}
              </option>
            ))}
          </select>
          {!isSuper && (
            <p className="text-xs text-muted-foreground">
              Only a super admin can create admin accounts.
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full bg-cta text-cta-foreground hover:bg-cta"
          disabled={busy}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Create user
        </Button>
      </form>
    </Modal>
  );
}

function EditUserModal({
  user,
  isSuper,
  busy,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  isSuper: boolean;
  busy: boolean;
  onClose: () => void;
  onSaved: (patch: {
    name?: string;
    blocked?: boolean;
    role?: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(user.name ?? '');
  const [blocked, setBlocked] = useState(user.blocked);
  const [role, setRole] = useState(user.role);
  const roleOptions = isSuper ? ALL_ROLES : ['CANDIDATE', 'RECRUITER'];

  return (
    <Modal title="Edit user" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSaved({
            name: name.trim() || undefined,
            blocked,
            role: isSuper ? role : undefined,
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="admin-edit-name">Name</Label>
          <Input
            id="admin-edit-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        {isSuper && (
          <div className="space-y-1.5">
            <Label htmlFor="admin-edit-role">Role</Label>
            <select
              id="admin-edit-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {prettyRole(option)}
                </option>
              ))}
            </select>
          </div>
        )}
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={blocked}
            onChange={(event) => setBlocked(event.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--destructive))]"
          />
          Block this account (sign-in disabled)
        </label>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </form>
    </Modal>
  );
}

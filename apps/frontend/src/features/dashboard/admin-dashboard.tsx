'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Files,
  Loader2,
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
import { useAuthStore } from '@/store/auth';

type Tab = 'overview' | 'users' | 'jobs' | 'applications';

const ALL_ROLES = ['CANDIDATE', 'RECRUITER', 'ADMIN', 'SUPERADMIN'];

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

export function AdminDashboard() {
  const me = useAuthStore((state) => state.user);
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
  const [blockedFilter, setBlockedFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');

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
      setNotice({ tone: 'error', text: errorMessage(error, 'Could not load admin data.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* Close modals on Escape. */
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
      if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
      if (blockedFilter === 'BLOCKED' && !user.blocked) return false;
      if (blockedFilter === 'ACTIVE' && user.blocked) return false;
      if (!q) return true;
      const haystack =
        `${user.name ?? ''} ${user.email ?? ''} ${user.mobile ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [users, query, roleFilter, blockedFilter]);

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

  const tabs: Array<{ id: Tab; label: string; icon: typeof Users }> = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'applications', label: 'Applications', icon: Files },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Admin console
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

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              tab === id
                ? 'flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground'
                : 'flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {notice && <Banner tone={notice.tone} text={notice.text} />}

      {tab === 'overview' && stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(
            [
              ['Total users', stats.users, 'users'],
              ['Candidates', stats.candidates, 'users'],
              ['Recruiters', stats.recruiters, 'users'],
              ['Admins', stats.admins, 'users'],
              ['Blocked', stats.blocked, 'users'],
              ['Jobs', stats.jobs, 'jobs'],
              ['Open jobs', stats.openJobs, 'jobs'],
              ['Applications', stats.applications, 'applications'],
              ['Hired', stats.hired, 'applications'],
            ] as Array<[string, number, Tab]>
          ).map(([label, value, target]) => (
            <button
              key={label}
              type="button"
              onClick={() => setTab(target)}
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
                              label: user.name ?? user.email ?? user.mobile ?? 'user',
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
              {applications.map((application) => {
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
              {applications.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No applications yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
        <Button type="submit" className="w-full bg-cta text-cta-foreground hover:bg-cta" disabled={busy}>
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

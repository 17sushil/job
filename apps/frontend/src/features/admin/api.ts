import { apiClient } from '@/lib/api-client';

export interface AdminUser {
  userId: string;
  role: string;
  email: string | null;
  mobile: string | null;
  name: string | null;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  users: number;
  candidates: number;
  recruiters: number;
  admins: number;
  blocked: number;
  jobs: number;
  openJobs: number;
  applications: number;
  hired: number;
}

export interface AdminJob {
  jobId: string;
  recruiterId: string;
  title: string;
  company: string;
  location: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface AdminApplication {
  applicationId: string;
  jobId: string;
  candidateId: string;
  status: string;
  interviewAt: string | null;
  createdAt: string;
}

export async function adminStats() {
  const { data } = await apiClient.get<{ data: { stats: AdminStats } }>(
    '/api/admin/stats',
  );
  return data.data.stats;
}

export async function adminListUsers() {
  const { data } = await apiClient.get<{ data: { users: AdminUser[] } }>(
    '/api/admin/users',
  );
  return data.data.users;
}

export interface AdminCreateUserPayload {
  identifier: string;
  name?: string;
  password: string;
  role: string;
}

export async function adminCreateUser(payload: AdminCreateUserPayload) {
  const { data } = await apiClient.post<{ data: { user: AdminUser } }>(
    '/api/admin/users',
    payload,
  );
  return data.data.user;
}

export interface AdminUpdateUserPayload {
  name?: string;
  blocked?: boolean;
  role?: string;
}

export async function adminUpdateUser(
  userId: string,
  patch: AdminUpdateUserPayload,
) {
  const { data } = await apiClient.patch<{ data: { user: AdminUser } }>(
    `/api/admin/users/${userId}`,
    patch,
  );
  return data.data.user;
}

export async function adminDeleteUser(userId: string) {
  const { data } = await apiClient.delete<{ data: { message: string } }>(
    `/api/admin/users/${userId}`,
  );
  return data.data.message;
}

export async function adminListJobs() {
  const { data } = await apiClient.get<{ data: { jobs: AdminJob[] } }>(
    '/api/admin/jobs',
  );
  return data.data.jobs;
}

export async function adminDeleteJob(jobId: string) {
  const { data } = await apiClient.delete<{ data: { message: string } }>(
    `/api/admin/jobs/${jobId}`,
  );
  return data.data.message;
}

export async function adminListApplications() {
  const { data } = await apiClient.get<{
    data: { applications: AdminApplication[] };
  }>('/api/admin/applications');
  return data.data.applications;
}

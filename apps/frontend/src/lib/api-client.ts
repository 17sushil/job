import axios, { type AxiosRequestConfig } from 'axios';
export const UNAUTHORIZED_EVENT = 'jobdev:unauthorized';

const http = axios.create({
  withCredentials: true,
  timeout: 90_000,
  headers: { 'X-Requested-With': 'JobDev' },
});
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}
// CSRF is a short-lived in-memory handshake, not an authentication token.
let csrfRequest: Promise<string> | null = null;
export function clearCsrf() {
  csrfRequest = null;
}
function getCsrf() {
  return (csrfRequest ??= http
    .get('/api/auth/csrf')
    .then((response) => response.data.data.csrfToken as string)
    .catch((error) => {
      clearCsrf();
      throw error;
    }));
}
async function send<T>(
  path: string,
  options: AxiosRequestConfig = {},
): Promise<T> {
  if (
    (!path.startsWith('/api/') && path !== '/buildcheck') ||
    path.includes('\\')
  )
    throw new Error('Only same-origin API paths are allowed.');
  try {
    const method = (options.method ?? 'GET').toUpperCase();
    const csrf = ['GET', 'HEAD', 'OPTIONS'].includes(method)
      ? undefined
      : await getCsrf();
    const response = await http.request<T>({
      ...options,
      url: path,
      headers: { ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
    });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error) || !axios.isAxiosError(error)) throw error;
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    if (body?.code === 'CSRF_INVALID') clearCsrf();
    if (status === 401 && typeof window !== 'undefined')
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new ApiError(
      body?.message ??
        (status
          ? `Request failed (${status})`
          : 'Cannot reach the server. Check that the backend is running.'),
      status,
      body?.code,
    );
  }
}
/** One transport, one error shape. API functions return data, not Response wrappers. */
export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  return (await send<{ data: T }>(path, { signal })).data;
}
export async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  return (await send<{ data: T }>(path, { method: 'POST', data })).data;
}
export async function apiPatch<T>(path: string, data: unknown): Promise<T> {
  return (await send<{ data: T }>(path, { method: 'PATCH', data })).data;
}
export async function apiPut<T>(path: string, data: unknown): Promise<T> {
  return (await send<{ data: T }>(path, { method: 'PUT', data })).data;
}
export async function apiDelete<T>(path: string): Promise<T> {
  return (await send<{ data: T }>(path, { method: 'DELETE' })).data;
}
export function apiBlob(path: string, signal?: AbortSignal) {
  return send<Blob>(path, { responseType: 'blob', signal });
}
export function buildCheck(signal?: AbortSignal) {
  return send<{ id?: string }>('/buildcheck', { signal });
}

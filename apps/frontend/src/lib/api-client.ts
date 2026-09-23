import axios, { AxiosError } from 'axios';

/**
 * Single shared Axios instance for the whole app.
 *
 * Performance: one instance means one set of interceptors and connection
 * reuse instead of a fresh fetch wrapper per call.
 *
 * Auth: `withCredentials` sends the httpOnly `jobdev_token` cookie on every
 * request. The token never touches JavaScript state or localStorage.
 */
export const apiClient = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

interface ApiErrorBody {
  message?: string;
  errors?: Array<{ field?: string; message?: string }>;
}

/** Extract a human-readable message from any Axios/unknown error. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.errors?.length && body.errors[0]?.message) {
      return body.errors[0].message;
    }
    if (body?.message) return body.message;
    if (!error.response) return 'Network error. Is the API running?';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

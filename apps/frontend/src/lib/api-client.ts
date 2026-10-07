import axios from 'axios';

export const UNAUTHORIZED_EVENT = 'jobdev:unauthorized';

/** Only same-origin requests. Auth is carried by the browser's HttpOnly cookie. */
export const http = axios.create({
  withCredentials: true,
  timeout: 90000,
  headers: { 'X-Requested-With': 'JobDev' },
  validateStatus: () => true,
});
let csrfRequest: Promise<string> | null = null;
export function clearCsrf() { csrfRequest = null; }
async function csrfToken() {
  if (!csrfRequest) {
    csrfRequest = http.get('/api/auth/csrf').then(response => {
      if (response.status !== 200 || !response.data?.data?.csrfToken) throw new Error('Could not establish a secure session. Enable cookies and try again.');
      return response.data.data.csrfToken as string;
    }).catch(error => { csrfRequest = null; throw error; });
  }
  return csrfRequest;
}

/** Response facade keeps existing JSON/PDF consumers compatible; Axios (XHR in
 * the browser) is the HTTP transport, not fetch. No tokens are read from storage. */
export async function apiClient(path: string, init: RequestInit = {}): Promise<Response> {
  if ((!path.startsWith('/api/') && path !== '/buildcheck') || path.includes('\\')) throw new Error('Only same-origin API paths are allowed.');
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.delete('Authorization');
  headers.delete('x-auth-token');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-CSRF-Token', await csrfToken());
  const result = await http.request<ArrayBuffer>({
    url: path, method, headers: Object.fromEntries(headers.entries()),
    data: init.body, signal: init.signal ?? undefined,
    responseType: 'arraybuffer', transformResponse: [data => data],
  });
  if (result.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
  }
  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(result.headers)) {
    if (value != null) responseHeaders.set(key, String(value));
  }
  const response = new Response([204, 205, 304].includes(result.status) ? null : result.data, {
    status: result.status, statusText: result.statusText, headers: responseHeaders,
  });
  if (result.status === 403) {
    const detail = await response.clone().json().catch(() => null);
    // Do not replay writes automatically. The next user-initiated retry gets a fresh token.
    if (detail?.code === 'CSRF_INVALID') clearCsrf();
  }
  return response;
}

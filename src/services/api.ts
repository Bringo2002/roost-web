export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public violations: Array<{ field: string; message: string }> = []
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let _token: string | null = null;
let _refreshFn: (() => Promise<boolean>) | null = null;

export function setAuthToken(token: string | null): void {
  _token = token;
  if (token) {
    sessionStorage.setItem('roost_token', token);
  } else {
    sessionStorage.removeItem('roost_token');
  }
}

export function getAuthToken(): string | null {
  if (_token) return _token;
  _token = sessionStorage.getItem('roost_token');
  return _token;
}

export function setRefreshHandler(fn: () => Promise<boolean>): void {
  _refreshFn = fn;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function extractError(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null) {
    const obj = body as Record<string, unknown>;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
  }
  return fallback;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  if (response.status === 401 && _refreshFn) {
    const refreshed = await _refreshFn();
    if (refreshed) {
      throw new ApiError('TOKEN_REFRESHED', 401);
    }
  }

  let body: unknown;
  try { body = await response.json(); } catch { body = null; }

  const fallback = response.status === 403
    ? 'You do not have permission to perform this action.'
    : response.status === 429
    ? 'Too many requests. Please wait a moment and try again.'
    : `Request failed (${response.status})`;

  throw new ApiError(extractError(body, fallback), response.status);
}

async function request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const opts: RequestInit = {
      method,
      headers: headers(),
      signal: controller.signal,
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const response = await fetch(endpoint, opts);
    return await handleResponse<T>(response);
  } catch (err) {
    if (err instanceof ApiError && err.message === 'TOKEN_REFRESHED') {
      const retryOpts: RequestInit = {
        method,
        headers: headers(),
      };
      if (body !== undefined) retryOpts.body = JSON.stringify(body);
      const response = await fetch(endpoint, retryOpts);
      return await handleResponse<T>(response);
    }
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.');
    }
    throw new ApiError('No internet connection or server unreachable.');
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, body?: unknown) => request<T>('POST', endpoint, body),
  put: <T>(endpoint: string, body: unknown) => request<T>('PUT', endpoint, body),
  patch: <T>(endpoint: string, body: unknown) => request<T>('PATCH', endpoint, body),
  delete: <T>(endpoint: string) => request<T>('DELETE', endpoint),
};

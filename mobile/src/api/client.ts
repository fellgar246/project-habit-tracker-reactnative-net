import { getApiUrl } from './config';
import { ApiError, parseProblemDetails, problemToApiError } from './errors';

const REQUEST_TIMEOUT_MS = 10_000;

type AuthTokenProvider = () => Promise<string | null> | string | null;

let authTokenProvider: AuthTokenProvider | null = null;

/** Extension point for PLAN-04: inject JWT from secure storage. */
export function setAuthTokenProvider(provider: AuthTokenProvider | null): void {
  authTokenProvider = provider;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  timeoutMs?: number;
};

async function resolveAuthHeader(): Promise<Record<string, string>> {
  if (!authTokenProvider) {
    return {};
  }

  const token = await authTokenProvider();
  if (!token) {
    return {};
  }

  return { Authorization: `Bearer ${token}` };
}

function buildUrl(path: string): string {
  const base = getApiUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, timeoutMs = REQUEST_TIMEOUT_MS, headers, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const authHeaders = await resolveAuthHeader();
    const hasJsonBody = body !== undefined && body !== null;

    const response = await fetch(buildUrl(path), {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders,
        ...(headers as Record<string, string> | undefined),
      },
      body: hasJsonBody ? JSON.stringify(body) : undefined,
    });

    if (response.ok) {
      if (response.status === 204) {
        return undefined as T;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      return undefined as T;
    }

    const problem = await parseProblemDetails(response);
    throw problemToApiError(response.status, problem, response.statusText || 'Request failed');
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError({
        status: 408,
        title: 'Request timeout',
        detail: `The request exceeded ${timeoutMs / 1000}s`,
      });
    }

    throw new ApiError({
      status: 0,
      title: 'Network error',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get<T>(path: string, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' });
  },

  post<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'body' | 'method'>,
  ): Promise<T> {
    return request<T>(path, { ...options, method: 'POST', body });
  },

  put<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method'>,
  ): Promise<T> {
    return request<T>(path, { ...options, method: 'PUT', body });
  },

  patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method'>,
  ): Promise<T> {
    return request<T>(path, { ...options, method: 'PATCH', body });
  },

  delete<T>(path: string, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return request<T>(path, { ...options, method: 'DELETE' });
  },
};

/** Raw fetch for routes outside /api/v1 (e.g. /health). */
export async function fetchAbsolute<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { body, timeoutMs = REQUEST_TIMEOUT_MS, headers, ...rest } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const hasJsonBody = body !== undefined && body !== null;

    const response = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
        ...(headers as Record<string, string> | undefined),
      },
      body: hasJsonBody ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const problem = await parseProblemDetails(response);
      throw problemToApiError(response.status, problem, response.statusText || 'Request failed');
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError({
        status: 408,
        title: 'Request timeout',
        detail: `The request exceeded ${timeoutMs / 1000}s`,
      });
    }

    throw new ApiError({
      status: 0,
      title: 'Network error',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

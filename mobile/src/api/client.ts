import { getApiUrl } from './config';
import { ApiError, parseProblemDetails, problemToApiError } from './errors';
import * as tokenStorage from '../features/auth/tokenStorage';
import { AuthResponse } from '../types/api';

const REQUEST_TIMEOUT_MS = 10_000;

type AuthTokenProvider = () => Promise<string | null> | string | null;

let authTokenProvider: AuthTokenProvider | null = null;

/** Inject JWT from secure storage / in-memory session. */
export function setAuthTokenProvider(provider: AuthTokenProvider | null): void {
  authTokenProvider = provider;
}

type SessionExpiredHandler = () => void;
type TokensRefreshedHandler = (response: AuthResponse) => void;

let onSessionExpired: SessionExpiredHandler | null = null;
let onTokensRefreshed: TokensRefreshedHandler | null = null;

export function setOnSessionExpired(handler: SessionExpiredHandler | null): void {
  onSessionExpired = handler;
}

export function setOnTokensRefreshed(handler: TokensRefreshedHandler | null): void {
  onTokensRefreshed = handler;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  timeoutMs?: number;
  /** Skip automatic refresh retry (used internally for /auth/refresh). */
  skipAuthRefresh?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

function isAuthEndpoint(path: string): boolean {
  return path.startsWith('/auth/');
}

async function resolveAuthHeader(): Promise<Record<string, string>> {
  const provider = authTokenProvider ?? (() => tokenStorage.getAccessToken());
  const token = await provider();
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

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function performRefresh(): Promise<string | null> {
  const stored = await tokenStorage.load();
  if (!stored?.refreshToken) {
    await clearSession();
    return null;
  }

  try {
    const { data: response } = await rawRequest<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: stored.refreshToken },
    });

    await tokenStorage.save({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    });

    onTokensRefreshed?.(response);
    return response.accessToken;
  } catch {
    await clearSession();
    return null;
  }
}

async function clearSession(): Promise<void> {
  await tokenStorage.clear();
  onSessionExpired?.();
}

async function rawRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; response: Response }> {
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
        return { data: undefined as T, response };
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return { data: (await response.json()) as T, response };
      }

      return { data: undefined as T, response };
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

async function request<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const { skipAuthRefresh = false, ...requestOptions } = options;

  try {
    const { data } = await rawRequest<T>(path, requestOptions);
    return data;
  } catch (error) {
    if (
      !isRetry &&
      !skipAuthRefresh &&
      error instanceof ApiError &&
      error.status === 401 &&
      !isAuthEndpoint(path)
    ) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return request<T>(path, options, true);
      }
    }

    throw error;
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

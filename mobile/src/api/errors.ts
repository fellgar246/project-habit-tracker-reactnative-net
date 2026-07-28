import { ProblemDetails } from '../types/api';

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail?: string;
  readonly errors?: Record<string, string[]>;

  constructor(params: {
    status: number;
    title: string;
    detail?: string;
    errors?: Record<string, string[]>;
  }) {
    super(params.detail ?? params.title);
    this.name = 'ApiError';
    this.status = params.status;
    this.title = params.title;
    this.detail = params.detail;
    this.errors = params.errors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export async function parseProblemDetails(
  response: Response,
): Promise<ProblemDetails | null> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json') && !contentType.includes('application/problem+json')) {
    return null;
  }

  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return null;
  }
}

export function problemToApiError(
  status: number,
  problem: ProblemDetails | null,
  fallbackMessage: string,
): ApiError {
  return new ApiError({
    status: problem?.status ?? status,
    title: problem?.title ?? fallbackMessage,
    detail: problem?.detail,
    errors: problem?.errors,
  });
}

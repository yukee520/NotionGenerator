export type ApiErrorCode =
  | 'network'
  | 'timeout'
  | 'server'
  | 'client'
  | 'parse'
  | 'unknown';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface AxiosLikeError {
  isAxiosError?: boolean;
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: unknown;
  };
  request?: unknown;
}

function isAxiosLike(err: unknown): err is AxiosLikeError {
  return typeof err === 'object' && err !== null && (err as AxiosLikeError).isAxiosError === true;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function normalizeError(err: unknown): ApiError {
  if (isApiError(err)) return err;

  if (isAxiosLike(err)) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return new ApiError('timeout', 'The request timed out. Please try again.');
    }
    if (err.code === 'ERR_NETWORK' || !err.response) {
      return new ApiError(
        'network',
        'Cannot reach the server. Check your connection or the webhook URL.',
      );
    }
    const status = err.response?.status;
    const data = err.response?.data;
    const serverMessage =
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : undefined;

    if (status && status >= 500) {
      return new ApiError(
        'server',
        serverMessage ?? 'The server returned an error. Please try again.',
        status,
        data,
      );
    }
    if (status && status >= 400) {
      return new ApiError(
        'client',
        serverMessage ?? 'The request was rejected. Please check your input.',
        status,
        data,
      );
    }
  }

  if (err instanceof Error) {
    if (/JSON/i.test(err.message)) {
      return new ApiError('parse', 'The server returned an invalid response.');
    }
    return new ApiError('unknown', err.message);
  }

  return new ApiError('unknown', 'Something went wrong. Please try again.');
}

export function userMessage(err: unknown): string {
  return normalizeError(err).message;
}
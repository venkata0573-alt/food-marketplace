export type ServiceErrorCode =
  'VALIDATION' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'RATE_LIMITED' | 'INTERNAL';

export interface ServiceError {
  code: ServiceErrorCode;
  message: string;
  /** Safe for clients — never include stack traces or internal details. */
  publicMessage: string;
  details?: Record<string, unknown>;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: ServiceError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T = never>(
  code: ServiceErrorCode,
  publicMessage: string,
  message?: string,
  details?: Record<string, unknown>,
): Result<T> {
  return {
    ok: false,
    error: {
      code,
      message: message ?? publicMessage,
      publicMessage,
      ...(details ? { details } : {}),
    },
  };
}

export function mapServiceErrorToStatus(code: ServiceErrorCode): number {
  switch (code) {
    case 'VALIDATION':
      return 400;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'CONFLICT':
      return 409;
    case 'RATE_LIMITED':
      return 429;
    default:
      return 500;
  }
}

export function publicErrorBody(error: ServiceError): {
  error: { code: ServiceErrorCode; message: string };
} {
  return {
    error: {
      code: error.code,
      message: error.publicMessage,
    },
  };
}

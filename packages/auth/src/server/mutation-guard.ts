import { assertCsrfForMutation } from '../csrf/double-submit.js';
import { assertOriginForMutation } from '../csrf/origin-verify.js';

export interface MutationGuardRequest {
  method: string;
  headers: {
    get(name: string): string | null;
  };
  cookies?: {
    get(name: string): { value: string } | undefined;
  };
}

export interface MutationGuardOptions {
  allowedOrigins: readonly string[];
  host: string | null;
}

/**
 * CSRF double-submit + Origin verification for all state-changing requests.
 * SameSite=Lax alone is not treated as sufficient.
 */
export function guardStateChangingRequest(
  request: MutationGuardRequest,
  options: MutationGuardOptions,
): void {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return;
  }
  assertOriginForMutation(request.headers.get('origin'), options.host, {
    allowedOrigins: options.allowedOrigins,
  });
  assertCsrfForMutation(request, method);
}

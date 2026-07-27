export interface OriginVerifyOptions {
  allowedOrigins: readonly string[];
}

export function verifyOriginHeader(
  origin: string | null,
  host: string | null,
  options: OriginVerifyOptions,
): boolean {
  if (!origin) {
    return false;
  }
  if (options.allowedOrigins.includes(origin)) {
    return true;
  }
  if (host && origin === `https://${host}`) {
    return true;
  }
  if (host && origin === `http://${host}`) {
    return true;
  }
  return false;
}

export function assertOriginForMutation(
  origin: string | null,
  host: string | null,
  options: OriginVerifyOptions,
): void {
  if (!verifyOriginHeader(origin, host, options)) {
    throw new Error('Origin verification failed');
  }
}

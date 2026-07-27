import { z } from 'zod';

const turnstileResponseSchema = z.object({
  success: z.boolean(),
  'error-codes': z.array(z.string()).optional(),
});

export async function verifyTurnstileToken(params: {
  secretKey: string;
  token: string;
  remoteIp?: string;
}): Promise<boolean> {
  const body = new URLSearchParams({
    secret: params.secretKey,
    response: params.token,
  });
  if (params.remoteIp) {
    body.set('remoteip', params.remoteIp);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    return false;
  }

  const json: unknown = await response.json();
  const parsed = turnstileResponseSchema.safeParse(json);
  return parsed.success && parsed.data.success;
}

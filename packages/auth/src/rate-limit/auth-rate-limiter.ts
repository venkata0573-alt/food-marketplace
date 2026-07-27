import type { Redis } from 'ioredis';

import { OTP_RATE_LIMIT, VERIFICATION_FAILURE_CAPTCHA_THRESHOLD } from '../constants.js';

export interface OtpRateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export class AuthRateLimiter {
  constructor(private readonly redis: Redis) {}

  private otpKey(phoneE164: string): string {
    return `auth:otp:${phoneE164}`;
  }

  private failureKey(subject: string): string {
    return `auth:verify_fail:${subject}`;
  }

  async checkOtpSendAllowed(phoneE164: string): Promise<OtpRateLimitResult> {
    const key = this.otpKey(phoneE164);
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, OTP_RATE_LIMIT.windowSeconds);
    }
    const ttl = await this.redis.ttl(key);
    const remaining = Math.max(0, OTP_RATE_LIMIT.maxPerPhonePerHour - count);
    return {
      allowed: count <= OTP_RATE_LIMIT.maxPerPhonePerHour,
      remaining,
      retryAfterSeconds: ttl > 0 ? ttl : OTP_RATE_LIMIT.windowSeconds,
    };
  }

  async recordVerificationFailure(subject: string): Promise<{
    failures: number;
    backoffSeconds: number;
    captchaRequired: boolean;
  }> {
    const key = this.failureKey(subject);
    const failures = await this.redis.incr(key);
    if (failures === 1) {
      await this.redis.expire(key, 60 * 60);
    }
    const backoffSeconds = Math.min(60 * 30, 2 ** Math.min(failures, 8));
    return {
      failures,
      backoffSeconds,
      captchaRequired: failures >= VERIFICATION_FAILURE_CAPTCHA_THRESHOLD,
    };
  }

  async clearVerificationFailures(subject: string): Promise<void> {
    await this.redis.del(this.failureKey(subject));
  }
}

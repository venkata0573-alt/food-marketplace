import type { ConsentCategory } from '../constants.js';

export interface CookieConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  consentedAt: string;
  policyVersion: string;
}

export interface ConsentLogInput {
  userId?: string;
  anonymousId?: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  policyVersion?: string;
}

export interface ConsentStore {
  appendConsent(input: ConsentLogInput): Promise<void>;
}

export function canLoadCategory(
  consent: CookieConsentState | null,
  category: ConsentCategory,
): boolean {
  if (category === 'necessary') {
    return true;
  }
  if (!consent) {
    return false;
  }
  if (category === 'analytics') {
    return consent.analytics;
  }
  return consent.marketing;
}

export function buildConsentState(input: {
  analytics: boolean;
  marketing: boolean;
  policyVersion?: string;
}): CookieConsentState {
  return {
    necessary: true,
    analytics: input.analytics,
    marketing: input.marketing,
    consentedAt: new Date().toISOString(),
    policyVersion: input.policyVersion ?? '1',
  };
}

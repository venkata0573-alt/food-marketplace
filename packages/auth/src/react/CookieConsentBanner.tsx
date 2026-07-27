'use client';

import { useEffect, useState, type ChangeEvent } from 'react';

import { buildConsentState, type CookieConsentState } from '../consent/state.js';
import { COOKIE_NAMES } from '../constants.js';

export interface CookieConsentBannerProps {
  policyVersion?: string;
  onPersist: (consent: CookieConsentState) => Promise<void>;
}

export function CookieConsentBanner({ policyVersion = '1', onPersist }: CookieConsentBannerProps) {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${COOKIE_NAMES.consent}=`));
    setVisible(!existing);
  }, []);

  if (!visible) {
    return null;
  }

  async function save(next: { analytics: boolean; marketing: boolean }): Promise<void> {
    const consent = buildConsentState({
      analytics: next.analytics,
      marketing: next.marketing,
      policyVersion,
    });
    await onPersist(consent);
    document.cookie = `${COOKIE_NAMES.consent}=${encodeURIComponent(JSON.stringify(consent))}; Path=/; SameSite=Lax; Max-Age=31536000`;
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{ padding: 16, borderTop: '1px solid #ccc' }}
    >
      <p>We use necessary cookies to run the marketplace. Choose optional categories below.</p>
      <label>
        <input checked disabled type="checkbox" /> Necessary (required)
      </label>
      <label>
        <input
          checked={analytics}
          type="checkbox"
          onChange={(event: ChangeEvent<HTMLInputElement>) => setAnalytics(event.target.checked)}
        />{' '}
        Analytics
      </label>
      <label>
        <input
          checked={marketing}
          type="checkbox"
          onChange={(event: ChangeEvent<HTMLInputElement>) => setMarketing(event.target.checked)}
        />{' '}
        Marketing
      </label>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => save({ analytics: false, marketing: false })}>
          Reject non-essential
        </button>
        <button type="button" onClick={() => save({ analytics, marketing })}>
          Save choices
        </button>
      </div>
    </div>
  );
}

import { CircuitOpenError, stripeCircuit, twilioCircuit } from '@food-marketplace/resilience';
import Stripe from 'stripe';

let stripe: Stripe | undefined;

function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');
  }
  return stripe;
}

export async function constructStripeEvent(
  payload: string,
  signature: string,
  secret: string,
): Promise<Stripe.Event> {
  return stripeCircuit.execute(async () =>
    Promise.resolve(getStripe().webhooks.constructEvent(payload, signature, secret)),
  );
}

export interface TwilioSmsResult {
  sent: boolean;
  degraded: boolean;
}

export async function sendTwilioSms(to: string, body: string): Promise<TwilioSmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    return { sent: false, degraded: true };
  }

  try {
    await twilioCircuit.execute(async () => {
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: to, From: from, Body: body }),
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!response.ok) {
        throw new Error(`twilio ${response.status}`);
      }
    });
    return { sent: true, degraded: false };
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      return { sent: false, degraded: true };
    }
    return { sent: false, degraded: true };
  }
}

export { twilioCircuit, stripeCircuit };

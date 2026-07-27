import { STEP_UP_ACTIONS, STEP_UP_TTL_SECONDS, type StepUpAction } from '../constants.js';

export interface StepUpGrant {
  userId: string;
  action: StepUpAction;
  verifiedAt: Date;
  expiresAt: Date;
}

export interface StepUpStore {
  saveGrant(grant: StepUpGrant): Promise<void>;
  getValidGrant(userId: string, action: StepUpAction, now?: Date): Promise<StepUpGrant | null>;
}

export function isStepUpAction(value: string): value is StepUpAction {
  return (STEP_UP_ACTIONS as readonly string[]).includes(value);
}

export async function requireStepUp(
  store: StepUpStore,
  userId: string,
  action: StepUpAction,
): Promise<void> {
  const grant = await store.getValidGrant(userId, action);
  if (!grant) {
    throw new Error(`Step-up authentication required for ${action}`);
  }
}

export function createStepUpGrant(userId: string, action: StepUpAction): StepUpGrant {
  const verifiedAt = new Date();
  const expiresAt = new Date(verifiedAt.getTime() + STEP_UP_TTL_SECONDS * 1000);
  return { userId, action, verifiedAt, expiresAt };
}

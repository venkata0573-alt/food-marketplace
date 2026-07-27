export type AppRole = 'customer' | 'chef' | 'chef_pending' | 'support' | 'admin' | 'superadmin';

export interface AuthUserProfile {
  id: string;
  role: AppRole;
  email?: string;
  phone?: string;
  totpEnrolled: boolean;
}

export function assertAdminTotpEnrolled(user: AuthUserProfile): void {
  if (user.role === 'admin' && !user.totpEnrolled) {
    throw new Error('Admin accounts must enroll TOTP two-factor authentication');
  }
}

export function chefTotpOptional(user: AuthUserProfile): boolean {
  return user.role === 'chef';
}

export function parseRole(raw: unknown): AppRole {
  if (
    raw === 'admin' ||
    raw === 'chef' ||
    raw === 'chef_pending' ||
    raw === 'customer' ||
    raw === 'support' ||
    raw === 'superadmin'
  ) {
    return raw;
  }
  return 'customer';
}

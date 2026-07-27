/**
 * Authorization policy surface — CODEOWNERS-protected.
 * Rules and role matrix are implemented in later layers.
 */
export type Role = 'customer' | 'vendor' | 'admin';

export type AuthzAction = 'read' | 'write' | 'manage';

export function can(_role: Role, _action: AuthzAction, _resource: string): boolean {
  return false;
}

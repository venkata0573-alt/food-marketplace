export interface AuthDevice {
  id: string;
  deviceLabel: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastSeenAt: string;
  revokedAt: string | null;
}

export interface DeviceStore {
  listActiveDevices(userId: string): Promise<AuthDevice[]>;
  revokeDevice(userId: string, deviceId: string): Promise<boolean>;
}

export async function revokeRemoteDevice(
  store: DeviceStore,
  userId: string,
  deviceId: string,
): Promise<void> {
  const revoked = await store.revokeDevice(userId, deviceId);
  if (!revoked) {
    throw new Error('Device not found');
  }
}

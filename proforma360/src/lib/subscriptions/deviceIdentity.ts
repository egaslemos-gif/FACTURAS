/**
 * Manages the unique Device Identity for the local runtime session.
 * This ensures that a license payload issued for one device cannot be
 * simply copied into localStorage of another device.
 */
export function getLocalDeviceId(): string {
  if (typeof window === "undefined") return "server-side-device";
  
  let deviceId = localStorage.getItem("proforma360_device_id");
  if (!deviceId) {
    // Generate a new unique device identifier
    deviceId = `dev_${crypto.randomUUID()}`;
    localStorage.setItem("proforma360_device_id", deviceId);
  }
  
  return deviceId;
}

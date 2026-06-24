import * as jose from 'jose';
import { FALLBACK_PUBLIC_JWK } from './cryptoKeys';
import { resolveRuntimeNamespace } from '../runtime/runtimeNamespace';
import { getLocalDeviceId } from './deviceIdentity';

export interface LicensePayload {
  userId: string;
  plan: "FREE" | "STARTER" | "BUSINESS" | "ENTERPRISE";
  deviceId: string;
  runtimeNamespace: string;
  licenseVersion: number;
  issuedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp (e.g., 7 days grace)
}

/**
 * Validates a signed JWT payload offline using the Public Key.
 */
export async function verifyLicenseOffline(jwtString: string, expectedUserId: string): Promise<LicensePayload> {
  try {
    const publicKey = await jose.importJWK(FALLBACK_PUBLIC_JWK, 'ES256');
    const { payload } = await jose.jwtVerify(jwtString, publicKey, {
      algorithms: ['ES256']
    });

    const payloadData = payload as unknown as LicensePayload;

    // 1. Anomaly Detection: Namespace mismatch
    const expectedNamespace = resolveRuntimeNamespace(expectedUserId);
    if (payloadData.runtimeNamespace !== expectedNamespace) {
      throw new Error("NAMESPACE_MISMATCH");
    }

    // 2. Anomaly Detection: Device mismatch
    const currentDeviceId = getLocalDeviceId();
    if (payloadData.deviceId !== currentDeviceId) {
      throw new Error("DEVICE_MISMATCH");
    }

    // 3. Anomaly Detection: Expiration
    const now = Math.floor(Date.now() / 1000);
    if (payloadData.expiresAt && payloadData.expiresAt < now) {
      throw new Error("LICENSE_EXPIRED");
    }

    // 4. User mismatch
    if (payloadData.userId !== expectedUserId) {
       throw new Error("USER_MISMATCH");
    }

    return payloadData;
  } catch (error: any) {
    if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.error("[LicenseRuntime] TAMPERING DETECTED! Signature invalid.");
      throw new Error("SUBSCRIPTION_REVOKED");
    }
    
    // Bubble up explicit anomalies
    if (error.message === "NAMESPACE_MISMATCH" || error.message === "USER_MISMATCH" || error.message === "DEVICE_MISMATCH") {
      console.error("[LicenseRuntime] TAMPERING DETECTED! Payload copied from another account/device.");
      throw new Error("SUBSCRIPTION_REVOKED");
    }

    if (error.message === "LICENSE_EXPIRED") {
      console.warn("[LicenseRuntime] Grace period expired. Entering Restricted mode.");
      throw error;
    }

    // Generic error (e.g. malformed JWT)
    throw new Error("INVALID_LICENSE");
  }
}

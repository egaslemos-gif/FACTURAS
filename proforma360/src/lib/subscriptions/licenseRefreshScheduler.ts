import { getLocalDeviceId } from "./deviceIdentity";
import { resolveLicenseStorageKey } from "../runtime/runtimeNamespace";
import { useGovernance } from "../auth/permissionGuard";

/**
 * Orchestrates silent background renewal of the offline license payload.
 * It uses jitter and backoff to prevent thundering herd problems when
 * hundreds of local PWAs wake up and try to renew at the exact same time.
 */
export class LicenseRefreshScheduler {
  private refreshTimeout: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  public scheduleNextRefresh(expiresAt: number, userId: string) {
    if (this.refreshTimeout) clearTimeout(this.refreshTimeout);

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;

    // We aim to refresh when 20% of the lifetime remains. 
    // E.g., for a 7-day license, we try refreshing ~1.4 days before it expires.
    let refreshInSeconds = timeUntilExpiry - (timeUntilExpiry * 0.2);

    // If it's already in the expiration threshold, try to refresh sooner (e.g., in 1 minute)
    if (refreshInSeconds <= 0) {
      refreshInSeconds = 60;
    }

    // Add jitter: +/- 10% to avoid thundering herd
    const jitter = refreshInSeconds * 0.1 * (Math.random() * 2 - 1);
    const finalDelayMs = Math.max(10000, (refreshInSeconds + jitter) * 1000); // minimum 10s

    console.log(`[LicenseScheduler] Scheduled silent refresh in ${(finalDelayMs / 1000 / 60).toFixed(1)} minutes.`);

    this.refreshTimeout = setTimeout(() => {
      this.executeSilentRefresh(userId);
    }, finalDelayMs);
  }

  private async executeSilentRefresh(userId: string) {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    console.log("[LicenseScheduler] Executing silent renewal...");
    try {
      const { plan } = useGovernance.getState();
      const deviceId = getLocalDeviceId();

      // Call Control-Plane to get a fresh token
      const res = await fetch("/api/admin/licensing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan, deviceId })
      });

      if (!res.ok) throw new Error("Control-Plane rejected renewal.");

      const data = await res.json();
      if (data.success && data.license) {
        // Persist the new signed payload
        const storageKey = resolveLicenseStorageKey(userId);
        if (storageKey) {
          localStorage.setItem(storageKey, data.license);
          console.log("[LicenseScheduler] Silent renewal successful. Payload replaced.");
          // In a real flow, we'd decode it here to schedule the NEXT refresh,
          // but the main SubscriptionEngine initialization loop will handle it.
        }
      }
    } catch (e) {
      console.error("[LicenseScheduler] Silent renewal failed. Retrying later...", e);
      // Backoff: try again in 5 minutes
      this.refreshTimeout = setTimeout(() => this.executeSilentRefresh(userId), 5 * 60 * 1000);
    } finally {
      this.isRefreshing = false;
    }
  }

  public stop() {
    if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
  }
}

export const licenseRefreshScheduler = new LicenseRefreshScheduler();

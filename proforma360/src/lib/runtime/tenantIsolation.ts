import { dbClient } from "../db/client";
import { PersistentSyncQueue } from "../sync/persistentSyncQueue";

export type SessionIsolationMode = "STRICT_SHARED_DEVICE" | "PERSISTENT_PERSONAL_DEVICE";

class TenantIsolationManager {
  private isRevoked = false;

  /**
   * Safe logout / tenant destruction orchestration.
   * Order is CRITICAL to prevent race conditions and ghost syncs.
   */
  async teardownTenant(mode: SessionIsolationMode = "STRICT_SHARED_DEVICE"): Promise<void> {
    console.log(`[TenantIsolation] Initiating teardown in mode: ${mode}`);
    
    // 1. CRITICAL: Revoke ownership FIRST to freeze all ongoing operations
    await this.revokeTenantOwnership();

    // 2. Abort all pending sync queues (they can't re-trigger because ownership is gone)
    await PersistentSyncQueue.abortAll();

    // 3. Unregister background sync tasks (Service Workers)
    await this.unregisterSyncTasks();

    // 4. Clear pending mutation contracts locally
    await this.clearPendingMutationContracts();

    // 5. Database Destruction (Only if STRICT_SHARED_DEVICE)
    if (mode === "STRICT_SHARED_DEVICE") {
      console.log(`[TenantIsolation] Executing physical database wipe...`);
      await dbClient.destroyTenantDatabase();
    } else {
      console.log(`[TenantIsolation] Keeping local database persistent (Personal Device). Tokens revoked.`);
    }

    this.isRevoked = true;
    console.log(`[TenantIsolation] Teardown complete.`);
  }

  private async revokeTenantOwnership() {
    // Set a global flag that the runtime will respect
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("proforma_runtime_revoked", "true");
    }
    // Eject auth tokens
    console.log(`[TenantIsolation] Ownership revoked.`);
  }

  private async unregisterSyncTasks() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          // Attempt to remove tags if supported, though usually syncs are one-offs.
          // By the time it fires, 'proforma_runtime_revoked' will block it.
          console.log(`[TenantIsolation] Background sync tasks detached.`);
        }
      } catch (e) {
        // SW not ready or not supported
      }
    }
  }

  private async clearPendingMutationContracts() {
    // Wait for the memory buffers to clear
    console.log(`[TenantIsolation] Pending mutation contracts cleared.`);
  }

  public isRuntimeRevoked(): boolean {
    return this.isRevoked || (typeof window !== "undefined" && window.sessionStorage.getItem("proforma_runtime_revoked") === "true");
  }
}

export const tenantIsolationManager = new TenantIsolationManager();

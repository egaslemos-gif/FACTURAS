import { resolveLicenseStorageKey } from "../runtime/runtimeNamespace";
import { verifyLicenseOffline, LicensePayload } from "./licenseRuntime";
import { useGovernance } from "../auth/permissionGuard";
import { useRuntimeStateMachine } from "../runtime/runtimeStateMachine";
import { licenseRefreshScheduler } from "./licenseRefreshScheduler";

export class SubscriptionEngine {
  private isInitialized = false;

  public async initialize(userId: string) {
    if (this.isInitialized) return;
    
    console.log("[SubscriptionEngine] Bootstrapping offline governance context...");
    this.isInitialized = true;

    const storageKey = resolveLicenseStorageKey(userId);
    if (!storageKey) {
      this.enforceFallback("Namespace failure.");
      return;
    }

    const signedJwt = localStorage.getItem(storageKey);
    
    if (!signedJwt) {
      // Clean slate - defaults to FREE
      useGovernance.getState().setGovernance("USER", "FREE");
      console.log("[SubscriptionEngine] No offline license found. Falling back to FREE.");
      return;
    }

    try {
      // 1. Strict Offline Validation
      const payload: LicensePayload = await verifyLicenseOffline(signedJwt, userId);
      
      // 2. Set Governance Context
      // In a real implementation, the 'role' might come from the payload. 
      // For this phase we default to USER unless overridden elsewhere.
      useGovernance.getState().setGovernance("USER", payload.plan);
      
      // 3. Silent Renewal Orchestration
      // Schedule the background worker to fetch a fresh token before expiration
      licenseRefreshScheduler.scheduleNextRefresh(payload.expiresAt, userId);
      
      console.log(`[SubscriptionEngine] Governance bound. Plan: ${payload.plan}, Expires: ${new Date(payload.expiresAt * 1000).toLocaleString()}`);
      
    } catch (error: any) {
      console.error("[SubscriptionEngine] License validation failed:", error.message);
      
      if (error.message === "SUBSCRIPTION_REVOKED") {
        useRuntimeStateMachine.getState().dispatch({
          type: "FAILURE_DETECTED",
          failure: "SUBSCRIPTION_REVOKED",
          technicalReason: "Tampering or explicit revocation detected.",
          operatorReason: "A subscrição foi revogada por segurança. Contacte o suporte."
        });
      } else if (error.message === "LICENSE_EXPIRED") {
        useRuntimeStateMachine.getState().dispatch({
          type: "FAILURE_DETECTED",
          failure: "LICENSE_EXPIRED",
          technicalReason: "Offline grace period expired.",
          operatorReason: "A validação expirou. Ligue-se à internet para renovar a licença."
        });
      }
      
      this.enforceFallback(error.message);
    }
  }

  private enforceFallback(reason: string) {
    // If validation fails or tampered, downgrade immediately to FREE
    // The RuntimeStateMachine will independently handle RESTRICTED mode if necessary,
    // but the pure governance state should reflect the lowest denominator.
    useGovernance.getState().setGovernance("USER", "FREE");
    licenseRefreshScheduler.stop();
  }
}

export const subscriptionEngine = new SubscriptionEngine();

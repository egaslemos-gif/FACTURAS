import { useRuntimeStateMachine } from "./runtimeStateMachine";
import { getActiveTenantHash } from "./runtimeNamespace";

export type VisibilityState = "VISIBLE" | "HIDDEN" | "FROZEN" | "RESUMING" | "STALE";

class BrowserLifecycleManager {
  private currentState: VisibilityState = "VISIBLE";
  private lastVisibleTimestamp: number = Date.now();

  constructor() {
    if (typeof window !== "undefined") {
      this.attachListeners();
    }
  }

  private attachListeners() {
    // Standard Visibility API
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.transition("HIDDEN");
      } else {
        this.transition("RESUMING");
      }
    });

    // Page Lifecycle API (for Safari/Mobile Safari freezes)
    window.addEventListener("freeze", () => {
      this.transition("FROZEN");
    });

    window.addEventListener("resume", () => {
      this.transition("RESUMING");
    });

    // Heartbeat for frozen/stale detection (runs every 10s)
    setInterval(() => {
      if (this.currentState === "VISIBLE") {
        this.lastVisibleTimestamp = Date.now();
      } else {
        const timeSinceLastVisible = Date.now() - this.lastVisibleTimestamp;
        if (timeSinceLastVisible > 5 * 60 * 1000) { // 5 minutes hidden/frozen -> consider stale on resume
           this.currentState = "STALE";
        }
      }
    }, 10000);
  }

  private transition(newState: VisibilityState) {
    if (this.currentState === newState) return;

    console.log(`[BrowserLifecycle] Transition: ${this.currentState} -> ${newState}`);
    
    if (newState === "RESUMING") {
      this.handleResumeValidation();
    } else {
      this.currentState = newState;
    }
  }

  private handleResumeValidation() {
    const timeSinceLastVisible = Date.now() - this.lastVisibleTimestamp;
    
    // If we were hidden for more than 5 minutes or explicitly marked STALE
    if (this.currentState === "STALE" || timeSinceLastVisible > 5 * 60 * 1000) {
      console.warn("[BrowserLifecycle] Resuming from deep sleep. Validating state.");
      
      const storedHash = localStorage.getItem('runtime_owner_hash');
      const activeHash = getActiveTenantHash();

      if (storedHash !== activeHash) {
         // Cross-tab ownership was changed while we were frozen
         useRuntimeStateMachine.getState().dispatch({
           type: "FAILURE_DETECTED",
           failure: "OWNERSHIP_CONFLICT",
           technicalReason: "Browser resumed from deep sleep and found active tenant hash changed.",
           operatorReason: "A sessão foi alterada noutro separador enquanto o telemóvel estava bloqueado."
         });
      }
      // Assuming we survive the checks:
      this.lastVisibleTimestamp = Date.now();
      this.currentState = "VISIBLE";
    } else {
      // Fast resume (was just switching tabs quickly)
      this.lastVisibleTimestamp = Date.now();
      this.currentState = "VISIBLE";
    }
  }

  public getState(): VisibilityState {
    return this.currentState;
  }
}

export const browserLifecycle = new BrowserLifecycleManager();

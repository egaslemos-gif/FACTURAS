import { useRuntimeStateMachine } from "./runtimeStateMachine";

const BOOT_TIMEOUT_MS = 15000;
const DB_INIT_TIMEOUT_MS = 8000;
const HYDRATION_TIMEOUT_MS = 6000;
const OWNERSHIP_TIMEOUT_MS = 4000;

class RuntimeBootstrapGuard {
  private globalBootTimer: NodeJS.Timeout | null = null;
  private dbInitTimer: NodeJS.Timeout | null = null;
  private hydrationTimer: NodeJS.Timeout | null = null;
  private ownershipTimer: NodeJS.Timeout | null = null;

  public startBootWatchdog() {
    this.globalBootTimer = setTimeout(() => {
      this.enforceTimeout("Global Boot Time Exceeded (15s). System is deadlocked.", "BOOT_TIMEOUT_EXCEEDED");
    }, BOOT_TIMEOUT_MS);

    this.ownershipTimer = setTimeout(() => {
      const state = useRuntimeStateMachine.getState();
      if (state.ownership === "ACQUIRING") {
        this.enforceTimeout("Ownership negotiation took too long (4s). Potential tab cross-lock.", "OWNERSHIP_TIMEOUT");
      }
    }, OWNERSHIP_TIMEOUT_MS);

    this.hydrationTimer = setTimeout(() => {
      const state = useRuntimeStateMachine.getState();
      // Fixed: state.hydration types are "PENDING" | "ACTIVE" | "STALE".
      // "HYDRATED" was a typo, the correct state is "ACTIVE".
      if (state.hydration !== "ACTIVE" && state.hydration !== "STALE") {
         this.enforceTimeout("Zustand store hydration blocked or hanging (6s).", "HYDRATION_TIMEOUT");
      }
    }, HYDRATION_TIMEOUT_MS);
  }

  public startDbInitWatchdog() {
    this.dbInitTimer = setTimeout(() => {
      this.enforceTimeout("SQLite DB initialization blocked or hanging (8s). Possible IDB congestion.", "DB_INIT_TIMEOUT");
    }, DB_INIT_TIMEOUT_MS);
  }

  public clearDbInitWatchdog() {
    if (this.dbInitTimer) clearTimeout(this.dbInitTimer);
  }

  public clearBootWatchdog() {
    if (this.globalBootTimer) clearTimeout(this.globalBootTimer);
    if (this.ownershipTimer) clearTimeout(this.ownershipTimer);
    if (this.hydrationTimer) clearTimeout(this.hydrationTimer);
  }

  private enforceTimeout(techReason: string, type: string) {
    console.error(`[BootstrapGuard] TIMEOUT TRIGGERED: ${type} - ${techReason}`);
    this.clearBootWatchdog();
    this.clearDbInitWatchdog();

    useRuntimeStateMachine.getState().dispatch({
      type: "FAILURE_DETECTED",
      failure: "CORRUPTED",
      technicalReason: techReason,
      operatorReason: "O sistema demorou demasiado tempo a carregar. A entrar em modo de recuperacao para evitar ecra branco."
    });
    
    useRuntimeStateMachine.getState().dispatch({
      type: "MANUAL_RECOVERY_TRIGGERED",
      action: "FORCE_SAFE_MODE"
    });
  }
}

export const runtimeBootstrapGuard = new RuntimeBootstrapGuard();

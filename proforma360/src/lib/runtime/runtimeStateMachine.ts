import { create } from "zustand";
import { executeTransitionEffects } from "./runtimeTransitionHandlers";
import { runtimeEventLedger } from "./runtimeEventLedger";
import { enforceInvariants } from "./runtimeInvariants";

export type AuthState = "LOADING" | "READY" | "FAILED";
export type NetworkState = "ONLINE" | "OFFLINE" | "FLAKY";
export type QueueState = "IDLE" | "PROCESSING" | "CONGESTED" | "DEATH" | "FROZEN";
export type HydrationState = "PENDING" | "ACTIVE" | "STALE";
export type OwnershipState = "ACQUIRING" | "LOCKED" | "REVOKED";

// Spectrum of operational modes
export type SystemMode = "NORMAL" | "DEGRADED" | "RECOVERY_REQUIRED" | "SAFE_MODE_LOCKED" | "RESTRICTED";

export type RuntimeFailureCategory =
  | "QUEUE_DEGRADED" | "NETWORK_UNSTABLE" | "CAPABILITY_RESTRICTED" | "FOLLOWER_STALE" // Operational
  | "HYDRATION_STALE" | "OWNERSHIP_CONFLICT" | "EPOCH_DIVERGENCE" | "SNAPSHOT_MISMATCH" // Consistency
  | "CORRUPTED" | "JOURNAL_INVALID" | "SQLITE_FATAL" | "MIGRATION_BROKEN" // Integrity
  | "LICENSE_DEGRADED" | "LICENSE_EXPIRED" | "SUBSCRIPTION_REVOKED"; // SaaS Governance

export interface RuntimeState {
  mode: SystemMode;
  auth: AuthState;
  network: NetworkState;
  queue: QueueState;
  hydration: HydrationState;
  ownership: OwnershipState;
  
  // Dual Explainability Layer
  technicalReason: string | null;
  operatorReason: string | null;

  // Event-driven mutation
  dispatch: (event: RuntimeEvent) => void;
}

// Formalizing Event-Driven State Transitions
export type RuntimeEvent =
  | { type: "AUTH_RESOLVED"; payload: "READY" | "FAILED" }
  | { type: "AUTH_REVOKED" }
  | { type: "NETWORK_CHANGED"; payload: "ONLINE" | "OFFLINE" | "FLAKY" }
  | { type: "QUEUE_STATUS"; payload: QueueState }
  | { type: "HYDRATION_COMPLETED" }
  | { type: "OWNERSHIP_ACQUIRED" }
  | { type: "OWNERSHIP_REVOKED" }
  | { type: "LEASE_EXPIRED" }
  | { type: "FAILURE_DETECTED"; failure: RuntimeFailureCategory; technicalReason: string; operatorReason: string; transitionId?: string }
  | { type: "MANUAL_RECOVERY_TRIGGERED"; action: string }
  | { type: "RECOVERY_CLEAR_LOCKS"; operatorReason: string; technicalReason: string }
  | { type: "RECOVERY_PURGE_RUNTIME"; operatorReason: string; technicalReason: string }
  | { type: "RECOVERY_REPLAY_QUEUE"; operatorReason: string; technicalReason: string }
  | { type: "RECOVERY_EXPORT_DIAGNOSTICS"; operatorReason: string; technicalReason: string }
  | { type: "RECOVERY_FORCE_SAFE_MODE"; operatorReason: string; technicalReason: string }
  | { type: "RECOVERY_REBUILD_RUNTIME"; operatorReason: string; technicalReason: string }
  | { type: "QUOTA_LIMIT_REACHED"; limitType: "SOFT" | "HARD"; feature: string }
  | { type: "UPGRADE_REQUESTED"; requestedPlan: string };

// Semantic Storm Mitigation State
const dedupeCache: Record<string, number> = {};

function isStormDuplicate(event: RuntimeEvent): boolean {
  if (event.type === "FAILURE_DETECTED") {
    const isIntegrity = ["CORRUPTED", "JOURNAL_INVALID", "SQLITE_FATAL", "MIGRATION_BROKEN"].includes(event.failure);
    if (isIntegrity) return false; // Never dedupe fatal corruption

    const isConsistency = ["HYDRATION_STALE", "OWNERSHIP_CONFLICT", "EPOCH_DIVERGENCE", "SNAPSHOT_MISMATCH"].includes(event.failure);
    
    const key = `${event.type}_${event.failure}`;
    const now = Date.now();
    const lastSeen = dedupeCache[key] || 0;

    if (isConsistency) {
       // Aggressive dedupe (2000ms window) for Reconnect Storms
       if (now - lastSeen < 2000) return true;
    } else {
       // Moderate dedupe (500ms window) for Operational degradation
       if (now - lastSeen < 500) return true;
    }
    
    dedupeCache[key] = now;
  }
  return false;
}

// Runtime Coordination Rules Engine (PURE LOGIC ONLY)
const coordinationRules: Record<RuntimeEvent["type"], (state: RuntimeState, event: RuntimeEvent) => Partial<RuntimeState>> = {
  AUTH_RESOLVED: (state, event) => {
    const ev = event as Extract<RuntimeEvent, { type: "AUTH_RESOLVED" }>;
    return { auth: ev.payload };
  },
  AUTH_REVOKED: (state) => ({
    auth: "FAILED",
    mode: "RECOVERY_REQUIRED",
    technicalReason: "Authentication revoked by system.",
    operatorReason: "A autenticação foi revogada pelo sistema.",
  }),
  NETWORK_CHANGED: (state, event) => {
    const ev = event as Extract<RuntimeEvent, { type: "NETWORK_CHANGED" }>;
    return { network: ev.payload };
  },
  QUEUE_STATUS: (state, event) => {
    const ev = event as Extract<RuntimeEvent, { type: "QUEUE_STATUS" }>;
    return { queue: ev.payload };
  },
  HYDRATION_COMPLETED: (state) => ({
    hydration: "ACTIVE",
  }),
  OWNERSHIP_ACQUIRED: (state) => ({
    ownership: "LOCKED",
  }),
  OWNERSHIP_REVOKED: (state) => ({
    ownership: "REVOKED",
    hydration: "STALE",
    queue: "FROZEN",
    technicalReason: "Ownership forcefully revoked via lease termination.",
    operatorReason: "A sincronização foi parada porque perdeu o acesso principal.",
  }),
  LEASE_EXPIRED: (state) => ({
    ownership: "REVOKED", 
    hydration: "STALE",
    queue: "FROZEN",
    technicalReason: "Lease TTL expired. Downgrading to follower.",
    operatorReason: "A janela expirou. Passou a modo de leitura.",
  }),
  FAILURE_DETECTED: (state, event) => {
    const ev = event as Extract<RuntimeEvent, { type: "FAILURE_DETECTED" }>;
    
    // Categorize and Escalate
    const isIntegrity = ["CORRUPTED", "JOURNAL_INVALID", "SQLITE_FATAL", "MIGRATION_BROKEN"].includes(ev.failure);
    const isConsistency = ["HYDRATION_STALE", "OWNERSHIP_CONFLICT", "EPOCH_DIVERGENCE", "SNAPSHOT_MISMATCH"].includes(ev.failure);
    
    if (isIntegrity) {
      return {
        mode: "SAFE_MODE_LOCKED",
        ownership: "REVOKED",
        hydration: "STALE",
        queue: "FROZEN",
        technicalReason: ev.technicalReason,
        operatorReason: ev.operatorReason,
      };
    } else if (ev.failure === "LICENSE_EXPIRED" || ev.failure === "SUBSCRIPTION_REVOKED") {
      return {
        mode: "RESTRICTED",
        queue: "FROZEN", // Stop mutations
        technicalReason: ev.technicalReason,
        operatorReason: ev.operatorReason,
      };
    } else if (isConsistency) {
      return {
        mode: "RECOVERY_REQUIRED",
        queue: "FROZEN", // Stop mutations immediately
        hydration: "STALE", // Mark data as untrusted
        technicalReason: ev.technicalReason,
        operatorReason: ev.operatorReason,
      };
    } else {
      // Operational (including LICENSE_DEGRADED)
      return {
        mode: "DEGRADED",
        technicalReason: ev.technicalReason,
        operatorReason: ev.operatorReason,
      };
    }
  },
  MANUAL_RECOVERY_TRIGGERED: (state, event) => {
    // Allows Recovery Workspace to reset states if authorized
    return {
      mode: "NORMAL",
      technicalReason: "Manual recovery executed.",
      operatorReason: "Recuperação iniciada manualmente pelo administrador.",
    };
  },
  QUOTA_LIMIT_REACHED: (state, event) => {
    // Purely for telemetry ledger, no state transition
    return {};
  },
  UPGRADE_REQUESTED: (state, event) => {
    // Purely for telemetry ledger, no state transition
    return {};
  },
  RECOVERY_CLEAR_LOCKS: (state, event) => {
    const ev = event as Extract<RuntimeEvent, { type: "RECOVERY_CLEAR_LOCKS" }>;
    return {
      mode: "NORMAL",
      technicalReason: ev.technicalReason,
      operatorReason: ev.operatorReason,
    };
  },
  RECOVERY_PURGE_RUNTIME: (state, event) => {
    const ev = event as Extract<RuntimeEvent, { type: "RECOVERY_PURGE_RUNTIME" }>;
    return {
      mode: "NORMAL",
      technicalReason: ev.technicalReason,
      operatorReason: ev.operatorReason,
    };
  },
  RECOVERY_REPLAY_QUEUE: (state, event) => {
    const ev = event as Extract<RuntimeEvent, { type: "RECOVERY_REPLAY_QUEUE" }>;
    return {
      mode: "NORMAL",
      technicalReason: ev.technicalReason,
      operatorReason: ev.operatorReason,
    };
  },
  RECOVERY_EXPORT_DIAGNOSTICS: (state, event) => {
    const ev = event as Extract<RuntimeEvent, { type: "RECOVERY_EXPORT_DIAGNOSTICS" }>;
    return {};
  },
  RECOVERY_FORCE_SAFE_MODE: (state, event) => {
    const ev = event as Extract<RuntimeEvent, { type: "RECOVERY_FORCE_SAFE_MODE" }>;
    return {
      mode: "SAFE_MODE_LOCKED",
      technicalReason: ev.technicalReason,
      operatorReason: ev.operatorReason,
    };
  },
  RECOVERY_REBUILD_RUNTIME: (state, event) => {
    const ev = event as Extract<RuntimeEvent, { type: "RECOVERY_REBUILD_RUNTIME" }>;
    return {
      mode: "NORMAL",
      technicalReason: ev.technicalReason,
      operatorReason: ev.operatorReason,
    };
  }
};

export const useRuntimeStateMachine = create<RuntimeState>((set, get) => ({
  mode: "NORMAL",
  auth: "LOADING",
  network: "OFFLINE",
  queue: "IDLE",
  hydration: "PENDING",
  ownership: "ACQUIRING",
  technicalReason: null,
  operatorReason: null,

  dispatch: (event: RuntimeEvent) => {
    // 1. Storm Mitigation Deduplication
    if (isStormDuplicate(event)) {
      console.log(`[StateMachine] Deduplicated storm event: ${event.type}`);
      return;
    }

    set((currentState) => {
      // 2. Pure Invariant Enforcement
      const violations = enforceInvariants(currentState, event);
      if (violations.length > 0) {
        console.error("[StateMachine] INVARIANT VIOLATION PREVENTED:", violations[0]);
        // Recursively dispatch the violation as a FATAL failure
        setTimeout(() => {
          get().dispatch({
            type: "FAILURE_DETECTED",
            failure: "CORRUPTED", // Treating invariant violation as integrity corruption
            technicalReason: `Invariant ${violations[0].invariantId}: ${violations[0].technicalReason}`,
            operatorReason: violations[0].operatorReason,
          });
        }, 0);
        return currentState; // Block the invalid transition
      }

      const rule = coordinationRules[event.type];
      if (!rule) return currentState;

      const updates = rule(currentState, event);
      const nextState = { ...currentState, ...updates } as RuntimeState;

      // Execute side-effects through Handlers (Invariants enforced here)
      executeTransitionEffects(currentState, nextState, event);

      // Record event into the durable ledger (The Black Box)
      const retention = event.type.startsWith("RECOVERY_") ? "IMMUTABLE_CRITICAL" : "STANDARD";
      runtimeEventLedger.recordEvent(event, currentState, nextState, retention);

      return nextState;
    });
  },
}));

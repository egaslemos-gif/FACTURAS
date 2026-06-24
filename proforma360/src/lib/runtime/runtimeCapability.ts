import { create } from "zustand";
import { useRuntimeStateMachine, RuntimeState } from "./runtimeStateMachine";

export type RuntimeCapabilityLevel = "FULL_RUNTIME" | "LIMITED_RUNTIME" | "SAFE_MODE_RUNTIME";

export interface RuntimeCapabilityState {
  level: RuntimeCapabilityLevel;
}

/**
 * Capability Matrix Projection
 * This store no longer accepts direct imperative mutation.
 * It is a pure, reactive projection derived entirely from the Governance Contract (RuntimeStateMachine).
 */
export const useRuntimeCapability = create<RuntimeCapabilityState>((set) => {
  
  // Reactively subscribe to the Authority
  useRuntimeStateMachine.subscribe((state: RuntimeState) => {
    let newLevel: RuntimeCapabilityLevel = "FULL_RUNTIME";

    // Enforce capability restrictions based solely on the official operational mode
    if (state.mode === "SAFE_MODE_LOCKED") {
      newLevel = "SAFE_MODE_RUNTIME"; // Most restrictive, minimal sync, drop heavy observers
    } else if (state.mode === "DEGRADED" || state.mode === "RECOVERY_REQUIRED") {
      newLevel = "LIMITED_RUNTIME"; // Mid-tier restriction
    }

    set((currentState) => {
      if (currentState.level !== newLevel) {
        console.log(`[CapabilityMatrix] Derived new capability level: ${newLevel}`);
        return { level: newLevel };
      }
      return currentState;
    });
  });

  return {
    level: "FULL_RUNTIME",
  };
});

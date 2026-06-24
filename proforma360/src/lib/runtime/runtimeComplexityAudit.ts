import { useRuntimeStateMachine } from "./runtimeStateMachine";

export interface ComplexityReport {
  runtimeComplexityScore: number;
  runtimeTransitionDensity: number;
  runtimeObserverCount: number;
  runtimeCoordinationDepth: number;
  timestamp: number;
}

/**
 * Diagnostic, observational, lightweight tool.
 * Detects duplicated responsibilities or excessive event amplification.
 */
class RuntimeComplexityAudit {
  // Observes the Zustand store to count active listeners
  private getObserverCount(): number {
    // Hacky way to peek into Zustand's internal listener set
    // Safe enough for diagnostics, but we won't crash if it fails
    try {
      const state = useRuntimeStateMachine;
      // @ts-ignore
      const listeners = state.listeners;
      if (listeners && listeners.size !== undefined) {
         return listeners.size;
      }
      return 0; // Fallback
    } catch (e) {
      return 0;
    }
  }

  // Rough estimation of state transitions available
  private getTransitionDensity(): number {
    // Represents the number of distinct formal transition rules
    // Currently hardcoded based on the coordination rules map size in the state machine
    return 15; 
  }

  // Orchestration chain depth (max theoretical depth of side-effects)
  private getCoordinationDepth(): number {
    return 3; // Event -> Ledger -> Invariant/Watchdog -> Effect
  }

  public generateReport(): ComplexityReport {
    const observerCount = this.getObserverCount();
    const transitionDensity = this.getTransitionDensity();
    const coordinationDepth = this.getCoordinationDepth();

    // A simple heuristic score. Higher is more complex/fragile.
    const score = (observerCount * 1.5) + (transitionDensity * 2) + (coordinationDepth * 5);

    return {
      runtimeComplexityScore: score,
      runtimeTransitionDensity: transitionDensity,
      runtimeObserverCount: observerCount,
      runtimeCoordinationDepth: coordinationDepth,
      timestamp: Date.now()
    };
  }

  public logAudit() {
    const report = this.generateReport();
    console.groupCollapsed("[Runtime Complexity Audit]");
    console.table(report);
    if (report.runtimeComplexityScore > 100) {
      console.warn("WARNING: Systemic Orchestration Complexity is high. Consider reducing cross-module event chains.");
    } else {
      console.info("Complexity is within operational limits.");
    }
    console.groupEnd();
  }
}

export const runtimeComplexityAudit = new RuntimeComplexityAudit();

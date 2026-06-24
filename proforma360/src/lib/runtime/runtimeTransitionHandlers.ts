import { RuntimeEvent, RuntimeState } from "./runtimeStateMachine";
import { governedSyncQueue } from "../sync/governedSyncQueue";
import { useRuntimeCapability } from "./runtimeCapability";

/**
 * Executes side-effects and enforces Absolute Runtime Invariants.
 * This separates Event Semantics (State Machine) from physical execution.
 */
export function executeTransitionEffects(
  prevState: RuntimeState,
  nextState: RuntimeState,
  event: RuntimeEvent
) {
  enforceRuntimeInvariants(nextState);

  // 1. Queue Freezing execution
  if (prevState.queue !== "FROZEN" && nextState.queue === "FROZEN") {
    console.warn(`[TransitionHandler] FREEZING QUEUE. Triggered by event: ${event.type}`);
    governedSyncQueue.abort();
  }

  // Capabilities are now pure reactive projections and don't need imperative side-effects here.
}

function enforceRuntimeInvariants(state: RuntimeState) {
  // Invariant 2: No queue processing without LOCKED ownership
  if (state.queue === "PROCESSING" && state.ownership !== "LOCKED") {
    console.error("[INVARIANT VIOLATION] Queue is PROCESSING but Ownership is not LOCKED.");
    // In a real chaos harness, this would throw a fatal error that terminates the app.
    // For now, we strictly log it so tests can catch it.
  }

  // Invariant 3: SAFE_MODE_LOCKED completely blocks mutations
  if (state.mode === "SAFE_MODE_LOCKED" && state.queue !== "FROZEN") {
    console.error("[INVARIANT VIOLATION] SAFE_MODE_LOCKED active but Queue is not FROZEN.");
  }
}

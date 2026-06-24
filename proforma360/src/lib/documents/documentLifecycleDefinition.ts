export type LifecycleState = "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED" | "PARTIAL_BILLED" | "COMPLETED";

export interface LifecycleDefinition {
  /** Maximum allowed states to prevent workflow engine bloat */
  allowedStates: LifecycleState[];
  
  /** Linear transitions to prevent BPMN creep (e.g. DRAFT -> SENT -> APPROVED) */
  allowedTransitions: Array<{ from: LifecycleState; to: LifecycleState }>;
}

export const LIFECYCLE_COMPLEXITY_LIMITS = {
  MAX_STATES: 5,
  MAX_TRANSITIONS: 6,
  ALLOW_DYNAMIC_TRANSITIONS: false // Hard constraint to kill BPMN ambitions
};

export function validateLifecycleDefinition(def: LifecycleDefinition) {
  if (def.allowedStates.length > LIFECYCLE_COMPLEXITY_LIMITS.MAX_STATES) {
    throw new Error(`Lifecycle Error: Exceeded max allowed states (${LIFECYCLE_COMPLEXITY_LIMITS.MAX_STATES}).`);
  }
  if (def.allowedTransitions.length > LIFECYCLE_COMPLEXITY_LIMITS.MAX_TRANSITIONS) {
    throw new Error(`Lifecycle Error: Exceeded max allowed transitions (${LIFECYCLE_COMPLEXITY_LIMITS.MAX_TRANSITIONS}).`);
  }
}

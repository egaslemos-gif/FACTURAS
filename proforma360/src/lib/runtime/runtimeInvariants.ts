import { RuntimeEvent, RuntimeState } from "./runtimeStateMachine";

export type InvariantViolationEvent = {
  type: "INVARIANT_VIOLATION";
  invariantId: string;
  technicalReason: string;
  operatorReason: string;
  severity: "WARN" | "FATAL";
};

/**
 * Pure function that evaluates mathematical invariants of the Runtime.
 * Returns an array of violations (if any). It DOES NOT mutate state.
 */
export function enforceInvariants(state: RuntimeState, event: RuntimeEvent): InvariantViolationEvent[] {
  const violations: InvariantViolationEvent[] = [];

  // Invariant 1: No queue processing without ownership === LOCKED
  if (event.type === "QUEUE_STATUS" && event.payload === "PROCESSING" && state.ownership !== "LOCKED") {
    violations.push({
      type: "INVARIANT_VIOLATION",
      invariantId: "INV-001",
      technicalReason: `Attempted to process queue without LOCKED ownership (current: ${state.ownership}).`,
      operatorReason: "O sistema tentou sincronizar dados em background sem autorização ativa.",
      severity: "FATAL"
    });
  }

  // Invariant 2: No hydration before AUTH_RESOLVED
  if (event.type === "HYDRATION_COMPLETED" && state.auth !== "READY") {
    violations.push({
      type: "INVARIANT_VIOLATION",
      invariantId: "INV-002",
      technicalReason: `Hydration completed while auth state is ${state.auth}.`,
      operatorReason: "Os dados foram carregados para a memória antes da verificação de identidade terminar.",
      severity: "FATAL"
    });
  }

  // Invariant 3: No runtime transitions during TEARING_DOWN
  if (state.mode === "RESTRICTED" || state.mode === "SAFE_MODE_LOCKED") {
    if (event.type !== "MANUAL_RECOVERY_TRIGGERED") {
       violations.push({
         type: "INVARIANT_VIOLATION",
         invariantId: "INV-003",
         technicalReason: `Dispatched event ${event.type} during terminal mode ${state.mode}.`,
         operatorReason: "O sistema bloqueado tentou executar uma operação inválida.",
         severity: "FATAL"
       });
    }
  }

  // Invariant 4: No multi-tenant store access across namespaces
  // Checked at the namespaceStorage layer, but we can catch related semantic events here
  if (event.type === "FAILURE_DETECTED" && event.failure === "OWNERSHIP_CONFLICT") {
     // This is an explicit failure passed to us, so we formalize it.
     // Doesn't strictly generate a new violation, but confirms invariant rules.
  }

  return violations;
}

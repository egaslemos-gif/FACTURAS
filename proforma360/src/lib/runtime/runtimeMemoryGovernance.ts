import { useRuntimeStateMachine } from "./runtimeStateMachine";

const WARNING_MEMORY_MB = 32;
const CRITICAL_MEMORY_MB = 48;

export interface MemoryHeuristics {
  ledgerCount: number;
  queueSize: number;
  observabilityEvents: number;
  snapshotCount: number;
}

/**
 * Heuristic-based Memory Governance.
 * Avoids performance.memory due to cross-browser inaccuracies.
 * Calculates approximate JSON serialization weight of runtime buffers.
 */
class RuntimeMemoryGovernance {
  private warningDispatched = false;

  public evaluateRuntimeMemoryPressure(metrics: MemoryHeuristics) {
    const estimatedMB = this.calculateEstimatedMemory(metrics);

    if (estimatedMB >= CRITICAL_MEMORY_MB) {
      this.dispatchCritical(estimatedMB);
    } else if (estimatedMB >= WARNING_MEMORY_MB && !this.warningDispatched) {
      this.dispatchWarning(estimatedMB);
      this.warningDispatched = true;
    } else if (estimatedMB < WARNING_MEMORY_MB && this.warningDispatched) {
      this.warningDispatched = false;
      this.dispatchRecovery(estimatedMB);
    }

    return estimatedMB;
  }

  private calculateEstimatedMemory(metrics: MemoryHeuristics): number {
    // Estimations based on average string/object sizes in JS engines + serialization overhead
    // These are heuristic baselines to prevent silent OOM on weak Android browsers.
    const ledgerWeight = metrics.ledgerCount * 0.05; // 50KB per heavy event
    const queueWeight = metrics.queueSize * 0.1; // 100KB per payload
    const observabilityWeight = metrics.observabilityEvents * 0.02; // 20KB per event
    const snapshotWeight = metrics.snapshotCount * 5.0; // 5MB per uncompressed DB snapshot

    // Base overhead of the React App + Zustand + Runtime Kernel = ~10MB
    const baseOverhead = 10.0;

    return baseOverhead + ledgerWeight + queueWeight + observabilityWeight + snapshotWeight;
  }

  private dispatchWarning(mb: number) {
    console.warn(`[MemoryGovernance] WARNING: Estimated memory reached ${mb.toFixed(1)}MB.`);
    useRuntimeStateMachine.getState().dispatch({
      type: "FAILURE_DETECTED",
      failure: "CORRUPTED", // Reusing generic failure since we don't have a specific memory one yet
      technicalReason: `Memory pressure warning: ${mb.toFixed(1)}MB`,
      operatorReason: "O dispositivo está a atingir o limite de memória. O sistema poderá libertar recursos antigos."
    });
  }

  private dispatchCritical(mb: number) {
    console.error(`[MemoryGovernance] CRITICAL: Estimated memory reached ${mb.toFixed(1)}MB!`);
    useRuntimeStateMachine.getState().dispatch({
      type: "FAILURE_DETECTED",
      failure: "CORRUPTED",
      technicalReason: `Memory exhaustion critical: ${mb.toFixed(1)}MB. Forcing safe mode / teardown.`,
      operatorReason: "Memória esgotada. O sistema entrou em modo de segurança para prevenir corrupção."
    });
  }

  private dispatchRecovery(mb: number) {
    console.log(`[MemoryGovernance] Memory recovered: ${mb.toFixed(1)}MB`);
  }
}

export const runtimeMemoryGovernance = new RuntimeMemoryGovernance();

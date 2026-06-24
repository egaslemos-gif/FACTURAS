import { useRuntimeStateMachine } from "./runtimeStateMachine";

const FREEZE_THRESHOLD_MS = 3000; // 3 seconds of missed ticks means the runtime was suspended
const TICK_INTERVAL_MS = 1000;

export class RuntimeFreezeDetector {
  private lastTick: number = Date.now();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTick = Date.now();
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  private tick() {
    const now = Date.now();
    const delta = now - this.lastTick;

    // Temporal Discontinuity detected
    if (delta > FREEZE_THRESHOLD_MS) {
      console.warn(`[RuntimeFreezeDetector] Discontinuity detected! Missed ${delta}ms. Likely resumed from suspension.`);
      
      // Dispatch to state machine. We map this to an operational network/sync flap
      useRuntimeStateMachine.getState().dispatch({
        type: "FAILURE_DETECTED",
        failure: "NETWORK_UNSTABLE", // Represents the suspension implicitly
        technicalReason: `Temporal discontinuity: Process suspended for ${delta}ms.`,
        operatorReason: "A aplicação foi reativada após estar suspensa em segundo plano."
      });
    }

    this.lastTick = now;
  }
}

export const runtimeFreezeDetector = new RuntimeFreezeDetector();

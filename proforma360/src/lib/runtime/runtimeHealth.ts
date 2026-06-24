import { useRuntimeCapability } from "./runtimeCapability";
import { useRuntimeStateMachine } from "./runtimeStateMachine";

/**
 * Runtime Health Metrics
 * Monitors adaptive behavior and forces capability degradation
 * if operational integrity drops below safe thresholds.
 * Uses Confidence Windows and Multi-Signal Confirmation to avoid autonomous degradation loops.
 */
class RuntimeHealthMonitor {
  private failedSyncCount = 0;
  private totalSyncAttempts = 0;
  private pingLatencies: number[] = [];

  // Confidence Window State
  private degradationSignals = 0;
  private lastSignalTime = 0;
  private readonly CONFIDENCE_THRESHOLD = 3; // Requires 3 consecutive spikes
  private readonly SIGNAL_WINDOW_MS = 60 * 1000; // within 1 minute

  // Adaptive Damping (Elastic Recovery)
  private isDegraded = false;
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly RECOVERY_DELAY_MS = 5 * 60 * 1000; // 5 minutes penalty before re-evaluating

  public recordSyncAttempt(success: boolean) {
    this.totalSyncAttempts++;
    if (!success) {
      this.failedSyncCount++;
    }

    this.evaluateHealth();
  }

  public recordPingLatency(ms: number) {
    this.pingLatencies.push(ms);
    if (this.pingLatencies.length > 10) {
      this.pingLatencies.shift();
    }
    this.evaluateHealth();
  }

  private evaluateHealth() {
    if (this.isDegraded) return; // Wait for recovery timer

    // 1. Calculate Failed Sync Ratio
    const failureRatio = this.totalSyncAttempts === 0 ? 0 : this.failedSyncCount / this.totalSyncAttempts;

    // 2. Average Latency
    const avgLatency =
      this.pingLatencies.length === 0
        ? 0
        : this.pingLatencies.reduce((a, b) => a + b, 0) / this.pingLatencies.length;

    // 3. Multi-Signal Check
    const isCurrentlySpiking = failureRatio > 0.5 || avgLatency > 5000;

    if (isCurrentlySpiking) {
      const now = Date.now();
      
      // Reset confidence if signals are too far apart
      if (now - this.lastSignalTime > this.SIGNAL_WINDOW_MS) {
        this.degradationSignals = 1;
      } else {
        this.degradationSignals++;
      }
      this.lastSignalTime = now;

      // 4. Confirm Degradation via Confidence Threshold
      if (this.degradationSignals >= this.CONFIDENCE_THRESHOLD) {
        this.degradeCapabilities(failureRatio, avgLatency);
      }
    }
  }

  private degradeCapabilities(failureRatio: number, avgLatency: number) {
    this.isDegraded = true;
    
    // Instead of acting autonomously, we emit a pure observation to the State Machine
    useRuntimeStateMachine.getState().dispatch({
      type: "FAILURE_DETECTED",
      failure: "QUEUE_DEGRADED", // Categorize this specific signal as Operational
      technicalReason: `Health Degradation: Ratio=${failureRatio.toFixed(2)}, Latency=${avgLatency.toFixed(0)}ms.`,
      operatorReason: "A conexão parece estar com instabilidades temporárias."
    });

    console.warn(`[RuntimeHealth] Detected critical degradation. Emitted QUEUE_DEGRADED signal.`);

    // Adaptive Damping: Schedule elastic recovery
    if (this.recoveryTimer) clearTimeout(this.recoveryTimer);
    this.recoveryTimer = setTimeout(() => {
      this.attemptElasticRecovery();
    }, this.RECOVERY_DELAY_MS);
  }

  private attemptElasticRecovery() {
    console.log("[RuntimeHealth] Attempting elastic recovery. Emitting MANUAL_RECOVERY_TRIGGERED to State Machine...");
    this.isDegraded = false;
    this.degradationSignals = 0;
    this.failedSyncCount = 0;
    this.totalSyncAttempts = 0;
    this.pingLatencies = [];
    
    // Defer the decision to unfreeze/recover to the State Machine
    useRuntimeStateMachine.getState().dispatch({
      type: "MANUAL_RECOVERY_TRIGGERED",
      action: "HEALTH_RECOVERY_ELASTIC_TIMEOUT"
    });
  }
}

export const runtimeHealth = new RuntimeHealthMonitor();

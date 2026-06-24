export interface ComplexityMetrics {
  observerCount: number;
  activeSubscriptions: number;
  queueAmplificationFactor: number;
  replayDensity: number;
  dependencyGraphExpansion: number;
  hydrationDepth: number;
  runtimeCoordinationPressure: number;
  runtimeFanoutScore: number;
  runtimeEventAmplification: number;
  runtimeSynchronizationDepth: number;
}

export class RuntimeComplexityTelemetry {
  private static metrics: ComplexityMetrics = {
    observerCount: 0,
    activeSubscriptions: 0,
    queueAmplificationFactor: 1.0,
    replayDensity: 0,
    dependencyGraphExpansion: 0,
    hydrationDepth: 0,
    runtimeCoordinationPressure: 0,
    runtimeFanoutScore: 0,
    runtimeEventAmplification: 1.0,
    runtimeSynchronizationDepth: 0
  };

  /**
   * Updates real-time telemetry representing the architectural weight 
   * of the current session. High complexity implies high risk of 
   * silent performance degradation.
   */
  public static updateMetrics(partialMetrics: Partial<ComplexityMetrics>): void {
    this.metrics = { ...this.metrics, ...partialMetrics };
  }

  public static getMetrics(): ComplexityMetrics {
    return { ...this.metrics };
  }

  /**
   * Evaluates if the current complexity poses an imminent threat to the runtime.
   */
  public static evaluateRisk(): "LOW" | "MODERATE" | "HIGH" | "CRITICAL" {
    let riskPoints = 0;

    if (this.metrics.observerCount > 200) riskPoints += 2;
    if (this.metrics.activeSubscriptions > 50) riskPoints += 1;
    if (this.metrics.queueAmplificationFactor > 5.0) riskPoints += 3;
    if (this.metrics.replayDensity > 20) riskPoints += 2;
    if (this.metrics.dependencyGraphExpansion > 15) riskPoints += 3;
    if (this.metrics.hydrationDepth > 4) riskPoints += 2;

    // Coordination Pressure Metrics
    if (this.metrics.runtimeCoordinationPressure > 10) riskPoints += 3;
    if (this.metrics.runtimeFanoutScore > 20) riskPoints += 2;
    if (this.metrics.runtimeEventAmplification > 3.0) riskPoints += 4; // High risk of queue explosions
    if (this.metrics.runtimeSynchronizationDepth > 3) riskPoints += 5; // observer -> queue -> hydration -> replay -> observer (very dangerous)

    if (riskPoints >= 8) return "CRITICAL";
    if (riskPoints >= 5) return "HIGH";
    if (riskPoints >= 3) return "MODERATE";
    return "LOW";
  }
}

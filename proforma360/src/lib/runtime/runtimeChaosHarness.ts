/**
 * Runtime Chaos Harness
 * 
 * Simulates extreme adversarial conditions at the proxy/adapter boundary.
 * These faults are strictly ephemeral and must NEVER be persisted to OPFS, 
 * receipts, or journals.
 */
export class RuntimeChaosHarness {
  private static chaosEnabled = false;
  private static dropRate = 0.0;
  private static latencyMaxMs = 0;

  /**
   * Enables the chaos harness for local testing.
   */
  public static enableChaos(dropRate: number = 0.2, latencyMaxMs: number = 2000): void {
    if (process.env.NODE_ENV === "production") {
      console.error("FATAL: Cannot enable chaos harness in production.");
      return;
    }
    this.chaosEnabled = true;
    this.dropRate = dropRate;
    this.latencyMaxMs = latencyMaxMs;
    console.warn(`[ChaosHarness] Activated. Drop Rate: ${dropRate}, Max Latency: ${latencyMaxMs}ms`);
  }

  public static disableChaos(): void {
    this.chaosEnabled = false;
    console.log("[ChaosHarness] Deactivated.");
  }

  /**
   * Simulates network layer instability.
   */
  public static async interceptNetworkRequest(): Promise<void> {
    if (!this.chaosEnabled) return;

    const delay = Math.random() * this.latencyMaxMs;
    await new Promise(resolve => setTimeout(resolve, delay));

    if (Math.random() < this.dropRate) {
      throw new Error("ChaosHarness: Simulated Network Disconnect (Reconnect Storm injection)");
    }
  }

  /**
   * Simulates OPFS degradation (e.g. Safari suspending execution).
   */
  public static async interceptStorageWrite(): Promise<void> {
    if (!this.chaosEnabled) return;

    if (Math.random() < (this.dropRate / 2)) {
      throw new Error("ChaosHarness: Simulated OPFS Timeout (DEGRADED injection)");
    }
  }
}

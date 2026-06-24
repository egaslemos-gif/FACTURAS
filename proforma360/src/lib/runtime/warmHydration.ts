/**
 * Staged Warm Hydration Scheduler.
 * Sequentially loads data blocks to prevent CPU locking on low-end devices during offline boot.
 */
export class WarmHydration {
  private static registeredTasks: Record<string, () => Promise<any>> = {};
  private static completedTasks: Set<string> = new Set();

  /**
   * Register a hydration task for a specific system phase
   */
  static register(phase: "critical" | "shell" | "pipeline" | "telemetry" | "analytics", task: () => Promise<any>): void {
    this.registeredTasks[phase] = task;
  }

  /**
   * Triggers sequential loading of data blocks with micro-delays
   */
  static async runHydration(): Promise<void> {
    const phases: ("critical" | "shell" | "pipeline" | "telemetry" | "analytics")[] = [
      "critical",
      "shell",
      "pipeline",
      "telemetry",
      "analytics"
    ];

    for (const phase of phases) {
      const task = this.registeredTasks[phase];
      if (task && !this.completedTasks.has(phase)) {
        try {
          console.log(`[Warm Hydration] Running phase: ${phase}`);
          await task();
          this.completedTasks.add(phase);
        } catch (err) {
          console.error(`[Warm Hydration] Error in phase ${phase}:`, err);
        }
        // Micro-yield to UI thread (15ms delay allows browser to paint intermediate states)
        await new Promise(resolve => setTimeout(resolve, 15));
      }
    }
  }

  /**
   * Reset hydration state for fresh rehydration
   */
  static reset(): void {
    this.completedTasks.clear();
  }
}

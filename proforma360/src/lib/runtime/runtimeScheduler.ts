/**
 * Runtime Priority Scheduler
 * Prevents resource starvation by prioritizing tasks across different queues.
 * Highly critical for low-end mobile devices and background tabs.
 */

export enum RuntimeTaskPriority {
  CRITICAL = 0, // State transitions, Ownership assertions, Web Locks
  HIGH = 1,     // UI Re-renders, Immediate user interactions
  MEDIUM = 2,   // Sync Queue processing, DB writes
  LOW = 3,      // Telemetry, Background pre-fetching, Cache maintenance
}

type ScheduledTask = {
  id: string;
  priority: RuntimeTaskPriority;
  execute: () => Promise<void> | void;
  queuedAt: number;
};

class RuntimeScheduler {
  private queues: Map<RuntimeTaskPriority, ScheduledTask[]> = new Map();
  private isProcessing = false;

  constructor() {
    this.queues.set(RuntimeTaskPriority.CRITICAL, []);
    this.queues.set(RuntimeTaskPriority.HIGH, []);
    this.queues.set(RuntimeTaskPriority.MEDIUM, []);
    this.queues.set(RuntimeTaskPriority.LOW, []);
  }

  /**
   * Enqueues a task with a specific priority.
   */
  public schedule(id: string, priority: RuntimeTaskPriority, execute: () => Promise<void> | void) {
    const queue = this.queues.get(priority);
    if (queue) {
      queue.push({ id, priority, execute, queuedAt: Date.now() });
      this.triggerProcessing();
    }
  }

  private async triggerProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.hasPendingTasks()) {
        const task = this.popHighestPriorityTask();
        if (task) {
          try {
            await task.execute();
          } catch (e) {
            console.error(`[RuntimeScheduler] Task ${task.id} failed:`, e);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private hasPendingTasks(): boolean {
    for (const [_, queue] of this.queues.entries()) {
      if (queue.length > 0) return true;
    }
    return false;
  }

  private popHighestPriorityTask(): ScheduledTask | undefined {
    // Check queues in order of priority (CRITICAL -> LOW)
    const priorities = [
      RuntimeTaskPriority.CRITICAL,
      RuntimeTaskPriority.HIGH,
      RuntimeTaskPriority.MEDIUM,
      RuntimeTaskPriority.LOW,
    ];

    for (const p of priorities) {
      const queue = this.queues.get(p);
      if (queue && queue.length > 0) {
        // Starvation Prevention: If a LOW priority task has been waiting > 5 seconds,
        // force it to execute to prevent infinite starvation by CRITICAL/HIGH tasks.
        const lowQueue = this.queues.get(RuntimeTaskPriority.LOW);
        if (p !== RuntimeTaskPriority.LOW && lowQueue && lowQueue.length > 0) {
          const oldestLow = lowQueue[0];
          if (Date.now() - oldestLow.queuedAt > 5000) {
            return lowQueue.shift();
          }
        }
        
        return queue.shift();
      }
    }
    return undefined;
  }
}

export const runtimeScheduler = new RuntimeScheduler();

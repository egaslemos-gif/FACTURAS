export type DegradationEventType = 
  | "RECONNECT_STORM"
  | "QUEUE_RETRY"
  | "STALE_OBSERVER"
  | "SNAPSHOT_WARNING"
  | "HYDRATION_DELAY"
  | "OPFS_TIMEOUT"
  | "MEMORY_PRESSURE";

export type DegradationClass = "TRANSIENT" | "STRUCTURAL" | "CRITICAL";

export interface EventDecayProfile {
  degradationClass: DegradationClass;
  halfLifeMs: number;
}

export const DECAY_PROFILES: Record<DegradationEventType, EventDecayProfile> = {
  RECONNECT_STORM: { degradationClass: "TRANSIENT", halfLifeMs: 1 * 60 * 60 * 1000 },
  QUEUE_RETRY: { degradationClass: "TRANSIENT", halfLifeMs: 1 * 60 * 60 * 1000 },
  HYDRATION_DELAY: { degradationClass: "TRANSIENT", halfLifeMs: 1 * 60 * 60 * 1000 },
  
  STALE_OBSERVER: { degradationClass: "STRUCTURAL", halfLifeMs: 24 * 60 * 60 * 1000 },
  SNAPSHOT_WARNING: { degradationClass: "STRUCTURAL", halfLifeMs: 24 * 60 * 60 * 1000 },
  MEMORY_PRESSURE: { degradationClass: "STRUCTURAL", halfLifeMs: 24 * 60 * 60 * 1000 },
  
  OPFS_TIMEOUT: { degradationClass: "CRITICAL", halfLifeMs: 48 * 60 * 60 * 1000 }
};

export interface DegradationEvent {
  type: DegradationEventType;
  timestamp: number;
  weight: number;
}

export class WeightedDecayRuntimeHealthScore {
  private static events: DegradationEvent[] = [];
  private static structuralScarPenalty = 0; // Permanent penalty for structural damage
  
  // Maximum theoretical score (100 = perfectly healthy)
  private static readonly MAX_SCORE = 100;

  /**
   * Records a degradation event with an initial weight.
   */
  public static recordEvent(type: DegradationEventType, initialWeight: number = 10): void {
    const profile = DECAY_PROFILES[type];

    if (profile.degradationClass === "STRUCTURAL" || profile.degradationClass === "CRITICAL") {
      // Leave a permanent scar (e.g., 20% of the initial weight never decays)
      this.structuralScarPenalty += (initialWeight * 0.2);
    }

    this.events.push({
      type,
      timestamp: Date.now(),
      weight: initialWeight
    });

    // Cleanup very old events (older than 48 hours) to prevent memory leak
    const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
    this.events = this.events.filter(e => e.timestamp > twoDaysAgo);
  }

  /**
   * Calculates the current runtime health score considering the decay of past events.
   * A score of 100 is perfectly healthy. A score below 50 indicates an impending collapse.
   */
  public static calculateScore(): number {
    const now = Date.now();
    let totalPenalty = this.structuralScarPenalty;

    for (const event of this.events) {
      const profile = DECAY_PROFILES[event.type];
      const ageMs = now - event.timestamp;
      
      // Calculate exponential decay
      // N(t) = N0 * (1/2)^(t / T_half)
      let currentWeight = event.weight * Math.pow(0.5, ageMs / profile.halfLifeMs);
      
      // Subtract the scar portion already accounted for
      if (profile.degradationClass === "STRUCTURAL" || profile.degradationClass === "CRITICAL") {
        const scarPortion = event.weight * 0.2;
        currentWeight = Math.max(0, currentWeight - scarPortion);
      }

      totalPenalty += currentWeight;
    }

    const score = Math.max(0, this.MAX_SCORE - totalPenalty);
    return Math.round(score * 10) / 10; // Round to 1 decimal
  }

  /**
   * Analyzes if the runtime is approaching collapse based on recent entropy metrics.
   */
  public static checkStabilityWindow(): "STABLE" | "DEGRADED" | "CRITICAL" {
    const score = this.calculateScore();
    if (score >= 80) return "STABLE";
    if (score >= 40) return "DEGRADED";
    return "CRITICAL";
  }
}

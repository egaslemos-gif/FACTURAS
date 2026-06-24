import { useRuntimeStateMachine } from "../runtimeStateMachine";
import { resolveRuntimeNamespace } from "../runtimeNamespace";

export type ChaosSeverity = "SAFE" | "LOW" | "MEDIUM" | "EXTREME" | "DESTRUCTIVE";

interface ChaosConfig {
  enabled: boolean;
  severity: ChaosSeverity;
  chaosSeed: string; // Deterministic Replay Seed
  debugRuntimeToken?: string;
}

function canUseChaosHarness(token?: string): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  // In production, Chaos is STRICTLY gated
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== "SUPER_ADMIN" || payload.exp < Date.now()) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export class ChaosRuntimeHarness {
  private config: ChaosConfig = {
    enabled: false,
    severity: "SAFE",
    chaosSeed: "default-seed"
  };

  private prngState = 1;

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public initialize(options: Partial<ChaosConfig>) {
    const isAllowed = canUseChaosHarness(options.debugRuntimeToken);

    if (!isAllowed) {
      console.error("[ChaosHarness] ACTIVATION REJECTED. Strict isolation boundary enforced.");
      this.config.enabled = false;
      this.config.severity = "SAFE";
      return;
    }

    if (process.env.NODE_ENV === "production" && options.severity === "DESTRUCTIVE") {
      console.error("[ChaosHarness] DESTRUCTIVE mode is strictly prohibited in production.");
      options.severity = "SAFE";
    }

    this.config = { ...this.config, ...options };
    this.seedPrng(this.config.chaosSeed);

    if (this.config.enabled) {
      console.warn(`[ChaosHarness] ACTIVATED. Severity: ${this.config.severity}. Seed: ${this.config.chaosSeed}`);
      this.attachChaosHooks();
    }
  }

  // Simple Seeded PRNG for Deterministic Chaos (Mulberry32)
  private seedPrng(seedString: string) {
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) hash = Math.imul(31, hash) + seedString.charCodeAt(i) | 0;
    this.prngState = hash;
  }

  private random(): number {
    let t = this.prngState += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  private attachChaosHooks() {
    if (this.config.severity === "DESTRUCTIVE") {
      this.scheduleLeaderAssassination();
    }
  }

  /**
   * Called by ChaosAwareDbAdapter to stall reads/writes randomly.
   */
  public async throttleIndexedDB(): Promise<void> {
    if (!this.config.enabled || this.config.severity === "SAFE") return;
    
    // Simulate latency (1s to 5s)
    const baseLatency = this.config.severity === "LOW" ? 500 : this.config.severity === "MEDIUM" ? 2000 : 5000;
    const jitter = this.random() * baseLatency;
    const actualDelay = baseLatency + jitter;

    console.warn(`[ChaosHarness] Throttling DB request by ${actualDelay.toFixed(0)}ms`);
    return new Promise(resolve => setTimeout(resolve, actualDelay));
  }

  /**
   * Simulates the semantic CONSEQUENCES of a browser freezing
   * e.g. injecting stale epoch, delayed heartbeat.
   */
  public simulateBrowserSleep() {
    if (!this.config.enabled) return;
    
    console.warn("[ChaosHarness] INJECTING BROWSER SLEEP CONSEQUENCES...");
    
    // 1. Simulate clock skew (heartbeat is now outdated)
    localStorage.setItem('runtime_owner_last_seen', (Date.now() - 10 * 60 * 1000).toString()); // 10 mins ago
    
    // 2. Corrupt active epoch token
    localStorage.setItem('runtime_active_epoch', 'stale_epoch_' + this.random());
    
    // 3. Immediately trigger a fake 'resume' event to force Lifecycle to evaluate the skew
    window.dispatchEvent(new Event("resume"));
  }

  /**
   * Injects an adaptive number of synthetic queue jobs based on severity.
   */
  public queueCongestion() {
     if (!this.config.enabled) return;
     
     let count = 0;
     switch (this.config.severity) {
       case "LOW": count = 50; break;
       case "MEDIUM": count = 250; break;
       case "EXTREME": 
       case "DESTRUCTIVE": count = 1000; break;
       default: return;
     }
     
     console.warn(`[ChaosHarness] Ingesting ${count} synthetic queue jobs for CONGESTION...`);
     
     // Dynamically import actionQueue to enqueue without circular deps
     import('@/lib/sync/actionQueue').then(({ actionQueue }) => {
        for(let i=0; i<count; i++) {
           actionQueue.enqueue('SYNC_MUTATION', {
              operation_id: `chaos_${i}_${Date.now()}`,
              payload: 'synthetic_chaos_garbage_payload_string',
              priority: 'LOW'
           });
        }
     });
  }

  /**
   * Rapidly switches Ownership to provoke hydration storms and test reload loops.
   */
  public hydrationStorm() {
     if (!this.config.enabled) return;
     console.warn("[ChaosHarness] Triggering Hydration Storm!");
     
     let stormCount = 0;
     const interval = setInterval(() => {
        if (stormCount > 5) {
           clearInterval(interval);
           return;
        }
        // Force cross-tab ownership change to a garbage hash
        localStorage.setItem('runtime_owner_hash', 'storm_hash_' + this.random());
        window.dispatchEvent(new StorageEvent('storage', { key: 'runtime_owner_last_seen' }));
        stormCount++;
     }, 300); // Trigger every 300ms
  }

  private scheduleLeaderAssassination() {
    const timeToLive = 5000 + (this.random() * 20000); 
    
    setTimeout(() => {
      console.error("[ChaosHarness] EXECUTING LEADER ASSASSINATION. Forcing Lock Release.");
      
      const state = useRuntimeStateMachine.getState();
      if (state.ownership === "LOCKED") {
         state.dispatch({
           type: "FAILURE_DETECTED",
           failure: "OWNERSHIP_CONFLICT",
           technicalReason: "Chaos Harness triggered Assassination.",
           operatorReason: "A liderança foi terminada à força pelo sistema de testes."
         });
      }

      this.scheduleLeaderAssassination();
    }, timeToLive);
  }
}

export const chaosHarness = new ChaosRuntimeHarness();

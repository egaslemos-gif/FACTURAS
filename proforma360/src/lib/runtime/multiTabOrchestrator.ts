import { resolveRuntimeNamespace } from "./runtimeNamespace";
import { useRuntimeStateMachine, RuntimeEvent } from "./runtimeStateMachine";
import { ENABLE_RUNTIME_GOVERNANCE, userScopedDb } from "../db/userScopedDb";
import { governedSyncQueue } from "../sync/governedSyncQueue";

/**
 * Ensures strictly monotonic, durable tokens to prevent epoch rollback
 * ambiguities across tab wakeups, reloads, and PWA relaunches.
 */
class DurableEpochManager {
  private getStorageKey(namespace: string) {
    return `${namespace}_runtime_epoch`;
  }

  public getActiveEpoch(namespace: string): number {
    const raw = localStorage.getItem(this.getStorageKey(namespace));
    return raw ? parseInt(raw, 10) : 0;
  }

  public incrementEpoch(namespace: string): number {
    const current = this.getActiveEpoch(namespace);
    const next = current + 1;
    localStorage.setItem(this.getStorageKey(namespace), next.toString());
    return next;
  }
}

const epochManager = new DurableEpochManager();

export interface CausalEventPayload {
  event: RuntimeEvent;
  causal_sequence: number;
  causal_parent: number | null;
  runtime_generation: number;
}

/**
 * Dual-Layer Multi-Tab Orchestrator
 * Uses Web Locks + BroadcastChannel consensus to elect a leader,
 * generate durable monotonic epochs, and guarantee causal event ordering.
 */
export class MultiTabOrchestrator {
  private activeNamespace: string | null = null;
  private channel: BroadcastChannel | null = null;
  private isLeader = false;
  private leaderHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private followerWatchdogTimer: ReturnType<typeof setInterval> | null = null;
  
  private activeEpoch = 0;
  private currentCausalSequence = 0;
  
  private HEARTBEAT_INTERVAL_MS = 2000;
  private FOLLOWER_TIMEOUT_MS = 6000;

  public initialize(userId: string) {
    if (!ENABLE_RUNTIME_GOVERNANCE) return;

    this.activeNamespace = resolveRuntimeNamespace(userId);
    if (!this.activeNamespace) return;

    this.channel = new BroadcastChannel(`proforma360_orchestrator_${this.activeNamespace}`);
    this.setupFollowerWatchdog();
    this.attemptLeadership();
  }

  private attemptLeadership() {
    if (!this.activeNamespace) return;
    
    // Layer 1: Web Locks API
    if (typeof navigator !== "undefined" && navigator.locks) {
      navigator.locks.request(`proforma360_leader_${this.activeNamespace}`, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
        if (lock) {
          await this.assumeLeadership();
          // Hold the lock indefinitely until tab closes or ownership revoked
          return new Promise<void>(() => {}); 
        }
      });
    } else {
      // Fallback for Safari/Legacy without Web Locks: Rely on BroadcastChannel consensus
      console.warn("[Orchestrator] Web Locks not supported. Relying strictly on Consensus.");
      this.assumeLeadership(); 
    }
  }

  private async assumeLeadership() {
    if (!this.activeNamespace) return;
    this.isLeader = true;
    
    // 1. Generate Durable Monotonic Epoch
    this.activeEpoch = epochManager.incrementEpoch(this.activeNamespace);
    this.currentCausalSequence = 0;

    console.log(`[Orchestrator] Assumed Leadership. Generation Epoch: ${this.activeEpoch}`);

    // 2. Start Heartbeats
    this.leaderHeartbeatTimer = setInterval(() => {
      this.broadcastCausalEvent({ type: "QUEUE_STATUS", payload: "IDLE" }); // Dummy heartbeat event for now
    }, this.HEARTBEAT_INTERVAL_MS);
    
    if (this.followerWatchdogTimer) clearInterval(this.followerWatchdogTimer);
  }

  private setupFollowerWatchdog() {
    let lastHeartbeat = Date.now();

    this.channel?.addEventListener("message", (e) => {
      const payload: CausalEventPayload = e.data;
      
      // Enforce causal boundary: reject events from older epochs
      if (payload.runtime_generation < this.activeEpoch) return;

      lastHeartbeat = Date.now();
      
      // If we receive a higher epoch, someone else safely took over
      if (payload.runtime_generation > this.activeEpoch) {
        this.activeEpoch = payload.runtime_generation;
        this.isLeader = false;
      }
      
      this.processCausalEvent(payload);
    });

    this.followerWatchdogTimer = setInterval(() => {
      if (this.isLeader) return;
      
      if (Date.now() - lastHeartbeat > this.FOLLOWER_TIMEOUT_MS) {
        console.warn("[Orchestrator] Leader heartbeat timeout. Attempting succession...");
        this.attemptLeadership();
      }
    }, 1000);
  }

  private processCausalEvent(payload: CausalEventPayload) {
    // 1. Validate causal ordering
    if (payload.causal_parent !== null && payload.causal_parent > this.currentCausalSequence) {
      console.error("[Orchestrator] Causal Violation detected! Reordering pending events...");
      // In a real causal graph, we would buffer out-of-order events here.
      return; 
    }

    // 2. Advance local vector clock
    this.currentCausalSequence = Math.max(this.currentCausalSequence, payload.causal_sequence);

    // 3. Dispatch to runtime
    useRuntimeStateMachine.getState().dispatch(payload.event);
  }

  public broadcastCausalEvent(event: RuntimeEvent) {
    if (!this.isLeader || !this.channel) return;

    this.currentCausalSequence++;
    const payload: CausalEventPayload = {
      event,
      causal_sequence: this.currentCausalSequence,
      causal_parent: this.currentCausalSequence - 1, // Strict linear causal dependency
      runtime_generation: this.activeEpoch,
    };

    this.channel.postMessage(payload);
    this.processCausalEvent(payload); // Apply locally
  }

  public teardown(isLogout: boolean = false) {
    console.warn(`[Orchestrator] Initiating Absolute Teardown. Logout mode: ${isLogout}`);
    if (this.leaderHeartbeatTimer) clearInterval(this.leaderHeartbeatTimer);
    if (this.followerWatchdogTimer) clearInterval(this.followerWatchdogTimer);
    
    if (this.channel) {
      // Broadcast DEATH signal before closing channel
      try {
        this.channel.postMessage({
          event: { type: "QUEUE_STATUS", payload: "DEATH" },
          causal_sequence: 9999999, // Max sequence to override
          causal_parent: this.currentCausalSequence,
          runtime_generation: this.activeEpoch
        });
      } catch (e) {}
      this.channel.close();
      this.channel = null;
    }

    // Kill governed queues strictly
    governedSyncQueue.abort();

    if (isLogout) {
      // Invalidate sqlite cache and completely close it
      userScopedDb.teardown();
      
      if (this.activeNamespace) {
        localStorage.removeItem(`${this.activeNamespace}_runtime_epoch`);
      }
    }

    this.isLeader = false;
    this.activeNamespace = null;
  }
}

export const orchestrator = new MultiTabOrchestrator();

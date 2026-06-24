import { getActiveTenantHash, setActiveTenantHash } from "./runtimeNamespace";

export type RuntimeState = 'AUTH_LOADING' | 'AUTH_RESOLVED' | 'RUNTIME_READY' | 'TEARING_DOWN' | 'DEAD';

class RuntimeOwnershipManager {
  private currentState: RuntimeState = 'AUTH_LOADING';
  private channel: BroadcastChannel | null = null;
  private teardownInProgress = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.channel = new BroadcastChannel('runtime_ownership');
      this.channel.onmessage = (event) => {
        if (event.data.type === 'OWNERSHIP_CHANGED') {
          const newHash = event.data.tenantHash;
          if (newHash !== getActiveTenantHash()) {
            console.warn(`[Runtime] Ownership mismatch detected via Broadcast. Forcing teardown.`);
            this.runtimeTeardown();
          }
        }
      };

      // Heartbeat listener
      window.addEventListener('storage', (e) => {
        if (e.key === 'runtime_owner_last_seen') {
          const storedHash = localStorage.getItem('runtime_owner_hash');
          if (storedHash && storedHash !== getActiveTenantHash()) {
             console.warn(`[Runtime] Ownership mismatch detected via Heartbeat. Forcing teardown.`);
             this.runtimeTeardown();
          }
        }
      });
    }
  }

  public getState(): RuntimeState {
    return this.currentState;
  }

  public setState(state: RuntimeState) {
    this.currentState = state;
  }

  public validateOwnership(expectedHash: string): boolean {
    const active = getActiveTenantHash();
    if (!active) return false;
    return active === expectedHash;
  }

  public emitOwnershipResolved(hash: string) {
    setActiveTenantHash(hash);
    if (typeof window !== 'undefined') {
      localStorage.setItem('runtime_owner_hash', hash);
      localStorage.setItem('runtime_owner_last_seen', Date.now().toString());
      if (this.channel) {
        this.channel.postMessage({ type: 'OWNERSHIP_CHANGED', tenantHash: hash });
      }
    }
  }

  public async runtimeTeardown(preventReload = false) {
    if (this.teardownInProgress) return;
    this.teardownInProgress = true;
    this.setState('TEARING_DOWN');

    console.error("[Runtime] ATOMIC TEARDOWN INITIATED");

    // 0. Immediately clear in-memory tenant hash to prevent any further scoped operations
    setActiveTenantHash(null);

    // Runtime-specific localStorage keys that must be cleaned on teardown.
    // IMPORTANT: We do NOT call localStorage.clear() to preserve the
    // 'legacy_migrated_to' stamp which prevents cross-user DB migration.
    const RUNTIME_KEYS = [
      'runtime_owner_hash',
      'runtime_owner_last_seen',
      'runtime_reload_count',
      'runtime_last_reload',
    ];

    // 1. Abort Reload Loops
    if (typeof window !== 'undefined') {
      const reloadCount = parseInt(localStorage.getItem('runtime_reload_count') || '0', 10);
      const lastReload = parseInt(localStorage.getItem('runtime_last_reload') || '0', 10);
      const now = Date.now();
      
      if (now - lastReload < 5000) { // 5 seconds cooldown
        if (reloadCount > 3) {
          console.error("[Runtime] RELOAD DEATH LOOP PREVENTED. Entering SAFE MODE.");
          this.setState('DEAD');
          // Only clear runtime keys, NOT the entire localStorage
          RUNTIME_KEYS.forEach(k => localStorage.removeItem(k));
          sessionStorage.clear();
          return;
        }
        localStorage.setItem('runtime_reload_count', (reloadCount + 1).toString());
      } else {
        localStorage.setItem('runtime_reload_count', '1');
      }
      localStorage.setItem('runtime_last_reload', now.toString());
    }

    try {
      // 2. Abort Queues
      // (Feito via flag TEARING_DOWN que as queues lêem)

      // 3. Clear transient storages (session) and runtime keys
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        RUNTIME_KEYS.forEach(k => localStorage.removeItem(k));
      }

      // 4. Force hard reload to kill closures, React and memory
      this.setState('DEAD');
      if (!preventReload && typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (e) {
      console.error("[Runtime] Teardown failed, forcing reload anyway", e);
      if (!preventReload && typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }
}

export const runtimeOwnership = new RuntimeOwnershipManager();

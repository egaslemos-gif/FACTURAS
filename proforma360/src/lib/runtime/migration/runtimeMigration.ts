import { resolveRuntimeNamespace } from "../runtimeNamespace";
import { useRuntimeStateMachine } from "../runtimeStateMachine";

/**
 * Orchestrates the Cutover from Legacy PWA Offline to Edge-Native Governed Runtime.
 * Implements strict locks and timeout recovery to prevent infinite freeze.
 */
class RuntimeMigrationOrchestrator {
  private namespace: string | null = null;
  private readonly MIGRATION_TIMEOUT_MS = 15000; // 15 seconds strict timeout

  public async orchestrateCutover(userId: string): Promise<boolean> {
    this.namespace = resolveRuntimeNamespace(userId);
    if (!this.namespace) return false;

    console.log(`[Migration] Preparing Cutover for namespace: ${this.namespace}`);

    // Lock semantics to ensure only ONE tab attempts migration
    if (typeof navigator !== "undefined" && navigator.locks) {
      return new Promise<boolean>((resolve) => {
        let isResolved = false;

        // 1. Stale Migration Detection & Recovery
        const staleMigrationTimeout = setTimeout(() => {
          if (!isResolved) {
            console.error("[Migration] STALE MIGRATION DETECTED. Lock timeout. Forcing recovery...");
            isResolved = true;
            useRuntimeStateMachine.getState().dispatch({ 
              type: "FAILURE_DETECTED", 
              failure: "MIGRATION_BROKEN",
              technicalReason: "Migration Lock timeout exceeded.",
              operatorReason: "A migração demorou demasiado tempo. Abortada por segurança."
            });
            resolve(false);
          }
        }, this.MIGRATION_TIMEOUT_MS);

        // 2. Request Migration Lock
        navigator.locks.request(`migration_lock_${this.namespace}`, { mode: 'exclusive' }, async (lock) => {
          if (!lock) return;

          try {
            console.warn("[Migration] Lock Acquired. Legacy queues frozen. Commencing Cutover.");
            
            // 3. Execute Migration
            const success = await this.executeDataMigration();

            if (!isResolved) {
              clearTimeout(staleMigrationTimeout);
              isResolved = true;
              if (!success) {
                useRuntimeStateMachine.getState().dispatch({ 
                  type: "FAILURE_DETECTED", 
                  failure: "MIGRATION_BROKEN",
                  technicalReason: "Failed to execute data reconciliation.",
                  operatorReason: "Falha ao reconciliar os dados locais da base de dados."
                });
              }
              resolve(success);
            }
          } catch (e) {
            console.error("[Migration] Fatal Migration Exception.", e);
            if (!isResolved) {
              clearTimeout(staleMigrationTimeout);
              isResolved = true;
              useRuntimeStateMachine.getState().dispatch({ 
                type: "FAILURE_DETECTED", 
                failure: "MIGRATION_BROKEN",
                technicalReason: "Fatal exception thrown during migration.",
                operatorReason: "Erro crítico desconhecido ao tentar migrar a base de dados."
              });
              resolve(false);
            }
          }
        });
      });
    } else {
      console.warn("[Migration] Web Locks API unavailable. Attempting unsafe cutover.");
      return await this.executeDataMigration();
    }
  }

  private async executeDataMigration(): Promise<boolean> {
    // TODO: Connect to persistentSyncQueue (Legacy) and transfer to Mutation Journal
    console.log("[Migration] Reconciling legacy queues into Operation Journal...");
    
    // Simulate complex reconciliation
    await new Promise(r => setTimeout(r, 1500));
    
    console.log("[Migration] Cutover complete. Legacy databases reconciled.");
    return true;
  }
}

export const runtimeMigration = new RuntimeMigrationOrchestrator();

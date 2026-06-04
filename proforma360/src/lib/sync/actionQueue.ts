import { openDB, IDBPDatabase } from 'idb';
import { generateId } from '@/lib/utils';
import { useNetworkStore } from '@/stores/useNetworkStore';

const DB_NAME = 'proforma360_db';
const STORE_NAME = 'action_queue';

export type ActionPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ActionItem {
  id: string;
  type: string;
  priority: ActionPriority;
  payload: any;
  status: 'PENDING' | 'FAILED' | 'DEAD_LETTER';
  retryCount: number;
  nextRetryAt: number;
  createdAt: number;
}

const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 2000;

class ActionQueue {
  private idb: IDBPDatabase | null = null;
  private isProcessing = false;

  async init() {
    if (!this.idb) {
      this.idb = await openDB(DB_NAME, 2);
    }
  }

  async enqueue(type: string, payload: any, priority: ActionPriority = 'MEDIUM') {
    await this.init();
    if (!this.idb) return;

    const action: ActionItem = {
      id: generateId(),
      type,
      priority,
      payload,
      status: 'PENDING',
      retryCount: 0,
      nextRetryAt: Date.now(),
      createdAt: Date.now(),
    };

    await this.idb.put(STORE_NAME, action);
    
    // Attempt to process immediately if online
    if (useNetworkStore.getState().isOnline) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing) return;
    
    await this.init();
    if (!this.idb || !useNetworkStore.getState().isOnline) return;

    this.isProcessing = true;

    try {
      const allActions: ActionItem[] = await this.idb.getAll(STORE_NAME);
      
      const now = Date.now();
      const pendingActions = allActions
        .filter(a => a.status === 'PENDING' && a.nextRetryAt <= now)
        .sort((a, b) => {
          // Sort by priority first
          const pWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          if (pWeight[a.priority] !== pWeight[b.priority]) {
            return pWeight[b.priority] - pWeight[a.priority];
          }
          // Then by creation time
          return a.createdAt - b.createdAt;
        });

      for (const action of pendingActions) {
        if (!useNetworkStore.getState().isOnline) break; // Network dropped during processing

        try {
          await this.executeAction(action);
          // Success: Remove from queue
          await this.idb.delete(STORE_NAME, action.id);
        } catch (error) {
          console.error(`Action ${action.type} failed:`, error);
          
          action.retryCount += 1;
          
          if (action.retryCount >= MAX_RETRIES) {
            action.status = 'DEAD_LETTER';
            console.warn(`Action ${action.id} sent to dead-letter queue.`);
          } else {
            // Exponential backoff
            action.nextRetryAt = Date.now() + (BASE_BACKOFF_MS * Math.pow(2, action.retryCount));
          }
          
          await this.idb.put(STORE_NAME, action);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeAction(action: ActionItem): Promise<void> {
    // Dispatch mechanism based on action.type
    switch (action.type) {
      case 'SHARE_WHATSAPP':
        // Future: implement server-side sending logic or local sync API call
        console.log('Executing SHARE_WHATSAPP for', action.payload);
        break;
      case 'SYNC_MUTATION':
        console.log('Executing SYNC_MUTATION for', action.payload);
        break;
      case 'TELEMETRY_LOG':
        console.log('Executing TELEMETRY_LOG for', action.payload);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }
}

export const actionQueue = new ActionQueue();

// Listen to network changes to automatically resume queue
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    actionQueue.processQueue();
  });
}

import { chaosHarness } from "./chaosHarness";

/**
 * Interface that matches DatabaseClient methods we need to proxy
 */
interface IDatabaseClient {
  init(): Promise<void>;
  executeWrite(query: string, params?: any[]): Promise<void>;
  query(query: string, params?: any[]): Promise<any[]>;
  getOne(query: string, params?: any[]): Promise<any>;
  setTenantHash(tenantHash: string): Promise<void>;
  getDatabaseFile(): Promise<Uint8Array | null>;
  restoreDatabaseFile(data: Uint8Array): Promise<void>;
  destroyTenantDatabase(): Promise<void>;
  isNewDatabase: boolean;
}

/**
 * Chaos Aware DB Adapter
 * Proxies the real dbClient and introduces controlled chaos (latency, drops, congestion)
 * based on the active chaosHarness configuration.
 */
export function createChaosAwareDbAdapter(realDbClient: IDatabaseClient): IDatabaseClient {
  return new Proxy(realDbClient, {
    get(target, prop, receiver) {
      const origMethod = target[prop as keyof IDatabaseClient];
      
      if (typeof origMethod === 'function') {
        return async function (...args: any[]) {
          // 1. Throttle IndexedDB if Chaos demands it
          await chaosHarness.throttleIndexedDB();
          
          // Execute original
          // @ts-ignore
          return origMethod.apply(target, args);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value) {
      return Reflect.set(target, prop, value);
    }
  });
}

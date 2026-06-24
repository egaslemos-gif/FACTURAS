import { getActiveTenantHash } from './runtimeNamespace';
import { runtimeOwnership } from './runtimeOwnership';

/**
 * Custom Zustand Storage Middleware.
 * Transparently prefixes keys with the active tenantHash.
 * BLOCKS access if runtime ownership is not yet resolved.
 */
export const namespaceStorage = {
  getItem: (name: string): string | null => {
    if (runtimeOwnership.getState() === 'TEARING_DOWN' || runtimeOwnership.getState() === 'DEAD') {
      return null;
    }
    const tenantHash = getActiveTenantHash();
    if (!tenantHash) {
      console.warn(`[NamespaceStorage] Attempted to read ${name} before AUTH_RESOLVED. Hydration blocked.`);
      return null; // Don't crash, just return null so Zustand starts with initial state
    }
    return localStorage.getItem(`${tenantHash}_${name}`);
  },
  setItem: (name: string, value: string): void => {
    if (runtimeOwnership.getState() === 'TEARING_DOWN' || runtimeOwnership.getState() === 'DEAD') {
      return;
    }
    const tenantHash = getActiveTenantHash();
    if (!tenantHash) {
      console.warn(`[NamespaceStorage] Attempted to write ${name} before AUTH_RESOLVED.`);
      return;
    }
    localStorage.setItem(`${tenantHash}_${name}`, value);
  },
  removeItem: (name: string): void => {
    if (runtimeOwnership.getState() === 'TEARING_DOWN' || runtimeOwnership.getState() === 'DEAD') {
      return;
    }
    const tenantHash = getActiveTenantHash();
    if (!tenantHash) return;
    localStorage.removeItem(`${tenantHash}_${name}`);
  }
};

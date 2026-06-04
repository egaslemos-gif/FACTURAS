import { useNetworkStore } from '@/stores/useNetworkStore';

const PING_URL = '/api/ping';
const PING_INTERVAL = 30000; // 30 seconds
const PING_TIMEOUT = 5000; // 5 seconds

let pingTimer: NodeJS.Timeout | null = null;

/**
 * Executes a real ping to the server to verify actual connectivity.
 */
export const checkRealConnectivity = async (): Promise<boolean> => {
  const store = useNetworkStore.getState();
  
  if (!navigator.onLine) {
    store.setOnline(false);
    return false;
  }

  store.setChecking(true);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);
    
    // Add cache busting to ensure we hit the network, not the service worker cache
    const response = await fetch(`${PING_URL}?t=${Date.now()}`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const isOnline = response.ok;
    store.setOnline(isOnline);
    return isOnline;
  } catch (error) {
    // If it aborts or fails to fetch, we assume offline/degraded network
    store.setOnline(false);
    return false;
  } finally {
    store.setChecking(false);
  }
};

/**
 * Initializes the network awareness system.
 * Should be called once at the app root.
 */
export const initNetworkAwareness = () => {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    // navigator.onLine just says we connected to a router/interface.
    // We must ping to be sure there's actual internet.
    checkRealConnectivity();
  };

  const handleOffline = () => {
    useNetworkStore.getState().setOnline(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Initial check
  checkRealConnectivity();

  // Periodic heartbeat
  if (pingTimer) clearInterval(pingTimer);
  pingTimer = setInterval(checkRealConnectivity, PING_INTERVAL);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (pingTimer) clearInterval(pingTimer);
  };
};

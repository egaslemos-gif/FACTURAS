import { CACHE_VERSION } from '@/config/appVersion';

export const clearOldCaches = async () => {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cacheKeys = await caches.keys();
    const currentPrefix = `proforma360-${CACHE_VERSION}`;

    const cachesToDelete = cacheKeys.filter(key => {
      // Apagar caches que são desta app mas de versão antiga
      if (key.startsWith('proforma360-') && !key.startsWith(currentPrefix)) {
        return true;
      }
      return false;
    });

    await Promise.all(cachesToDelete.map(key => caches.delete(key)));
    if (cachesToDelete.length > 0) {
      console.log(`[CacheManager] Apagadas ${cachesToDelete.length} caches antigas.`);
    }
  } catch (error) {
    console.error('[CacheManager] Erro ao limpar caches antigas', error);
  }
};

import { useUpdateStore } from '@/stores/useUpdateStore';

export const initUpdateManager = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready.then((registration) => {
    // Check if there is an update already waiting when app loads
    if (registration.waiting) {
      useUpdateStore.getState().setUpdateAvailable(true);
    }

    // Listen for new service workers being installed
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        // Se foi instalado e está à espera de ser ativado
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          useUpdateStore.getState().setUpdateAvailable(true);
        }
      });
    });
  });
};

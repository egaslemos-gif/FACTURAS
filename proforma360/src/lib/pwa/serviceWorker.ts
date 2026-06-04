export const triggerServiceWorkerUpdate = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration && registration.waiting) {
    return new Promise<void>((resolve) => {
      // Escutar a mudança de controller (SW ativado)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve();
      }, { once: true });
      
      // Enviar mensagem para forçar skipWaiting
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }
};

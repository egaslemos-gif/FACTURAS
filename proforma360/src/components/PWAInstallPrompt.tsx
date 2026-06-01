"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if the app is already installed or the user dismissed it previously
    if (window.matchMedia('(display-mode: standalone)').matches || localStorage.getItem('pwa-prompt-dismissed')) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install UI
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Hide the prompt UI
    setShowPrompt(false);
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      localStorage.setItem('pwa-prompt-dismissed', 'true');
    }
    
    // We can't use the prompt again
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white border border-[var(--color-primary-fixed-dim)] rounded-[var(--radius-lg)] elevation-3 z-50 p-4 animate-slide-up flex items-start gap-4">
      <div className="w-12 h-12 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-xl flex items-center justify-center shrink-0">
        <Download className="w-6 h-6" />
      </div>
      
      <div className="flex-1">
        <h3 className="text-body-md font-semibold text-[var(--color-on-surface)]">Instalar Proforma360</h3>
        <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 mb-3">
          Instale a nossa aplicação para um acesso mais rápido, funcionamento offline e uma melhor experiência no telemóvel.
        </p>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleInstallClick}
            className="flex-1 bg-[var(--color-primary)] text-white text-sm font-medium py-2 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors"
          >
            Instalar App
          </button>
          <button 
            onClick={handleDismiss}
            className="px-3 py-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

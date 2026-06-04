"use client";

import { useUpdateStore } from '@/stores/useUpdateStore';
import { useDraftProtectionStore } from '@/stores/useDraftProtectionStore';
import { triggerServiceWorkerUpdate } from '@/lib/pwa/serviceWorker';
import { clearOldCaches } from '@/lib/pwa/cacheManager';
import { RefreshCw, AlertTriangle, X } from 'lucide-react';

export const UpdateBanner = () => {
  const { updateAvailable, isUpdating, setIsUpdating, setUpdateAvailable } = useUpdateStore();
  const { hasUnsavedChanges } = useDraftProtectionStore();

  if (!updateAvailable) return null;

  const handleUpdate = async () => {
    if (hasUnsavedChanges) {
      if (!confirm('Existem alterações não guardadas. Tem a certeza que pretende atualizar a aplicação agora e perder essas alterações?')) {
        return;
      }
    }
    
    setIsUpdating(true);
    
    try {
      await clearOldCaches();
      await triggerServiceWorkerUpdate();
      window.location.reload();
    } catch (e) {
      console.error('Falha na atualização:', e);
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:bottom-auto md:top-4 md:left-1/2 md:-translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-top-4">
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 p-4 w-[90vw] max-w-sm flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-sm">Nova versão disponível</h3>
            <p className="text-xs text-slate-300 mt-1">Atualize para obter as últimas funcionalidades e correções.</p>
          </div>
          <button 
            onClick={() => setUpdateAvailable(false)}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {hasUnsavedChanges && (
          <div className="bg-amber-500/20 text-amber-200 p-2 rounded flex items-center gap-2 border border-amber-500/30">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-xs leading-tight">Tem rascunhos não guardados. Guarde antes de atualizar.</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 bg-white text-slate-900 font-medium text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                A atualizar aplicação...
              </>
            ) : (
              'Atualizar Agora'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

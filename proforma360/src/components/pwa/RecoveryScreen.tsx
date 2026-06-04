"use client";

import { AlertTriangle, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import { clearOldCaches } from '@/lib/pwa/cacheManager';

export const RecoveryScreen = ({ status }: { status: 'DOWNGRADE_DETECTED' | 'MIGRATION_FAILED' }) => {
  
  const handleRepair = async () => {
    // Try to unregister service workers and clear caches
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
    await clearOldCaches();
    window.location.reload();
  };

  const handleReset = async () => {
    if (confirm('ATENÇÃO: Isto apagará todos os dados locais. Apenas proceda se já tiver um backup na cloud.\n\nPretende continuar?')) {
      localStorage.clear();
      
      // Attempt to clear all IndexedDB databases
      try {
        const dbs = await window.indexedDB.databases();
        for (const db of dbs) {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      } catch(e) {
        // Fallback for browsers that don't support indexedDB.databases()
        window.indexedDB.deleteDatabase('proforma360-db'); // example fallback
      }
      
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-red-100 overflow-hidden">
        <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Inconsistência Detetada</h1>
          <p className="text-sm text-slate-600">
            {status === 'DOWNGRADE_DETECTED' 
              ? 'A versão da aplicação guardada em cache é mais antiga que a estrutura de dados local.'
              : 'Ocorreu um erro crítico durante a validação da base de dados.'}
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700">Para proteger os seus dados, a inicialização da aplicação foi bloqueada. Por favor, tente reparar a aplicação primeiro.</p>
          
          <button 
            onClick={handleRepair}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-medium py-3 px-4 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Tentar Reparar Aplicação
          </button>
          
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-3 text-center">Último recurso em caso de falha persistente</p>
            <button 
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-700 font-medium py-2.5 px-4 rounded-xl hover:bg-red-100 transition-colors border border-red-200"
            >
              <Trash2 className="w-4 h-4" />
              Reinicializar Dados Locais
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="max-w-md w-full bg-[#151f32] border border-[#1e293b] rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-2">
          Falha no Carregamento
        </h1>
        
        <p className="text-slate-400 text-center text-sm mb-6">
          Ocorreu um erro interno na aplicação. Isto pode ser causado por um problema de cache ou uma incompatibilidade após o restauro.
        </p>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 mb-8 overflow-auto max-h-48">
          <p className="text-xs font-mono text-red-400 break-words">
            {error.name}: {error.message}
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-slate-500 mt-2">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Tentar Novamente
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/dashboard';
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-bold transition-colors"
          >
            Voltar ao Início
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                // Clear all local storage and unregister service workers
                localStorage.clear();
                sessionStorage.clear();
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
                window.location.href = '/login';
              }
            }}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-300 mt-4 underline underline-offset-4"
          >
            Modo de Segurança (Limpar Cache PWA)
          </button>
        </div>
      </div>
    </div>
  );
}

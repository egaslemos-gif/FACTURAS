"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Inter, Geist } from "next/font/google";

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Layout Error Caught:", error);
  }, [error]);

  return (
    <html lang="pt" className={`${inter.variable} ${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased overflow-x-hidden font-sans bg-[#f8fafc] text-slate-900" suppressHydrationWarning>
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
              Erro Crítico da Aplicação
            </h1>
            
            <p className="text-slate-500 text-center text-sm mb-6">
              A aplicação encontrou um erro irrecuperável ao iniciar. Isto pode ser um problema de ligação intermitente ou cache desatualizada.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8 overflow-auto max-h-48">
              <p className="text-xs font-mono text-red-600 break-words">
                {error.name}: {error.message}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl font-bold transition-colors shadow-sm"
              >
                <RefreshCw className="w-5 h-5" />
                Recarregar Página
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
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
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 mt-4 underline underline-offset-4"
              >
                Modo de Segurança (Limpar Cache PWA)
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

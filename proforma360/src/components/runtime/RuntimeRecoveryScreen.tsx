"use client";

import React, { useState, useEffect } from "react";
import { RuntimeIntegrity, IntegrityReport } from "@/lib/runtime/runtimeIntegrity";
import { AlertTriangle, RefreshCw, Database, Trash2, Download } from "lucide-react";
import { safeRender } from "@/lib/utils/safeRender";

export default function RuntimeRecoveryScreen() {
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [checking, setChecking] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function runCheck() {
      try {
        const rep = await RuntimeIntegrity.checkIntegrity();
        setReport(rep);
      } catch (err) {
        console.error("Integrity check failed", err);
      } finally {
        setChecking(false);
      }
    }
    runCheck();
  }, []);

  const handleForceRebuild = async () => {
    setActionLoading(true);
    try {
      await RuntimeIntegrity.forceRebuildRuntime();
    } catch (err) {
      alert("Falha ao reconstruir cache.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportDB = async () => {
    setActionLoading(true);
    try {
      const { dbClient } = await import("@/lib/db/client");
      const data = await dbClient.getDatabaseFile();
      if (data) {
        const blob = new Blob([data as any], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "proforma360_db_emergencia.sqlite";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("Nenhum ficheiro local encontrado.");
      }
    } catch (err) {
      alert("Falha ao exportar base de dados.");
    } finally {
      setActionLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-white z-50 p-6">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold text-slate-400">A auditar integridade do sistema...</p>
      </div>
    );
  }

  if (report?.isHealthy && !report.selfHealed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-white z-50 p-4 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500"></div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-950/50 border border-amber-800 rounded-xl flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Consola de Recuperação do Runtime</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Proforma360 Local-First Safety Core</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 text-xs font-mono space-y-2 text-slate-300">
          <p className="text-slate-500 font-bold">--- DIAGNÓSTICOS SISTEMA ---</p>
          <p>App Version: <span className="text-white">{safeRender(report?.appVersion)}</span></p>
          <p>Service Worker status: <span className={report?.swStatus === "active" ? "text-emerald-400" : "text-amber-400"}>{safeRender(report?.swStatus)}</span></p>
          <p>Local SQLite status: <span className={report?.dbStatus === "healthy" ? "text-emerald-400" : "text-red-400"}>{safeRender(report?.dbStatus)}</span></p>
          
          {report?.errors && report.errors.length > 0 && (
            <div className="mt-3 border-t border-slate-800 pt-2 space-y-1">
              <p className="text-red-400 font-bold">Anomalias Detetadas:</p>
              {report.errors.map((err, i) => (
                <p key={i} className="text-red-300">?? {safeRender(err)}</p>
              ))}
            </div>
          )}

          {report?.selfHealed && (
            <div className="mt-2 text-emerald-400 font-bold border-t border-slate-800 pt-2">
              ? Correções automáticas aplicadas com sucesso! O sistema deverá funcionar após recarregar.
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.reload()}
            disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" /> Recarregar App
          </button>
          
          <button
            onClick={handleExportDB}
            disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-colors border border-slate-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-amber-500" /> Exportar Dados
          </button>

          <button
            onClick={handleForceRebuild}
            disabled={actionLoading}
            className="flex items-center justify-center px-4 py-3 bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-900 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            title="Limpar toda a cache do PWA"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

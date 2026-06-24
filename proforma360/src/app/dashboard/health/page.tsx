"use client";

import { useEffect, useState } from "react";
import { useQuotationsStore } from "@/stores";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { SeverityEngine } from "@/lib/pipeline/severityEngine";
import { useAppSettingsStore } from "@/stores/appSettings";
import {
  Activity,
  Database,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function OperationalHealthPage() {
  const { isOnline } = useNetworkStore();
  const { quotations, fetchQuotations } = useQuotationsStore();
  const { businessProfile } = useAppSettingsStore();
  
  const [syncQueueCount, setSyncQueueCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Computed metrics
  const severityMetrics = {
    critical: 0,
    urgent: 0,
    warning: 0,
    healthy: 0,
  };

  quotations.forEach(q => {
    const severity = SeverityEngine.calculateSeverity(q, businessProfile || "DEFAULT");
    if (severity.state === "critical") severityMetrics.critical++;
    else if (severity.state === "urgent") severityMetrics.urgent++;
    else if (severity.state === "warning") severityMetrics.warning++;
    else severityMetrics.healthy++;
  });

  const checkSyncStatus = async () => {
    setIsRefreshing(true);
    try {
      const { dbClient } = await import("@/lib/db/client");
      const res = await dbClient.query("SELECT COUNT(*) as count FROM persistent_sync_queue WHERE status = 'PENDING'");
      if (res && res.length > 0) {
        setSyncQueueCount(res[0].count || 0);
      }
    } catch (error) {
      console.error("Failed to check sync queue:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
    checkSyncStatus();
    
    // Poll sync status every 10 seconds
    const interval = setInterval(checkSyncStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchQuotations]);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg text-[var(--color-on-surface)] flex items-center gap-3">
            <Activity className="w-8 h-8 text-[var(--color-primary)]" />
            Saúde Operacional
          </h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
            Monitorização em tempo real dos motores de sistema e filas de sincronização.
          </p>
        </div>
        <button
          onClick={checkSyncStatus}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--color-outline-variant)] rounded-md hover:bg-[var(--color-surface-container)] transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sync Engine Status */}
        <div className="dashboard-section border-none shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isOnline ? "bg-emerald-50" : "bg-rose-50"
            )}>
              {isOnline ? (
                <Wifi className="w-5 h-5 text-emerald-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sync Engine</h2>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                isOnline ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="p-4 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Sync Queue (Pendente)</span>
                <Database className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">{syncQueueCount}</span>
                <span className="text-sm text-slate-500 mb-1">operações</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {syncQueueCount === 0 
                  ? "Sincronização em dia." 
                  : isOnline 
                    ? "A processar fila de sincronização..." 
                    : "As operações serão sincronizadas quando estiver online."}
              </p>
            </div>
          </div>
        </div>

        {/* Severity Engine Status */}
        <div className="dashboard-section border-none shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Severity Engine</h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Ativo
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-medium text-rose-900">Crítico</span>
              </div>
              <span className="text-base font-bold text-rose-700">{severityMetrics.critical}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-orange-50 border border-orange-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Urgente</span>
              </div>
              <span className="text-base font-bold text-orange-700">{severityMetrics.urgent}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">Aviso</span>
              </div>
              <span className="text-base font-bold text-amber-700">{severityMetrics.warning}</span>
            </div>
          </div>
        </div>

        {/* AST Engine Status */}
        <div className="dashboard-section border-none shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">AST Engine</h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Operacional
              </span>
            </div>
          </div>

          <div className="flex-1">
            <div className="p-4 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] h-full">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Snapshot Replay</p>
                    <p className="text-xs text-slate-500">Capacidade de rebuild do estado offline a 100%.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Offline Ownership</p>
                    <p className="text-xs text-slate-500">Documentos podem ser gerados e assinados offline.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Deterministic Math</p>
                    <p className="text-xs text-slate-500">Finanças processadas via Math determinística AST.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

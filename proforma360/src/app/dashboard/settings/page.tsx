"use client";

import { useState } from "react";
import { 
  RefreshCw, 
  CloudUpload,
  CloudDownload,
  AlertCircle,
  Database
} from "lucide-react";
import { useSyncStore, useCompanyStore } from "@/stores";
import { restoreBackupFromCloud } from "@/lib/cloud/restoreBackup";
import { backupToCloud } from "@/lib/cloud/cloudBackup";
import { AUTO_BACKUP_POLICY, formatAutoBackupInterval } from "@/lib/cloud/autoBackupPolicy";
import { toast } from "sonner";
import { useLicenseStore } from "@/stores/licenseStore";

export default function SettingsPage() {
  const {
    hasUnsyncedChanges,
    lastSyncDate,
    autoBackupEnabled,
    setHasUnsyncedChanges,
    setLastSyncDate,
    setLastAutoBackupAt,
    setAutoBackupEnabled,
  } = useSyncStore();
  const { company, updateCompany } = useCompanyStore();
  const { license, isAdmin } = useLicenseStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleBackup = async () => {
    try {
      setIsSyncing(true);
      const result = await backupToCloud();
      setHasUnsyncedChanges(false);
      setLastSyncDate(result.date);
      setLastAutoBackupAt(result.date);
      toast.success("Backup guardado com sucesso na Cloud!");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error("Erro ao fazer backup: " + message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (hasUnsyncedChanges) {
      if (!confirm("Tem alterações locais não guardadas. Restaurar da Cloud vai apagar estas alterações. Deseja continuar?")) return;
    }
    
    try {
      setIsSyncing(true);
      const { backupDate } = await restoreBackupFromCloud();

      setHasUnsyncedChanges(false);
      if (backupDate) setLastSyncDate(backupDate);

      toast.success("Backup restaurado com sucesso! A página será atualizada.");
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error("Erro ao restaurar: " + message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-0 max-w-full overflow-x-hidden animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-page-title">Definições</h1>
        <p className="text-page-subtitle">
          Configurações do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* Backup Card */}
        <div className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)] flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-[var(--color-primary)] rounded-full flex items-center justify-center mb-4">
            <CloudUpload className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Guardar na Cloud</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mb-4 flex-1">
            Envia uma cópia de segurança de todos os seus Clientes, Produtos e Proformas para o seu Google Drive.
          </p>

          <div className="w-full flex items-center justify-between gap-3 p-3 mb-4 rounded-lg border border-[var(--color-outline-variant)] bg-slate-50/80 text-left">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-on-surface)]">Backup automático</p>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
                A cada {formatAutoBackupInterval(AUTO_BACKUP_POLICY.SAFETY_INTERVAL_MS)} ou após alterações ({formatAutoBackupInterval(AUTO_BACKUP_POLICY.CHANGES_DEBOUNCE_MS)} de pausa)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoBackupEnabled}
                onChange={(e) => {
                  setAutoBackupEnabled(e.target.checked);
                  toast.success(e.target.checked ? "Backup automático activado." : "Backup automático desactivado.");
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
            </label>
          </div>
          
          {hasUnsyncedChanges && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md text-xs font-medium mb-4">
              <AlertCircle className="w-4 h-4" /> Tem alterações não guardadas
            </div>
          )}

          <button 
            onClick={handleBackup}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[#003ea8] text-white rounded-md font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
            Fazer Backup Agora
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)] flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CloudDownload className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Restaurar da Cloud</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 flex-1">
            Recupera a última cópia de segurança do seu Google Drive. <strong className="text-red-500">Isto irá substituir os dados atuais neste dispositivo.</strong>
          </p>

          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md text-xs font-medium mb-4">
            <Database className="w-4 h-4" /> 
            Último backup: {lastSyncDate ? new Date(lastSyncDate).toLocaleString('pt-PT') : "Desconhecido"}
          </div>

          <button 
            onClick={handleRestore}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[var(--color-outline-variant)] hover:bg-gray-50 text-[var(--color-on-surface)] rounded-md font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CloudDownload className="w-5 h-5" />}
            Restaurar Dados
          </button>
        </div>
      </div>

      {/* App Settings Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-[var(--color-on-surface)] tracking-tight mb-6 border-b border-[var(--color-outline-variant)] pb-4">
          Definições da Aplicação
        </h2>

        <div className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[var(--color-on-surface)]">Visibilidade da Marca (Brand Visibility)</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] mt-1 max-w-xl">
                Mostra uma menção discreta "Generated with Proforma360" no rodapé dos PDFs e mensagens partilhadas. Ajude a partilhar a nossa plataforma!
              </p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={company?.show_branding !== false} 
                onChange={async (e) => {
                  try {
                    await updateCompany({ show_branding: e.target.checked });
                    toast.success("Definição atualizada com sucesso.");
                  } catch(err: any) {
                    toast.error("Erro ao atualizar: " + err.message);
                  }
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

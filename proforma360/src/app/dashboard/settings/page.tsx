"use client";

import { useState } from "react";
import { 
  RefreshCw, 
  CloudUpload,
  CloudDownload,
  AlertCircle,
  Database
} from "lucide-react";
import { useSyncStore } from "@/stores";
import { dbClient } from "@/lib/db/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const { hasUnsyncedChanges, lastSyncDate, setHasUnsyncedChanges, setLastSyncDate } = useSyncStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleBackup = async () => {
    try {
      setIsSyncing(true);
      const dbFile = await dbClient.getDatabaseFile();
      if (!dbFile) throw new Error("Base de dados vazia.");
      
      const formData = new FormData();
      formData.append("file", new Blob([dbFile as unknown as BlobPart]), "proforma360.db");
      
      const res = await fetch("/api/drive/backup", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Falha no upload.");
      
      setHasUnsyncedChanges(false);
      setLastSyncDate(new Date().toISOString());
      toast.success("Backup guardado com sucesso na Cloud!");
    } catch (e: any) {
      toast.error("Erro ao fazer backup: " + e.message);
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
      const res = await fetch("/api/drive/restore");
      if (!res.ok) throw new Error("Nenhum backup encontrado.");
      
      const buffer = await res.arrayBuffer();
      await dbClient.restoreDatabaseFile(new Uint8Array(buffer));
      
      setHasUnsyncedChanges(false);
      const backupDate = res.headers.get("X-Backup-Date");
      if (backupDate) setLastSyncDate(backupDate);
      
      toast.success("Backup restaurado com sucesso! A página será atualizada.");
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      toast.error("Erro ao restaurar: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-0 max-w-full overflow-x-hidden animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-on-surface)] tracking-tight mb-2">
          Sincronização e Backup
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-2xl leading-relaxed">
          O Proforma360 guarda os seus dados localmente no seu dispositivo. Para não os perder, deve fazer backup regular para a sua conta Google Drive.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* Backup Card */}
        <div className="bg-white rounded-2xl border border-[var(--color-outline-variant)] shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-[var(--color-primary)] rounded-full flex items-center justify-center mb-4">
            <CloudUpload className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Guardar na Cloud</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 flex-1">
            Envia uma cópia de segurança de todos os seus Clientes, Produtos e Proformas para o seu Google Drive.
          </p>
          
          {hasUnsyncedChanges && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-medium mb-4">
              <AlertCircle className="w-4 h-4" /> Tem alterações não guardadas
            </div>
          )}

          <button 
            onClick={handleBackup}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[#003ea8] text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
            Fazer Backup Agora
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-2xl border border-[var(--color-outline-variant)] shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CloudDownload className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Restaurar da Cloud</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 flex-1">
            Recupera a última cópia de segurança do seu Google Drive. <strong className="text-red-500">Isto irá substituir os dados atuais neste dispositivo.</strong>
          </p>

          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium mb-4">
            <Database className="w-4 h-4" /> 
            Último backup: {lastSyncDate ? new Date(lastSyncDate).toLocaleString('pt-PT') : "Desconhecido"}
          </div>

          <button 
            onClick={handleRestore}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[var(--color-outline-variant)] hover:bg-gray-50 text-[var(--color-on-surface)] rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CloudDownload className="w-5 h-5" />}
            Restaurar Dados
          </button>
        </div>
      </div>
    </div>
  );
}

import { dbClient } from "@/lib/db/client";

export interface CloudBackupResult {
  date: string;
}

let backupInFlight: Promise<CloudBackupResult> | null = null;

async function performBackup(): Promise<CloudBackupResult> {
  const dbFile = await dbClient.getDatabaseFile();
  if (!dbFile || dbFile.length < 100) {
    throw new Error("Base de dados vazia ou inválida.");
  }

  const formData = new FormData();
  formData.append("file", new Blob([dbFile as BlobPart]), "proforma360.db");

  const res = await fetch("/api/drive/backup", {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  if (!res.ok) {
    let message = "Falha no upload. Verifique a ligação e tente novamente.";
    try {
      const errorData = await res.json();
      message = errorData.details || errorData.error || message;
    } catch {
      // resposta não-JSON
    }
    throw new Error(message);
  }

  return { date: new Date().toISOString() };
}

/** Envia backup da BD local para o Google Drive do utilizador. */
export async function backupToCloud(): Promise<CloudBackupResult> {
  if (backupInFlight) return backupInFlight;
  backupInFlight = performBackup().finally(() => {
    backupInFlight = null;
  });
  return backupInFlight;
}

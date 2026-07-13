import { dbClient } from "@/lib/db/client";

function isValidSqliteFile(data: Uint8Array): boolean {
  if (data.length < 100) return false;
  const header = new TextDecoder().decode(data.slice(0, 16));
  return header.startsWith("SQLite format 3");
}

async function fetchBackupOnce(signal?: AbortSignal): Promise<{ buffer: ArrayBuffer; backupDate: string | null }> {
  const res = await fetch("/api/drive/restore", { signal, cache: "no-store" });

  if (!res.ok) {
    let message = "Nenhum backup encontrado ou falha no download.";
    try {
      const errorData = await res.json();
      message = errorData.details || errorData.error || message;
    } catch {
      // resposta não-JSON
    }
    throw new Error(message);
  }

  const contentType = res.headers.get("Content-Type") || "";
  if (!contentType.includes("sqlite") && !contentType.includes("octet-stream")) {
    throw new Error("Resposta inválida do servidor. Verifique a ligação e tente novamente.");
  }

  const buffer = await res.arrayBuffer();
  if (!buffer.byteLength) {
    throw new Error("O backup descarregado está vazio.");
  }

  return {
    buffer,
    backupDate: res.headers.get("X-Backup-Date"),
  };
}

export async function restoreBackupFromCloud(): Promise<{ backupDate: string | null }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const { buffer, backupDate } = await fetchBackupOnce(controller.signal);
      clearTimeout(timeout);

      const bytes = new Uint8Array(buffer);
      if (!isValidSqliteFile(bytes)) {
        throw new Error(
          "O ficheiro descarregado não é uma base de dados válida. Tente fazer backup novamente na cloud."
        );
      }

      await dbClient.restoreDatabaseFile(bytes);
      return { backupDate };
    } catch (error: unknown) {
      clearTimeout(timeout);
      const err = error instanceof Error ? error : new Error(String(error));

      if (err.name === "AbortError") {
        lastError = new Error("A restauração demorou demasiado. Verifique a ligação e tente novamente.");
      } else if (/failed to fetch|network|connection reset|load failed/i.test(err.message)) {
        lastError = new Error("Ligação interrompida. Verifique a internet e tente novamente.");
      } else {
        lastError = err;
      }

      if (attempt === 0 && /connection|fetch|network|abort/i.test(lastError.message)) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new Error("Falha ao restaurar backup.");
}

/** Política de backup automático para segurança dos dados */

export const AUTO_BACKUP_POLICY = {
  /** Verificar condições a cada minuto */
  CHECK_INTERVAL_MS: 60_000,
  /** Intervalo mínimo entre backups automáticos */
  MIN_INTERVAL_MS: 10 * 60_000,
  /** Aguardar após alterações antes de enviar (evita backup a cada keystroke) */
  CHANGES_DEBOUNCE_MS: 2 * 60_000,
  /** Backup de segurança periódico mesmo sem flag de alterações */
  SAFETY_INTERVAL_MS: 60 * 60_000,
} as const;

export type AutoBackupReason = "changes" | "safety" | "visibility" | "startup";

export function shouldRunAutoBackup(input: {
  enabled: boolean;
  isOnline: boolean;
  isAuthenticated: boolean;
  hasUnsyncedChanges: boolean;
  lastAutoBackupAt: string | null;
  lastSyncDate: string | null;
  now?: number;
}): { run: boolean; reason?: AutoBackupReason } {
  const now = input.now ?? Date.now();

  if (!input.enabled || !input.isOnline || !input.isAuthenticated) {
    return { run: false };
  }

  const lastBackupMs = Math.max(
    input.lastAutoBackupAt ? Date.parse(input.lastAutoBackupAt) : 0,
    input.lastSyncDate ? Date.parse(input.lastSyncDate) : 0
  );

  const elapsed = lastBackupMs > 0 ? now - lastBackupMs : Number.POSITIVE_INFINITY;

  if (elapsed < AUTO_BACKUP_POLICY.MIN_INTERVAL_MS) {
    return { run: false };
  }

  if (input.hasUnsyncedChanges && elapsed >= AUTO_BACKUP_POLICY.CHANGES_DEBOUNCE_MS) {
    return { run: true, reason: "changes" };
  }

  if (elapsed >= AUTO_BACKUP_POLICY.SAFETY_INTERVAL_MS) {
    return { run: true, reason: "safety" };
  }

  return { run: false };
}

export function formatAutoBackupInterval(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `${hours} h`;
}

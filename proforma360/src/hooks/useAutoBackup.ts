"use client";

import { useCallback, useEffect, useRef } from "react";
import { backupToCloud } from "@/lib/cloud/cloudBackup";
import {
  AUTO_BACKUP_POLICY,
  shouldRunAutoBackup,
  type AutoBackupReason,
} from "@/lib/cloud/autoBackupPolicy";
import { useSyncStore } from "@/stores/sync";

const ERROR_TOAST_COOLDOWN_MS = 30 * 60_000;
let lastErrorToastAt = 0;

interface UseAutoBackupOptions {
  enabled: boolean;
  isOnline: boolean;
  isAuthenticated: boolean;
  onSyncingChange?: (syncing: boolean) => void;
  /** Chamado apenas em backups automáticos bem-sucedidos (silencioso por defeito) */
  onAutoBackupSuccess?: (reason: AutoBackupReason) => void;
  /** Chamado em falhas de backup automático */
  onAutoBackupError?: (message: string) => void;
}

export function useAutoBackup({
  enabled,
  isOnline,
  isAuthenticated,
  onSyncingChange,
  onAutoBackupSuccess,
  onAutoBackupError,
}: UseAutoBackupOptions) {
  const hasUnsyncedChanges = useSyncStore((s) => s.hasUnsyncedChanges);
  const lastSyncDate = useSyncStore((s) => s.lastSyncDate);
  const lastAutoBackupAt = useSyncStore((s) => s.lastAutoBackupAt);
  const autoBackupEnabled = useSyncStore((s) => s.autoBackupEnabled);
  const setHasUnsyncedChanges = useSyncStore((s) => s.setHasUnsyncedChanges);
  const setLastSyncDate = useSyncStore((s) => s.setLastSyncDate);
  const setLastAutoBackupAt = useSyncStore((s) => s.setLastAutoBackupAt);

  const runningRef = useRef(false);

  const runAutoBackup = useCallback(
    async (reason: AutoBackupReason) => {
      if (runningRef.current || !autoBackupEnabled) return;
      runningRef.current = true;
      onSyncingChange?.(true);

      try {
        const result = await backupToCloud();
        setHasUnsyncedChanges(false);
        setLastSyncDate(result.date);
        setLastAutoBackupAt(result.date);
        onAutoBackupSuccess?.(reason);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro no backup automático.";
        console.warn("[AutoBackup]", reason, message);

        const now = Date.now();
        if (now - lastErrorToastAt >= ERROR_TOAST_COOLDOWN_MS) {
          lastErrorToastAt = now;
          onAutoBackupError?.(message);
        }
      } finally {
        runningRef.current = false;
        onSyncingChange?.(false);
      }
    },
    [
      autoBackupEnabled,
      onAutoBackupError,
      onAutoBackupSuccess,
      onSyncingChange,
      setHasUnsyncedChanges,
      setLastAutoBackupAt,
      setLastSyncDate,
    ]
  );

  const evaluate = useCallback(
    (forceStartup = false) => {
      const decision = shouldRunAutoBackup({
        enabled: enabled && autoBackupEnabled,
        isOnline,
        isAuthenticated,
        hasUnsyncedChanges,
        lastAutoBackupAt,
        lastSyncDate,
      });

      if (decision.run && decision.reason) {
        void runAutoBackup(decision.reason);
        return;
      }

      if (
        forceStartup &&
        enabled &&
        autoBackupEnabled &&
        isOnline &&
        isAuthenticated &&
        hasUnsyncedChanges
      ) {
        const lastMs = Math.max(
          lastAutoBackupAt ? Date.parse(lastAutoBackupAt) : 0,
          lastSyncDate ? Date.parse(lastSyncDate) : 0
        );
        const elapsed = lastMs > 0 ? Date.now() - lastMs : Number.POSITIVE_INFINITY;
        if (elapsed >= AUTO_BACKUP_POLICY.MIN_INTERVAL_MS) {
          void runAutoBackup("startup");
        }
      }
    },
    [
      autoBackupEnabled,
      enabled,
      hasUnsyncedChanges,
      isAuthenticated,
      isOnline,
      lastAutoBackupAt,
      lastSyncDate,
      runAutoBackup,
    ]
  );

  useEffect(() => {
    if (!enabled || !autoBackupEnabled || !isOnline || !isAuthenticated) return;

    evaluate(true);
    const id = window.setInterval(() => evaluate(false), AUTO_BACKUP_POLICY.CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, autoBackupEnabled, isOnline, isAuthenticated, evaluate]);

  useEffect(() => {
    if (!enabled || !autoBackupEnabled || !isOnline || !isAuthenticated) return;

    const onVisibilityChange = () => {
      if (document.visibilityState !== "hidden" || !hasUnsyncedChanges) return;
      const decision = shouldRunAutoBackup({
        enabled: true,
        isOnline,
        isAuthenticated,
        hasUnsyncedChanges: true,
        lastAutoBackupAt,
        lastSyncDate,
      });
      if (decision.run) {
        void runAutoBackup("visibility");
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [
    enabled,
    autoBackupEnabled,
    hasUnsyncedChanges,
    isAuthenticated,
    isOnline,
    lastAutoBackupAt,
    lastSyncDate,
    runAutoBackup,
  ]);
}

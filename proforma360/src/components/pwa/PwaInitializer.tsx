"use client";

import { useEffect, useState } from "react";
import { runBootValidation, VersionStatus } from "@/lib/pwa/versionGuard";
import { initUpdateManager } from "@/lib/pwa/updateManager";
import { RecoveryScreen } from "@/components/pwa/RecoveryScreen";
import { UpdateBanner } from "@/components/pwa/UpdateBanner";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export function PwaInitializer({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<VersionStatus | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setStatus(runBootValidation());
    initUpdateManager();

    // 1. Request Storage Persistence to prevent browser from clearing IndexedDB under storage pressure
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        if (persistent) {
          console.log("✅ Storage is guaranteed persistent.");
          localStorage.setItem('storage_persistence_status', 'persistent');
        } else {
          console.log("⚠️ Storage is NOT persistent. Browser may clear it under pressure.");
          localStorage.setItem('storage_persistence_status', 'ephemeral');
        }
      });
    }
  }, []);

  // Show nothing until we've validated on the client, or if you prefer SEO,
  // render children and swap if invalid. Let's render children to support SSR,
  // but if we are on client and status is invalid, show RecoveryScreen.
  if (isClient && status && status !== 'VALID') {
    return <RecoveryScreen status={status} />;
  }

  return (
    <>
      {children}
      <UpdateBanner />
      {isClient && <PWAInstallPrompt />}
    </>
  );
}

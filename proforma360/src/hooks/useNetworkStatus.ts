"use client";

import { useState, useEffect, useCallback } from "react";

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const checkConnectivity = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);
      // Fetch the ping endpoint with a short timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch("/api/ping", { 
        method: "GET",
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);

      if (res.ok) {
        setIsOffline(false);
      } else {
        setIsOffline(true);
      }
    } catch (error) {
      setIsOffline(true);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnectivity();

    const handleOnline = () => {
      // When browser reports online, verify with ping
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Optional: Periodic check every 30 seconds
    const interval = setInterval(checkConnectivity, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [checkConnectivity]);

  return { isOffline, isChecking, checkConnectivity };
}

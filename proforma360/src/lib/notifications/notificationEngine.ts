/**
 * Native PWA Notification Engine
 * Manages request permissions, fire native push notifications offline, and deduplication of sent alerts.
 */
export class NotificationEngine {
  private static COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes default cooldown

  /**
   * Request permission to show notifications
   */
  static async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    
    if (Notification.permission === "granted") {
      return true;
    }
    
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    
    return false;
  }

  /**
   * Check if permission is already granted
   */
  static hasPermission(): boolean {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    return Notification.permission === "granted";
  }

  /**
   * Compute a simple hash for deduplication
   */
  private static getNotificationHash(quotationId: string, actionText: string, dateStr: string, timeStr: string): string {
    return `${quotationId}_${actionText}_${dateStr}_${timeStr}`;
  }

  /**
   * Fire a notification if not already sent within the cooldown window
   */
  static async notify(
    quotationId: string, 
    title: string, 
    body: string, 
    actionText: string,
    dateStr: string, 
    timeStr: string,
    options?: NotificationOptions
  ): Promise<boolean> {
    if (typeof window === "undefined" || !this.hasPermission()) {
      return false;
    }

    const hash = this.getNotificationHash(quotationId, actionText, dateStr, timeStr);
    const storageKey = `sent_notif_${hash}`;
    const lastSentStr = localStorage.getItem(storageKey);

    if (lastSentStr) {
      const lastSentTime = parseInt(lastSentStr, 10);
      if (Date.now() - lastSentTime < this.COOLDOWN_MS) {
        // Notification is within cooldown window - skip it to prevent spam
        return false;
      }
    }

    // Save send timestamp
    localStorage.setItem(storageKey, Date.now().toString());

    // Clean up old notification keys from localStorage to prevent bloating
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith("sent_notif_")) {
          const sentTime = parseInt(localStorage.getItem(key) || "0", 10);
          if (Date.now() - sentTime > 24 * 60 * 60 * 1000) {
            // Delete entries older than 24 hours
            localStorage.removeItem(key);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to clean up notification storage", e);
    }

    // Fire actual notification
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.showNotification(title, {
            body,
            icon: "/icon.png",
            badge: "/icon.png",
            tag: hash,
            renotify: true,
            ...options
          } as any);
          return true;
        }
      }
      
      // Fallback to standard window Notification
      new Notification(title, { body, tag: hash, ...options });
      return true;
    } catch (err) {
      console.error("Failed to trigger notification:", err);
      return false;
    }
  }
}

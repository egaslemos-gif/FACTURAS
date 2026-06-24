export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Browser does not support notifications.");
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

export async function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            ...options
          });
          return;
        }
      }

      const notification = new Notification(title, {
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        ...options
      });
      
      notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn("Failed to send local notification:", e);
    }
  }
}

/**
 * Checks for due notifications. Intended to be called in a light interval 
 * or when the app regains focus.
 */
export function checkDueFollowUps(quotations: any[], notifiedSet: Set<string>) {
  if (Notification.permission !== "granted") return;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const currentTimeStr = now.toTimeString().substring(0, 5); // "HH:MM"

  quotations.forEach(q => {
    // Check if reminders are enabled and we have a next action scheduled for today
    if (q.reminders_enabled && q.next_action && q.next_action_date === todayStr && q.next_action_time) {
      
      const notificationKey = `${q.id}-${q.next_action_date}-${q.next_action_time}`;
      
      // If time has arrived/passed and we haven't notified yet today
      if (currentTimeStr >= q.next_action_time && !notifiedSet.has(notificationKey)) {
        
        sendLocalNotification(`Lembrete: ${q.client_name || "Cliente"}`, {
          body: `Ação Pendente: ${q.next_action}`,
          tag: notificationKey // Prevents duplicates
        });
        
        // Add to our runtime set so we don't spam
        notifiedSet.add(notificationKey);
      }
    }
  });
}

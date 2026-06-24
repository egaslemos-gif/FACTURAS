import { SubscriptionPlan } from "./planDefinitions";
import { getLocalDeviceId } from "./deviceIdentity";

/**
 * Client-side interface to request Plan Upgrades from the Control Plane.
 */
export async function requestPlanUpgrade(requestedPlan: SubscriptionPlan, reason: string): Promise<boolean> {
  try {
    // In a real app this comes from useSession or AuthContext
    const userId = "local-fallback"; 
    const deviceId = getLocalDeviceId();

    if (!userId) throw new Error("No active session to request upgrade.");

    const res = await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "REQUEST_UPGRADE",
        payload: {
          userId,
          deviceId,
          requestedPlan,
          reason
        }
      })
    });

    if (!res.ok) throw new Error("Failed to submit upgrade request");
    
    return true;
  } catch (error) {
    console.error("[UpgradeRequest] Failed:", error);
    return false;
  }
}

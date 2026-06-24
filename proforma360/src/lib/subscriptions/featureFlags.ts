export type PlanType = "free" | "starter" | "business" | "enterprise";

export interface PlanCapabilities {
  quotationLimit: number;
  clientLimit: number;
  productLimit: number;
  canExportPDF: boolean;
  canShare: boolean;
  removeBranding: boolean;
  advancedCRM: boolean;
  whatsappCompanion: boolean;
  calendarSync: boolean;
}

export const PLAN_CAPABILITIES: Record<PlanType, PlanCapabilities> = {
  free: {
    quotationLimit: 1,
    clientLimit: 5,
    productLimit: 10,
    canExportPDF: true,
    canShare: true,
    removeBranding: false,
    advancedCRM: false,
    whatsappCompanion: false,
    calendarSync: false,
  },
  starter: {
    quotationLimit: 50,
    clientLimit: 25,
    productLimit: 50,
    canExportPDF: true,
    canShare: true,
    removeBranding: false,
    advancedCRM: false,
    whatsappCompanion: false,
    calendarSync: false,
  },
  business: {
    quotationLimit: 500,
    clientLimit: 100,
    productLimit: 250,
    canExportPDF: true,
    canShare: true,
    removeBranding: true,
    advancedCRM: true,
    whatsappCompanion: true,
    calendarSync: true,
  },
  enterprise: {
    quotationLimit: 999999, // unlimited
    clientLimit: 999999,
    productLimit: 999999,
    canExportPDF: true,
    canShare: true,
    removeBranding: true,
    advancedCRM: true,
    whatsappCompanion: true,
    calendarSync: true,
  },
};

/**
 * Checks if a specific feature capability is allowed for a plan.
 */
export function hasCapability(plan: PlanType, feature: keyof PlanCapabilities): boolean {
  const caps = PLAN_CAPABILITIES[plan] || PLAN_CAPABILITIES.free;
  const value = caps[feature];
  if (typeof value === "boolean") {
    return value;
  }
  return false;
}

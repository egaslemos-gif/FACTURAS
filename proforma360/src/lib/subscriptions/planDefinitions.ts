export type SubscriptionPlan = "FREE" | "STARTER" | "BUSINESS" | "ENTERPRISE";

export type SaaSFeature = 
  | "crm.basic"
  | "crm.advanced"
  | "quotation.export_pdf"
  | "analytics.pipeline"
  | "integration.whatsapp"
  | "branding.custom"
  | "branding.mandatory_watermark";

export interface PlanCapabilities {
  quotas: {
    maxProformas: number | "UNLIMITED";
    maxClients: number | "UNLIMITED";
  };
  features: SaaSFeature[];
}

export const PLAN_DEFINITIONS: Record<SubscriptionPlan, PlanCapabilities> = {
  FREE: {
    quotas: {
      maxProformas: 1,
      maxClients: 5,
    },
    features: [
      "branding.mandatory_watermark"
    ],
  },
  STARTER: {
    quotas: {
      maxProformas: 50,
      maxClients: 50,
    },
    features: [
      "crm.basic",
      "quotation.export_pdf",
      "branding.custom"
    ],
  },
  BUSINESS: {
    quotas: {
      maxProformas: "UNLIMITED",
      maxClients: "UNLIMITED",
    },
    features: [
      "crm.basic",
      "crm.advanced",
      "quotation.export_pdf",
      "analytics.pipeline",
      "integration.whatsapp",
      "branding.custom"
    ],
  },
  ENTERPRISE: {
    quotas: {
      maxProformas: "UNLIMITED",
      maxClients: "UNLIMITED",
    },
    features: [
      "crm.basic",
      "crm.advanced",
      "quotation.export_pdf",
      "analytics.pipeline",
      "integration.whatsapp",
      "branding.custom"
    ],
  }
};

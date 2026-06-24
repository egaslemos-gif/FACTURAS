import { Quotation, Client } from "../types";

export interface RelationshipMetrics {
  ltv: number;
  approvedCount: number;
  totalCount: number;
  tier: "Platinum" | "Gold" | "Silver" | "Bronze";
  tierColor: string;
  daysSinceLastContact: number;
  contactWarning: boolean;
}

/**
 * CRM Relationship Intelligence
 * Evaluates relationship value, client status, and transaction volumes.
 */
export class RelationshipScore {
  
  static getMetrics(client: Client, clientQuotations: Quotation[]): RelationshipMetrics {
    const approvedQuotations = clientQuotations.filter((q) => q.status === "approved");
    const ltv = approvedQuotations.reduce((sum, q) => sum + q.grand_total, 0);
    const approvedCount = approvedQuotations.length;
    const totalCount = clientQuotations.length;

    // Classify client Tier based on Lifetime Value (LTV)
    // Values in Meticais (MTn)
    let tier: "Platinum" | "Gold" | "Silver" | "Bronze" = "Bronze";
    let tierColor = "bg-slate-100 text-slate-800 border-slate-200";

    if (ltv >= 500000) {
      tier = "Platinum";
      tierColor = "bg-purple-100 text-purple-800 border-purple-200 font-extrabold";
    } else if (ltv >= 150000) {
      tier = "Gold";
      tierColor = "bg-amber-100 text-amber-800 border-amber-200 font-bold";
    } else if (ltv >= 50000) {
      tier = "Silver";
      tierColor = "bg-blue-100 text-blue-800 border-blue-200 font-semibold";
    }

    // Days since last contact
    let lastContactMs = new Date(client.created_at).getTime();
    
    clientQuotations.forEach((q) => {
      const contactTime = q.last_contact_at || q.updated_at || q.created_at;
      const t = new Date(contactTime).getTime();
      if (t > lastContactMs) {
        lastContactMs = t;
      }
    });

    const daysSinceLastContact = Math.max(0, Math.floor((Date.now() - lastContactMs) / (1000 * 60 * 60 * 24)));
    const contactWarning = daysSinceLastContact >= 15;

    return {
      ltv,
      approvedCount,
      totalCount,
      tier,
      tierColor,
      daysSinceLastContact,
      contactWarning
    };
  }
}

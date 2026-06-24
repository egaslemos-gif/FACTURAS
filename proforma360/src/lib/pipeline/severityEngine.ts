import { Quotation } from "../types";

export type SeverityState = "healthy" | "warning" | "critical" | "urgent";

export interface SeverityReport {
  score: number;
  state: SeverityState;
  color: string;
  reasons: string[];
}

export interface SlaThresholds {
  warningDays: number;
  criticalDays: number;
}

export function getSlaThresholds(profile: string): SlaThresholds {
  switch(profile?.toUpperCase()) {
    case "SAAS": return { warningDays: 3, criticalDays: 7 };
    case "CONSULTING": return { warningDays: 7, criticalDays: 14 };
    case "LOGISTICS": return { warningDays: 14, criticalDays: 30 };
    default: return { warningDays: 7, criticalDays: 14 };
  }
}

export class SeverityEngine {
  /**
   * Computes risk score and severity state for a given quotation
   */
  static calculateSeverity(quotation: Quotation, profile: string = "DEFAULT"): SeverityReport {
    let score = 0;
    const reasons: string[] = [];
    const thresholds = getSlaThresholds(profile);

    // 1. Next Action Overdue Checks
    if (quotation.next_action_date) {
      const actionDate = new Date(quotation.next_action_date);
      const today = new Date();
      // Set hours to 0 to compare dates only
      today.setHours(0, 0, 0, 0);
      actionDate.setHours(0, 0, 0, 0);

      const diffMs = today.getTime() - actionDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 3) {
        score += 45;
        reasons.push(`Ação necessária em atraso por ${diffDays} dias`);
      } else if (diffDays > 0) {
        score += 30;
        reasons.push("Ação agendada em atraso");
      }
    }

    // 2. Aging / Inactivity Checks based on profile SLA thresholds
    const lastActivity = quotation.last_activity_at || quotation.updated_at || quotation.created_at;
    const activityMs = Date.now() - new Date(lastActivity).getTime();
    const daysInactive = Math.max(0, Math.floor(activityMs / (1000 * 60 * 60 * 24)));

    if (daysInactive >= thresholds.criticalDays) {
      score += 45;
      reasons.push(`Inatividade comercial grave (${daysInactive} dias sem interação)`);
    } else if (daysInactive >= thresholds.warningDays) {
      score += 30;
      reasons.push(`Em risco de inatividade (${daysInactive} dias)`);
    }

    // 3. Priority Weighting
    const priority = quotation.priority || "medium";
    if (priority === "urgent") {
      score += 30;
      reasons.push("Prioridade marcada como urgente");
    } else if (priority === "high") {
      score += 20;
      reasons.push("Prioridade alta");
    } else if (priority === "medium") {
      score += 10;
    }

    // 4. Value Risk Multiplier
    const value = quotation.grand_total || 0;
    if (value > 100000) {
      score += 25;
      reasons.push(`Valor financeiro elevado sob risco (PF > 100.000 MT)`);
    } else if (value > 50000) {
      score += 15;
      reasons.push("Valor intermédio sob risco (PF > 50.000 MT)");
    }

    // Cap at 100 and Min 0
    score = Math.max(0, Math.min(100, score));

    // Determine state
    let state: SeverityState = "healthy";
    let color = "#22c55e"; // Green

    if (score >= 85) {
      state = "urgent";
      color = "#ef4444"; // Red
    } else if (score >= 60) {
      state = "critical";
      color = "#f97316"; // Orange
    } else if (score >= 30) {
      state = "warning";
      color = "#f59e0b"; // Yellow/Amber
    }

    return {
      score,
      state,
      color,
      reasons,
    };
  }
}

import { Quotation } from "@/lib/types";

export type AgingLevel = "healthy" | "warning" | "danger";

export interface AgingInfo {
  days: number;
  level: AgingLevel;
  color: string;
}

/**
 * Calculates how many days have passed since the given ISO date string.
 */
export function calculateAgingDays(dateString?: string | null): number {
  if (!dateString) return 0;
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Strip time for clean day diff
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = Math.abs(nowOnly.getTime() - dateOnly.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns the aging level based on days without activity.
 * - 0 to 2 days: healthy
 * - 3 to 6 days: warning
 * - 7+ days: danger
 */
export function getAgingLevel(days: number): AgingLevel {
  if (days < 3) return "healthy";
  if (days < 7) return "warning";
  return "danger";
}

/**
 * Evaluates a quotation's health based on its last activity.
 * Falls back to updated_at or created_at if last_activity_at is missing.
 */
export function evaluateQuotationAging(quotation: Quotation): AgingInfo {
  // If quotation is closed (won/lost) or draft, aging is irrelevant or different logic
  if (["won", "lost"].includes(quotation.pipeline_stage) || quotation.status === "draft") {
    return { days: 0, level: "healthy", color: "border-transparent" };
  }

  const dateToUse = quotation.last_activity_at || quotation.updated_at || quotation.created_at;
  const days = calculateAgingDays(dateToUse);
  const level = getAgingLevel(days);
  
  let color = "border-transparent";
  if (level === "warning") color = "border-amber-200 ring-1 ring-amber-100";
  if (level === "danger") color = "border-red-200 ring-1 ring-red-100";
  
  return { days, level, color };
}

import { Quotation } from "../types";
import { evaluateQuotationAging } from "./aging";

export interface PipelineHealth {
  score: number; // 0 to 100
  label: string;
  color: string;
  overdueCount: number;
  staleCount: number;
  activeCount: number;
}

/**
 * Calculates global pipeline health metrics.
 */
export function calculatePipelineHealth(quotations: Quotation[]): PipelineHealth {
  const activeDeals = quotations.filter(
    (q) => q.pipeline_stage && !["won", "lost"].includes(q.pipeline_stage) && q.status !== "draft"
  );

  const activeCount = activeDeals.length;
  if (activeCount === 0) {
    return {
      score: 100,
      label: "Sem Negócios Ativos",
      color: "text-slate-400 bg-slate-50 border-slate-200",
      overdueCount: 0,
      staleCount: 0,
      activeCount: 0,
    };
  }

  const todayStr = new Date().toISOString().split("T")[0];
  let overdueCount = 0;
  let staleCount = 0;

  activeDeals.forEach((q) => {
    // Overdue Check
    if (q.next_action_date && q.next_action_date < todayStr && q.followup_status !== "completed") {
      overdueCount++;
    }

    // Stale Check (no activity in >= 7 days)
    const aging = evaluateQuotationAging(q);
    if (aging.days >= 7) {
      staleCount++;
    }
  });

  // Calculate health score: start at 100, deduct points for alerts
  // Overdue: -15 points each
  // Stale: -10 points each
  const totalDeductions = (overdueCount * 15) + (staleCount * 10);
  const score = Math.max(0, Math.min(100, 100 - totalDeductions));

  let label = "🟢 Pipeline Saudável";
  let color = "text-emerald-700 bg-emerald-50 border-emerald-200";

  if (score < 50) {
    label = "🔴 Pipeline em Risco";
    color = "text-red-700 bg-red-50 border-red-200";
  } else if (score < 80) {
    label = "🟡 Pipeline Requer Atenção";
    color = "text-amber-700 bg-amber-50 border-amber-200";
  }

  return {
    score,
    label,
    color,
    overdueCount,
    staleCount,
    activeCount,
  };
}

import { Quotation } from "@/lib/types";
import { evaluateQuotationAging } from "./aging";

export type AlertType = "overdue_followup" | "expiring_soon" | "expired" | "no_activity";
export type AlertSeverity = "high" | "medium" | "low";

export interface PipelineAlert {
  id: string;
  quotationId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  quotationNumber: string;
  clientName: string;
}

export function generateAlerts(quotations: Quotation[]): PipelineAlert[] {
  const alerts: PipelineAlert[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const next3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const activeDeals = quotations.filter(q => q.pipeline_stage && !["won", "lost"].includes(q.pipeline_stage));

  activeDeals.forEach(q => {
    // 1. Expiration Alerts
    if (q.expiry_date) {
      if (q.expiry_date < todayStr) {
        alerts.push({
          id: `alert-expired-${q.id}`,
          quotationId: q.id,
          type: "expired",
          severity: "high",
          message: "Proforma expirada. É necessário renovar ou fechar como perdida.",
          quotationNumber: q.quotation_number,
          clientName: q.client_name || "Desconhecido"
        });
      } else if (q.expiry_date <= next3Days) {
        alerts.push({
          id: `alert-expiring-${q.id}`,
          quotationId: q.id,
          type: "expiring_soon",
          severity: "medium",
          message: `Proforma expira em breve (${new Date(q.expiry_date).toLocaleDateString("pt-PT")}).`,
          quotationNumber: q.quotation_number,
          clientName: q.client_name || "Desconhecido"
        });
      }
    }

    // 2. Follow-up Alerts
    if (q.next_action_date && q.next_action_date < todayStr) {
      alerts.push({
        id: `alert-followup-${q.id}`,
        quotationId: q.id,
        type: "overdue_followup",
        severity: "high",
        message: `Follow-up em atraso: ${q.next_action}`,
        quotationNumber: q.quotation_number,
        clientName: q.client_name || "Desconhecido"
      });
    }

    // 3. No Activity / Aging Alerts
    const aging = evaluateQuotationAging(q);
    if (aging.level === "danger") {
      alerts.push({
        id: `alert-aging-${q.id}`,
        quotationId: q.id,
        type: "no_activity",
        severity: q.priority === "high" ? "high" : "medium",
        message: `Sem atividade há ${aging.days} dias.`,
        quotationNumber: q.quotation_number,
        clientName: q.client_name || "Desconhecido"
      });
    }
  });

  // Sort by severity: high first, then medium, then low
  return alerts.sort((a, b) => {
    const weights = { high: 3, medium: 2, low: 1 };
    return weights[b.severity] - weights[a.severity];
  });
}

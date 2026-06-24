import { Quotation } from "@/lib/types";
import { evaluateQuotationAging } from "../pipeline/aging";
import { getSlaThresholds } from "../pipeline/severityEngine";

export type OperationalAlertType =
  | "overdue_followup"
  | "expiring_quotation"
  | "no_client_response"
  | "scheduled_call"
  | "stale_pipeline"
  | "inactive_negotiation";

export type AlertPriority = "urgent" | "high" | "medium" | "low";

export interface OperationalAlert {
  id: string;
  quotationId: string;
  quotationNumber: string;
  clientName: string;
  type: OperationalAlertType;
  priority: AlertPriority;
  message: string;
  nextActionDate?: string | null;
  nextActionTime?: string | null;
}

/**
 * Generate highly prioritized operational alerts to answer: "What needs my attention NOW?"
 */
export function generateOperationalAlerts(quotations: Quotation[], profile: string = "DEFAULT"): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];
  const now = new Date();
  const thresholds = getSlaThresholds(profile);
  
  // Date format yyyy-mm-dd
  const pad = (n: number) => n.toString().padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  
  // Next 3 days date string
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const threeDaysLaterStr = `${threeDaysLater.getFullYear()}-${pad(threeDaysLater.getMonth() + 1)}-${pad(threeDaysLater.getDate())}`;

  // Filter out won/lost and draft quotations
  const activeQuotations = quotations.filter(
    (q) => q.pipeline_stage && !["won", "lost"].includes(q.pipeline_stage) && q.status !== "draft"
  );

  for (const q of activeQuotations) {
    const clientName = q.client_name || "Cliente sem Nome";
    
    // 1. Overdue Followup
    if (q.next_action_date && q.followup_status !== "completed") {
      const isPastDate = q.next_action_date < todayStr;
      const isToday = q.next_action_date === todayStr;
      
      let isOverdue = isPastDate;
      if (isToday && q.next_action_time) {
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const [targetHour, targetMin] = q.next_action_time.split(":").map(Number);
        if (currentHour > targetHour || (currentHour === targetHour && currentMin > targetMin)) {
          isOverdue = true;
        }
      }

      if (isOverdue) {
        alerts.push({
          id: `alert-overdue-${q.id}`,
          quotationId: q.id,
          quotationNumber: q.quotation_number,
          clientName,
          type: "overdue_followup",
          priority: q.priority === "high" || q.priority === "urgent" ? "urgent" : "high",
          message: `Follow-up em atraso: "${q.next_action || "Sem descrição"}" (Agendado para ${q.next_action_date} ${q.next_action_time || ""})`,
          nextActionDate: q.next_action_date,
          nextActionTime: q.next_action_time
        });
      }
    }

    // 2. Expiring Quotation
    if (q.expiry_date) {
      if (q.expiry_date < todayStr) {
        alerts.push({
          id: `alert-expired-${q.id}`,
          quotationId: q.id,
          quotationNumber: q.quotation_number,
          clientName,
          type: "expiring_quotation",
          priority: "high",
          message: `Proposta expirou em ${q.expiry_date}. É necessário renegociar ou fechar.`,
        });
      } else if (q.expiry_date <= threeDaysLaterStr) {
        alerts.push({
          id: `alert-expiring-${q.id}`,
          quotationId: q.id,
          quotationNumber: q.quotation_number,
          clientName,
          type: "expiring_quotation",
          priority: "medium",
          message: `Esta proposta expira em breve: dia ${q.expiry_date}.`,
        });
      }
    }

    // 3. Inactive Negotiation (in Negotiation stage for too long)
    if (q.pipeline_stage === "negotiation") {
      const aging = evaluateQuotationAging(q);
      if (aging.days >= Math.floor(thresholds.warningDays / 2)) {
        alerts.push({
          id: `alert-inactive-neg-${q.id}`,
          quotationId: q.id,
          quotationNumber: q.quotation_number,
          clientName,
          type: "inactive_negotiation",
          priority: "high",
          message: `Negociação estagnada: Sem novidades há ${aging.days} dias nesta fase crítica.`,
        });
      }
    }

    // 4. Stale Pipeline
    const aging = evaluateQuotationAging(q);
    if (aging.days >= Math.floor(thresholds.warningDays) && (q.priority === "high" || q.priority === "urgent")) {
      alerts.push({
        id: `alert-stale-${q.id}`,
        quotationId: q.id,
        quotationNumber: q.quotation_number,
        clientName,
        type: "stale_pipeline",
        priority: "high",
        message: `Negócio Crítico Estagnado: Sem atividade há ${aging.days} dias.`,
      });
    } else if (aging.days >= thresholds.warningDays) {
      // 5. No Client Response
      alerts.push({
        id: `alert-no-resp-${q.id}`,
        quotationId: q.id,
        quotationNumber: q.quotation_number,
        clientName,
        type: "no_client_response",
        priority: "medium",
        message: `Sem contacto com o cliente há ${aging.days} dias.`,
      });
    }

    // 6. Scheduled Call Today
    if (q.next_action_date === todayStr && q.followup_status !== "completed") {
      const descLower = (q.next_action || "").toLowerCase();
      const isCall = descLower.includes("ligar") || descLower.includes("call") || descLower.includes("telefonar") || descLower.includes("📞");
      if (isCall) {
        alerts.push({
          id: `alert-call-${q.id}`,
          quotationId: q.id,
          quotationNumber: q.quotation_number,
          clientName,
          type: "scheduled_call",
          priority: "medium",
          message: `Chamada agendada para hoje: "${q.next_action}" às ${q.next_action_time || "qualquer hora"}`,
          nextActionDate: q.next_action_date,
          nextActionTime: q.next_action_time
        });
      }
    }
  }

  // Sort: urgent -> high -> medium -> low
  const weights: Record<AlertPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
  return alerts.sort((a, b) => weights[b.priority] - weights[a.priority]);
}

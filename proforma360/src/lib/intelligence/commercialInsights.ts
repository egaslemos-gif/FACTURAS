import { Quotation } from "../types";
import { evaluateQuotationAging } from "../pipeline/aging";

export interface CommercialInsight {
  id: string;
  type: "warning" | "success" | "tip";
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
}

/**
 * Heuristics-based sales acceleration insight generator.
 */
export class CommercialInsightsEngine {
  
  static generate(quotations: Quotation[]): CommercialInsight[] {
    const insights: CommercialInsight[] = [];
    const activeDeals = quotations.filter(
      (q) => q.pipeline_stage && !["won", "lost"].includes(q.pipeline_stage) && q.status !== "draft"
    );

    if (activeDeals.length === 0) return [];

    // Rule 1: Negócios sem follow-up há 5 dias
    const staleDeals = activeDeals.filter(q => {
      const aging = evaluateQuotationAging(q);
      return aging.days >= 5;
    });

    if (staleDeals.length > 0) {
      insights.push({
        id: "insight-stale-deals",
        type: "warning",
        title: "⚠️ Ação em Atraso Prejudica Vendas",
        message: `${staleDeals.length} negócios estão sem atividade há 5+ dias. Negócios sem contacto em 5 dias têm 42% menor conversão.`,
        actionLabel: "Ver no Pipeline",
        actionUrl: "/dashboard/pipeline"
      });
    }

    // Rule 2: High Value deals with low activity
    const criticalDeals = activeDeals.filter(q => {
      const isHighVal = q.grand_total >= 100000;
      const aging = evaluateQuotationAging(q);
      return isHighVal && aging.days >= 3;
    });

    if (criticalDeals.length > 0) {
      insights.push({
        id: "insight-critical-value",
        type: "tip",
        title: "🔥 Negócios de Alto Valor Estagnados",
        message: `Existem ${criticalDeals.length} proformas acima de 100.000 MTn paradas há mais de 3 dias. Priorize estes contactos para fecho de trimestre.`,
        actionLabel: "Priorizar Ações",
        actionUrl: "/dashboard"
      });
    }

    // Rule 3: Fast Response Conversion
    const approvedDeals = quotations.filter(q => q.status === "approved");
    if (approvedDeals.length > 3) {
      insights.push({
        id: "insight-conversion-tip",
        type: "success",
        title: "📈 Conversão Acelerada",
        message: "Excelente! Clientes contactados em menos de 24h demonstram uma taxa de aceitação de propostas 2.3x superior.",
      });
    }

    return insights;
  }
}

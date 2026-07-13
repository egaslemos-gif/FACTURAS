import type { Quotation } from "@/lib/types";

export interface DealDocumentStatus {
  hasProformaPdf: boolean;
  proformaSent: boolean;
  hasTechnicalProposal: boolean;
  missingItems: string[];
  needsAttention: boolean;
}

export function getDealDocumentStatus(
  deal: Quotation,
  proposalQuotationIds: Set<string>
): DealDocumentStatus {
  const hasProformaPdf = Boolean(deal.pdf_drive_id || deal.pdf_url);
  const proformaSent = deal.status === "sent" || deal.status === "approved" || Boolean(deal.sent_at);
  const hasTechnicalProposal = proposalQuotationIds.has(deal.id);
  const stage = deal.pipeline_stage || "lead";
  const missingItems: string[] = [];

  if (["proposal", "negotiation"].includes(stage) && !hasTechnicalProposal) {
    missingItems.push("Proposta técnica em falta");
  }
  if (["proposal", "negotiation", "contacted"].includes(stage) && !proformaSent) {
    missingItems.push("Proforma não enviada");
  }
  if (proformaSent && !hasProformaPdf) {
    missingItems.push("PDF da proforma não disponível");
  }

  return {
    hasProformaPdf,
    proformaSent,
    hasTechnicalProposal,
    missingItems,
    needsAttention: missingItems.length > 0,
  };
}

export function getPipelineDocumentSummary(
  quotations: Quotation[],
  proposalQuotationIds: Set<string>
) {
  const active = quotations.filter(
    (q) => q.pipeline_stage && !["won", "lost"].includes(q.pipeline_stage)
  );

  let missingTechnical = 0;
  let missingPdf = 0;
  let notSent = 0;

  for (const deal of active) {
    const status = getDealDocumentStatus(deal, proposalQuotationIds);
    if (!status.hasTechnicalProposal && ["proposal", "negotiation"].includes(deal.pipeline_stage || "")) {
      missingTechnical++;
    }
    if (!status.hasProformaPdf && status.proformaSent) missingPdf++;
    if (!status.proformaSent && ["proposal", "negotiation", "contacted"].includes(deal.pipeline_stage || "")) {
      notSent++;
    }
  }

  return { active: active.length, missingTechnical, missingPdf, notSent };
}

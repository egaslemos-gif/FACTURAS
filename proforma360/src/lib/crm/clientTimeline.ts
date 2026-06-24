import { ClientInteraction, Quotation, QuotationHistory } from "../types";

export interface TimelineEvent {
  id: string;
  date: string;
  type: "interaction" | "quotation" | "history";
  icon: string;
  color: string;
  label: string;
  title: string;
  description: string | null;
}

/**
 * Consolidates all client operational events chronologically.
 */
export function buildClientTimeline(
  interactions: ClientInteraction[],
  quotations: Quotation[],
  history: (QuotationHistory & { quotation_number?: string })[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 1. Manual Interactions
  interactions.forEach((i) => {
    let icon = "📝";
    let color = "#6b7280"; // Slate
    if (i.type === "call") { icon = "📞"; color = "#0ea5e9"; }
    else if (i.type === "meeting") { icon = "🤝"; color = "#8b5cf6"; }
    else if (i.type === "email") { icon = "📧"; color = "#f59e0b"; }
    else if (i.type === "whatsapp") { icon = "💬"; color = "#22c55e"; }

    events.push({
      id: i.id,
      date: i.created_at,
      type: "interaction",
      icon,
      color,
      label: i.type.toUpperCase(),
      title: i.title,
      description: i.description,
    });
  });

  // 2. Quotation Creations / Lifecycle Updates
  quotations.forEach((q) => {
    events.push({
      id: `q-create-${q.id}`,
      date: q.created_at,
      type: "quotation",
      icon: "📄",
      color: "#0f172a",
      label: "PROPOSTA",
      title: `Proforma ${q.quotation_number} criada`,
      description: `Valor total: ${q.grand_total.toLocaleString("pt-PT")} MTn`,
    });
  });

  // 3. Automated History logs
  history.forEach((h) => {
    let icon = "🔄";
    let color = "#64748b";
    if (h.action === "Created") { icon = "📄"; color = "#3b82f6"; }
    else if (h.action === "Shared" || h.action === "Sent") { icon = "📤"; color = "#22c55e"; }
    else if (h.action === "Pipeline") { icon = "📊"; color = "#8b5cf6"; }

    events.push({
      id: h.id,
      date: h.created_at,
      type: "history",
      icon,
      color,
      label: "SISTEMA",
      title: h.action === "Created" ? "Proforma criada" : h.action === "Shared" ? "Proforma enviada" : `Estado alterado: ${h.details || ""}`,
      description: h.details || `${h.old_status || "n/a"} ➔ ${h.new_status || "n/a"}`,
    });
  });

  // Sort by date descending
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

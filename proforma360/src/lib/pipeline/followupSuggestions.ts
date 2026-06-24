import { Quotation } from "../types";

export interface FollowupSuggestion {
  actionKey: "resend_proposal" | "call_client" | "whatsapp_nudge" | "reschedule_action";
  label: string;
  description: string;
  icon: string;
}

/**
 * Intelligent follow-up recommendation engine.
 */
export function getFollowupSuggestions(quotation: Quotation): FollowupSuggestion[] {
  const suggestions: FollowupSuggestion[] = [];

  const lastActivityDate = quotation.last_activity_at || quotation.updated_at || quotation.created_at;
  const diffMs = Date.now() - new Date(lastActivityDate).getTime();
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Closed deals don't need follow-ups
  if (["won", "lost"].includes(quotation.pipeline_stage || "")) {
    return [];
  }

  // 1. WhatsApp follow-up nudge
  if (daysSince >= 3 && daysSince < 6) {
    suggestions.push({
      actionKey: "whatsapp_nudge",
      label: "Enviar WhatsApp",
      description: "Pergunte gentilmente se o cliente pôde ler a proposta.",
      icon: "💬"
    });
  }

  // 2. Resend Proposal
  if (daysSince >= 5) {
    suggestions.push({
      actionKey: "resend_proposal",
      label: "Reenviar Proposta",
      description: "Reenvie os detalhes e o link do PDF por email/mensagem.",
      icon: "📄"
    });
  }

  // 3. Call Client (Urgent / High aging)
  if (daysSince >= 7 || quotation.priority === "high" || quotation.priority === "urgent") {
    suggestions.push({
      actionKey: "call_client",
      label: "Ligar para o Cliente",
      description: "Ligue para entender se existem objeções ao preço ou prazos.",
      icon: "📞"
    });
  }

  // 4. Schedule new activity
  if (!quotation.next_action) {
    suggestions.push({
      actionKey: "reschedule_action",
      label: "Agendar Ação",
      description: "Agende um compromisso ou tarefa para não perder o contato.",
      icon: "📅"
    });
  }

  return suggestions;
}

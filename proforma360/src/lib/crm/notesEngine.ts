export interface CRMProfileNote {
  id: string;
  text: string;
  category: "preference" | "behavior" | "finance" | "general";
  createdAt: string;
}

/**
 * Intelligent client profiling and operational notes analyzer.
 */
export class NotesEngine {
  
  /**
   * Scans note content to automatically suggest tags
   */
  static extractTags(notesText: string): string[] {
    const text = notesText.toLowerCase();
    const suggestedTags: string[] = [];

    if (text.includes("whatsapp") || text.includes("zap")) {
      suggestedTags.push("Prefere WhatsApp");
    }
    if (text.includes("preço") || text.includes("sensível") || text.includes("desconto")) {
      suggestedTags.push("Sensível a Preço");
    }
    if (text.includes("decisor lento") || text.includes("demora") || text.includes("burocracia")) {
      suggestedTags.push("Decisor Lento");
    }
    if (text.includes("urgente") || text.includes("prioridade") || text.includes("rápido")) {
      suggestedTags.push("Urgente");
    }
    if (text.includes("recorrente") || text.includes("mensal") || text.includes("sempre compra")) {
      suggestedTags.push("Recorrente");
    }
    if (text.includes("alto valor") || text.includes("corporate") || text.includes("grande empresa")) {
      suggestedTags.push("Alto Valor");
    }

    return suggestedTags;
  }
}

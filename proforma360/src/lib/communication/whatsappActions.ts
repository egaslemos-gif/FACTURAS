export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: "proposal" | "followup" | "reminder";
  text: string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "send_proposal",
    name: "Enviar Proposta Inicial",
    category: "proposal",
    text: "Olá {clientName},\n\nConforme conversámos, envio o link para aceder à Proforma {docNumber}. Ficamos à disposição para esclarecer qualquer dúvida.\n\n🔗 Ver Proposta: {docUrl}\n\nCumprimentos,\n{companyName}"
  },
  {
    id: "followup_check",
    name: "Acompanhamento (Follow-up)",
    category: "followup",
    text: "Olá {clientName},\n\nGostaria de confirmar se teve oportunidade de analisar a nossa proposta {docNumber}.\n\nTem alguma dúvida sobre os valores ou termos? Podemos marcar uma chamada rápida.\n\n🔗 Link: {docUrl}\n\nCumprimentos,\n{companyName}"
  },
  {
    id: "expiry_reminder",
    name: "Lembrete de Vencimento",
    category: "reminder",
    text: "Olá {clientName},\n\nEsperamos que esteja bem.\n\nPassamos para lembrar que a proposta {docNumber} expira em breve (válida até {expiryDate}).\n\nPodemos confirmar a adjudicação para garantir as condições atuais?\n\n🔗 Link: {docUrl}\n\nCumprimentos,\n{companyName}"
  }
];

/**
 * Helper to build custom click-to-chat URL for WhatsApp.
 */
export class WhatsAppActions {
  
  static getTemplates(): WhatsAppTemplate[] {
    return WHATSAPP_TEMPLATES;
  }

  static formatMessage(
    templateText: string, 
    params: { clientName: string; docNumber: string; docUrl: string; companyName: string; expiryDate?: string }
  ): string {
    return templateText
      .replace(/{clientName}/g, params.clientName)
      .replace(/{docNumber}/g, params.docNumber)
      .replace(/{docUrl}/g, params.docUrl)
      .replace(/{companyName}/g, params.companyName)
      .replace(/{expiryDate}/g, params.expiryDate || "");
  }

  static getClickToChatUrl(phone: string, message: string): string {
    // Clean phone number (keep digits only)
    const cleanedPhone = phone.replace(/\D/g, "");
    // If phone doesn't have country code and starts with 8, assume Mozambique (+258)
    let finalPhone = cleanedPhone;
    if (cleanedPhone.length === 9 && cleanedPhone.startsWith("8")) {
      finalPhone = `258${cleanedPhone}`;
    }

    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
  }
}

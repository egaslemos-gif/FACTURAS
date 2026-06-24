export interface EmailTemplate {
  id: string;
  name: string;
  category: "proposal" | "followup" | "reminder";
  subject: string;
  body: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "send_proposal",
    name: "Enviar Proposta Inicial",
    category: "proposal",
    subject: "Proposta Comercial {docNumber} — {companyName}",
    body: "Olá {clientName},\n\nEspero que esteja bem.\n\nConforme conversámos, envio em anexo/link a Proposta Comercial {docNumber}.\n\nPode aceder aos detalhes e validar a proposta diretamente no link abaixo:\n🔗 {docUrl}\n\nFicamos inteiramente ao dispor para qualquer esclarecimento adicional.\n\nCumprimentos,\n{companyName}"
  },
  {
    id: "followup_check",
    name: "Acompanhamento (Follow-up)",
    category: "followup",
    subject: "Seguimento da Proposta Comercial {docNumber} — {companyName}",
    body: "Olá {clientName},\n\nGostaria de confirmar se teve oportunidade de analisar a nossa proposta {docNumber} (🔗 {docUrl}) enviada recentemente.\n\nTem alguma dúvida sobre os valores, prazos ou termos propostos? Caso pretenda, podemos agendar uma breve reunião de alinhamento.\n\nCumprimentos,\n{companyName}"
  },
  {
    id: "expiry_reminder",
    name: "Lembrete de Vencimento",
    category: "reminder",
    subject: "Aviso de Vencimento: Proposta {docNumber} — {companyName}",
    body: "Olá {clientName},\n\nEspero que se encontre bem.\n\nGostaria de recordar que a proposta {docNumber} tem validade até {expiryDate}.\n\nPara garantir as condições comerciais atuais, agradecemos a sua confirmação ou adjudicação no link:\n🔗 {docUrl}\n\nCumprimentos,\n{companyName}"
  }
];

export class EmailActions {
  static getTemplates(): EmailTemplate[] {
    return EMAIL_TEMPLATES;
  }

  static formatTemplate(
    template: EmailTemplate,
    params: { clientName: string; docNumber: string; docUrl: string; companyName: string; expiryDate?: string }
  ): { subject: string; body: string } {
    const format = (text: string) => {
      return text
        .replace(/{clientName}/g, params.clientName)
        .replace(/{docNumber}/g, params.docNumber)
        .replace(/{docUrl}/g, params.docUrl)
        .replace(/{companyName}/g, params.companyName)
        .replace(/{expiryDate}/g, params.expiryDate || "");
    };

    return {
      subject: format(template.subject),
      body: format(template.body)
    };
  }
}

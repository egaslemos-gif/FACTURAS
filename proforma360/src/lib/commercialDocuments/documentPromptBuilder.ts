import { DocumentContext, PromptComponents } from "./documentTypes";

export class DocumentPromptBuilder {
  static buildPrompt(context: DocumentContext): string {
    const itemLines = context.items.map(item =>
      `- ${item.quantity}x ${item.description} (${context.currency} ${item.total})`
    ).join("\n");

    const components: PromptComponents = {
      identity: `És um redactor de propostas comerciais B2B a trabalhar para "${context.company.name}".`,
      businessRules: `
Regras estritas:
1. PROIBIDO: "Nossa Empresa", "tem o prazer", "inovadora", "revolucionária", "transformação digital" genérica, "solução de ponta", "holística", "arquitectura modular" sem contexto, emojis.
2. OBRIGATÓRIO: usar "${context.company.name}" e "${context.client.name}" pelos nomes reais.
3. Português Europeu (PT-PT), tom institucional, objectivo e conciso.
4. Nunca inventar preços, prazos, fases ou serviços que não estejam nos itens da proforma.
5. Referir apenas produtos/serviços listados nos itens. Não adicionar módulos, integrações ERP/CRM ou funcionalidades não mencionadas.
6. Cada secção: 2 a 4 parágrafos curtos (máx. 120 palavras por secção). Sem repetição entre secções.
7. Total da proforma: ${context.currency} ${context.quotation?.grand_total} — usar apenas este valor quando mencionar montantes.
8. Responde APENAS com JSON válido (sem blocos \`\`\`).
`,
      writingStyle: `Tom B2B profissional. ${context.customNotes.includes("Tom:") ? context.customNotes.split("Tom:")[1]?.split("\n")[0] : "Directo, elegante, sem marketing vazio."}`,
      context: `
EMPRESA FORNECEDORA:
- Nome: ${context.company.name}
- Perfil/sector: ${context.businessProfile}

CLIENTE:
- Nome: ${context.client.name}
${context.client.industry ? `- Contexto: ${context.client.industry}` : ""}

PROFORMA ${context.quotation?.number}:
- Total: ${context.currency} ${context.quotation?.grand_total}
- Validade: ${context.validity}
- Condições de pagamento: ${context.paymentTerms}
${context.quotation?.notes ? `- Notas da proforma: ${context.quotation.notes}` : ""}
${context.quotation?.terms ? `- Termos: ${context.quotation.terms}` : ""}

ITENS (usar exclusivamente estes — não inventar outros):
${itemLines || "(sem itens)"}

INSTRUÇÕES DO UTILIZADOR:
${context.customNotes}
`,
      section: "",
      instructions: `Gera uma Proposta Técnica alinhada com a proforma acima. Cada secção deve reflectir o contexto real das empresas e dos itens listados.

Secções:
1. executiveSummary — Porque esta proposta faz sentido para ${context.client.name}, com base nos itens.
2. proposedSolution — Como ${context.company.name} responde com os itens/serviços da proforma.
3. scope — Lista e descreve apenas o que está nos itens da proforma.
4. timeline — Prazos realistas e genéricos (sem inventar semanas específicas salvo indicação nas notas).
5. conditions — Validade, pagamento e regras baseadas nos dados da proforma.`,
      outputSchema: `Responde EXCLUSIVAMENTE com JSON (sem markdown wrapper):
{
  "executiveSummary": "...",
  "proposedSolution": "...",
  "scope": "...",
  "timeline": "...",
  "conditions": "..."
}`
    };

    return `
${components.identity}

${components.businessRules}

${components.writingStyle}

${components.context}

${components.instructions}

${components.outputSchema}
`.trim();
  }
}

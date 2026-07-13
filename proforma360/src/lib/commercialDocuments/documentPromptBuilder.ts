import { DocumentContext, PromptComponents } from "./documentTypes";

export class DocumentPromptBuilder {
  /**
   * Build a single prompt string based on the provided context and instructions.
   */
  static buildPrompt(context: DocumentContext): string {
    const components: PromptComponents = {
      identity: `És um especialista em vendas e redação de propostas comerciais (Proposal Manager) que trabalha para a empresa "${context.company.name}".`,
      businessRules: `
Regras Estritas de Redação (Style Guide):
1. **PROIBIDO** usar expressões como: "Nossa Empresa", "tem o prazer", "inovadora", "revolucionária", "desvendar", "transformar o futuro", "solução de ponta".
2. **OBRIGATÓRIO** usar o nome real da empresa: "${context.company.name}".
3. **OBRIGATÓRIO** usar Tom Institucional e Português Europeu (PT-PT).
4. Escreve frases objetivas e parágrafos curtos.
5. Sem marketing exagerado, sem adjetivos vazios, sem emojis e sem linguagem típica de IA.
6. Nunca inventes valores financeiros. Usa estritamente os dados dos itens fornecidos. O total é ${context.currency} ${context.quotation?.grand_total}.
7. Responde APENAS com o conteúdo do documento em formato Markdown (headings, bold, bullet points curtos).
`,
      writingStyle: `O idioma da proposta deve ser o Português de Portugal. ${context.customNotes.includes("Tom:") ? context.customNotes : "O tom deve ser B2B, corporativo, institucional, seco e altamente profissional."}`,
      context: `
DADOS DA EMPRESA:
- Nome: ${context.company.name}
- Perfil: ${context.businessProfile}

DADOS DO CLIENTE:
- Nome: ${context.client.name}

DADOS DA PROPOSTA (Proforma ${context.quotation?.number}):
- Total a pagar: ${context.currency} ${context.quotation?.grand_total}
- Validade: ${context.validity}
- Condições: ${context.paymentTerms}

ITENS INCLUÍDOS:
${context.items.map(item => `- ${item.quantity}x ${item.description}`).join('\n')}

INSTRUÇÕES DO UTILIZADOR:
${context.customNotes}
`,
      section: ``, // Em futuras versões isto indicaria a secção a gerar
      instructions: `Gera uma Proposta Técnica e Comercial completa dividida estritamente nas seguintes secções:
1. Resumo Executivo (executiveSummary): Foco nos benefícios para o cliente.
2. Solução Proposta (proposedSolution): Como os nossos itens resolvem o problema.
3. Escopo do Serviço (scope): Resumo dos itens listados.
4. Cronograma Estimado (timeline): Prazos ou próximos passos.
5. Condições Gerais (conditions): Validade, pagamentos e regras.`,
      outputSchema: `Responde EXCLUSIVAMENTE com um objeto JSON válido (sem blocos de código \`\`\`json) contendo estas chaves exatas:
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

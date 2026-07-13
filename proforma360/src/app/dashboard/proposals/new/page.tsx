"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuotationsStore, useCompanyStore, useClientsStore } from "@/stores";
import { ArrowLeft, Sparkles, FileDown, Loader2, Save, RefreshCw, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { PrintableProposal } from "@/components/commercial/PrintableProposal";
import { PrintableProposalMinimal } from "@/components/commercial/PrintableProposalMinimal";
import { PrintableProposalCorporate } from "@/components/commercial/PrintableProposalCorporate";
import type { ProposalTemplate } from "@/components/commercial/proposalTypes";

const SECTION_TITLES: Record<string, string> = {
  executiveSummary: "Resumo Executivo",
  proposedSolution: "Solução Proposta",
  scope: "Escopo do Serviço",
  timeline: "Cronograma Estimado",
  conditions: "Condições Gerais"
};

const TEMPLATES: Array<{ id: ProposalTemplate; name: string; description: string; accent: string }> = [
  { id: "executivo", name: "Executivo", description: "Cabeçalhos com números grandes, índice, cor teal", accent: "border-teal-600 bg-teal-50 ring-teal-600/20" },
  { id: "minimal", name: "Minimalista", description: "Limpo, leve, muito espaço branco, tipografia fina", accent: "border-slate-800 bg-slate-50 ring-slate-800/20" },
  { id: "corporate", name: "Corporativo", description: "Formal, tons azul/navy, badges e cartas de assinatura", accent: "border-blue-700 bg-blue-50 ring-blue-700/20" },
];

export default function NewProposalPage() {
  const searchParams = useSearchParams();
  const quotationId = searchParams.get("quotationId");
  const router = useRouter();

  const { currentDetail, fetchQuotationDetail, fetchCommercialProposal, saveCommercialProposal } = useQuotationsStore();
  const { company, fetchCompany } = useCompanyStore();
  const { clients, fetchClients } = useClientsStore();

  const [objective, setObjective] = useState("Proposta Técnica Comercial Padrão");
  const [audience, setAudience] = useState("Diretor Geral / Decisor");
  const [tone, setTone] = useState("Profissional, claro e persuasivo");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate>("executivo");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("draft");
  
  const [sections, setSections] = useState({
    executiveSummary: "",
    proposedSolution: "",
    scope: "",
    timeline: "",
    conditions: ""
  });

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    async function init() {
      fetchCompany();
      fetchClients();
      if (quotationId) {
        await fetchQuotationDetail(quotationId);
        const existing = await fetchCommercialProposal(quotationId);
        if (existing && existing.content) {
          try {
            const parsed = JSON.parse(existing.content);
            setSections(parsed);
            setStatus(existing.status);
          } catch(e) {
            console.error("Failed to parse existing proposal content", e);
          }
        }
      }
      setIsInitialLoading(false);
    }
    init();
  }, [quotationId]);

  if (!quotationId || isInitialLoading || !currentDetail) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-4 text-gray-600">A carregar contexto da proforma...</p>
      </div>
    );
  }

  const clientObj = clients.find(c => c.id === currentDetail.quotation.client_id);
  const clientName = clientObj?.name || "";
  const companyName = company?.name || "";
  const proformaNum = currentDetail.quotation.quotation_number || "";

  const handleExportPDF = () => {
    const originalTitle = document.title;
    const parts = [companyName, clientName, proformaNum].filter(Boolean);
    document.title = parts.join(" - ");
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1500);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/proposal/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          client: clientObj || null,
          quotation: currentDetail.quotation,
          items: currentDetail.items,
          objective,
          audience,
          tone,
          aiInstructions: extraInstructions,
        })
      });

      const data = await response.json();
      if (data.success) {
        try {
          const parsed = JSON.parse(data.content);
          setSections({
            executiveSummary: parsed.executiveSummary || "",
            proposedSolution: parsed.proposedSolution || "",
            scope: parsed.scope || "",
            timeline: parsed.timeline || "",
            conditions: parsed.conditions || ""
          });
          setStatus("generated");
          toast.success("Proposta gerada com sucesso!");
        } catch {
          toast.error("O modelo não devolveu um JSON válido. Tente novamente.");
        }
      } else {
        toast.error("Falha ao gerar proposta: " + data.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro interno ao comunicar com a IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCommercialProposal(
        quotationId, 
        `Proposta - ${currentDetail.quotation.quotation_number}`,
        JSON.stringify(sections),
        "edited"
      );
      setStatus("edited");
      toast.success("Proposta guardada com sucesso!");
    } catch {
      toast.error("Erro ao guardar proposta na base de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshData = async () => {
    toast.promise(fetchQuotationDetail(quotationId), {
      loading: 'A atualizar dados financeiros da Proforma...',
      success: 'Dados atualizados! O texto não foi afetado.',
      error: 'Erro ao atualizar dados.'
    });
  };

  const handleGenerateMock = () => {
    const execBlock = "A presente proposta visa responder às necessidades operacionais identificadas pelo cliente no âmbito da transformação digital da sua organização. Após uma análise detalhada dos processos existentes, identificámos oportunidades de melhoria que permitem ganhos significativos de eficiência, redução de custos operacionais e melhoria da experiência do utilizador final. A nossa equipa técnica realizou um levantamento exaustivo das infraestruturas actuais e propõe uma solução integrada que abrange todas as áreas críticas do negócio. Esta abordagem holística garante que todos os componentes funcionam de forma coerente, eliminando redundâncias e pontos de falha que hoje comprometem a produtividade da equipa.\n\n";
    const solBlock = "A solução proposta baseia-se numa arquitectura modular e escalável, desenhada para acompanhar o crescimento do cliente nos próximos 3 a 5 anos. Cada módulo pode ser implementado de forma independente, permitindo uma adopção gradual que minimiza a disrupção operacional. O sistema central integra-se nativamente com as ferramentas já utilizadas pela equipa, garantindo uma transição suave e sem perda de dados históricos. A camada de segurança implementa as melhores práticas da indústria, incluindo encriptação de ponta-a-ponta, autenticação multifactor e auditoria completa de todas as operações. Adicionalmente, o sistema inclui mecanismos de backup automático e recuperação de desastres que garantem a continuidade do negócio em qualquer cenário.\n\n";
    const scopeBlock = "O escopo do presente projecto abrange as seguintes áreas de intervenção: análise e levantamento de requisitos funcionais e não-funcionais; desenho da arquitectura técnica e definição dos componentes de software; desenvolvimento e configuração de todos os módulos identificados; migração de dados históricos dos sistemas legados para a nova plataforma; integração com sistemas de terceiros incluindo ERP, CRM e plataformas de comunicação; testes de aceitação do utilizador em ambiente de pré-produção; formação presencial e remota de todos os utilizadores finais; documentação técnica e manuais de operação; acompanhamento pós-implementação durante 90 dias; e suporte técnico continuado conforme os termos definidos nesta proposta.\n\n";
    const timeBlock = "O cronograma de implementação prevê um período total de 12 semanas, dividido em 4 fases distintas. A Fase 1 (semanas 1-3) contempla o levantamento detalhado de requisitos e o desenho da arquitectura. A Fase 2 (semanas 4-8) abrange o desenvolvimento e configuração de todos os módulos. A Fase 3 (semanas 9-10) inclui os testes de integração e aceitação do utilizador. A Fase 4 (semanas 11-12) corresponde ao go-live, formação e estabilização do sistema.\n\n";
    const condBlock = "A presente proposta é válida por 30 dias a contar da data de emissão. O pagamento será efectuado em 3 parcelas: 40% no início do projecto, 30% na conclusão da Fase 2, e 30% na aceitação final. Todos os valores apresentados incluem IVA à taxa legal em vigor. A garantia cobre defeitos de software durante 12 meses após a aceitação final. Alterações ao escopo definido nesta proposta serão objecto de análise e orçamentação separada. A propriedade intelectual do código desenvolvido especificamente para o cliente é transferida na totalidade após o pagamento integral.\n\n";

    setSections({
      executiveSummary: execBlock.repeat(8),
      proposedSolution: solBlock.repeat(12),
      scope: scopeBlock.repeat(10),
      timeline: timeBlock.repeat(6),
      conditions: condBlock.repeat(5)
    });
    setStatus("generated");
    toast.success("Mock Proposal gerado para Stress Test de PDF!");
  };

  const handleSectionChange = (key: string, value: string) => {
    setSections(prev => ({ ...prev, [key]: value }));
    setStatus("edited");
  };

  const hasContent = Object.values(sections).some(v => v.trim().length > 0);

  const proposalProps = {
    company,
    client: clientObj,
    quotation: currentDetail.quotation,
    items: currentDetail.items,
    sections,
  };

  return (
    <>
      <div className="max-w-7xl mx-auto pb-20 print:hidden">
        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/quotations/${quotationId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Proposal Studio</h1>
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded uppercase tracking-wider border">
                {status}
              </span>
            </div>
            <p className="text-sm text-gray-500">Proforma {proformaNum}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefreshData}
            title="Sincronizar Itens e Valores da Proforma"
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar Dados
          </button>
          <button 
            disabled={!hasContent || isSaving}
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium disabled:opacity-50 hover:bg-slate-800 transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
          <button 
            onClick={handleGenerateMock}
            className="flex items-center gap-2 px-3 py-2 bg-orange-100 border border-orange-300 text-orange-700 rounded-md text-sm font-bold hover:bg-orange-200 transition-colors"
          >
            Testar PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar / Configuration */}
        <div className="w-full lg:w-1/3 space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm print:hidden">
          
          {/* Template Selector */}
          <div>
            <h2 className="font-semibold text-gray-800 border-b pb-2 mb-4">Modelo da Proposta</h2>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`relative flex flex-col items-center p-3 border-2 rounded-lg text-center transition-all ${
                    selectedTemplate === t.id
                      ? `${t.accent} ring-2 ring-offset-1`
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {selectedTemplate === t.id && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`w-full h-16 rounded mb-2 border flex items-center justify-center text-xs font-bold ${
                    t.id === "executivo" ? "bg-teal-100 text-teal-800 border-teal-200" :
                    t.id === "minimal" ? "bg-white text-gray-600 border-gray-200" :
                    "bg-blue-100 text-blue-800 border-blue-200"
                  }`}>
                    {t.id === "executivo" && <span className="text-2xl opacity-30 mr-1">01</span>}
                    {t.id === "minimal" && <span className="text-lg tracking-widest">—</span>}
                    {t.id === "corporate" && <span className="text-sm">■ ■</span>}
                    <span className="ml-1 text-[10px] uppercase tracking-wider">{t.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 leading-tight">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Configuration */}
          <div>
            <h2 className="font-semibold text-gray-800 border-b pb-2 mb-4">Configuração da IA</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
                <input type="text" value={objective} onChange={(e)=>setObjective(e.target.value)} className="w-full p-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Público-alvo</label>
                <input type="text" value={audience} onChange={(e)=>setAudience(e.target.value)} className="w-full p-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tom</label>
                <input type="text" value={tone} onChange={(e)=>setTone(e.target.value)} className="w-full p-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instruções adicionais</label>
                <textarea 
                  value={extraInstructions} 
                  onChange={(e)=>setExtraInstructions(e.target.value)} 
                  rows={3}
                  className="w-full p-2 border rounded-md text-sm" 
                  placeholder="Ex: Dar ênfase à garantia estendida e suporte premium 24/7."
                />
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 mt-2"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isGenerating ? "A gerar secções..." : (hasContent ? "Regenerar Tudo" : "Gerar com IA")}
              </button>
            </div>
          </div>
        </div>

        {/* Editor / Live Preview */}
        <div className="w-full lg:w-2/3 flex flex-col bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden min-h-[600px] print:w-full print:border-none print:shadow-none">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center print:hidden">
            <div>
              <h2 className="font-semibold text-gray-800">Editor Estruturado</h2>
              <p className="text-xs text-gray-400 mt-0.5">Modelo: <strong className="text-gray-600">{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</strong></p>
            </div>
            <button 
              disabled={!hasContent} 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-green-700 transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4" /> Exportar PDF
            </button>
          </div>
          
          <div className="flex-1 p-6 bg-gray-50 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
            {!hasContent ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                <p>Preencha a configuração e gere a proposta.</p>
              </div>
            ) : (
              <div className="space-y-6 print:space-y-6">
                {Object.entries(sections).map(([key, value]) => (
                  <div key={key} className="bg-white border border-gray-200 rounded-md print:border-none">
                    <div className="px-4 py-2 border-b bg-slate-50 font-semibold text-gray-700 text-sm print:bg-transparent print:border-b-2 print:border-gray-800 print:text-lg print:p-0 print:mb-2">
                      {SECTION_TITLES[key] || key}
                    </div>
                    <textarea 
                      className="w-full min-h-[150px] p-4 bg-white font-serif text-gray-800 text-base resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-b-md print:border-none print:resize-none print:p-0 print:min-h-0 print:overflow-visible block"
                      value={value}
                      onChange={(e) => handleSectionChange(key, e.target.value)}
                    />
                  </div>
                ))}

                <div className="bg-white border border-gray-200 rounded-md print:border-none print:pt-4">
                  <div className="px-4 py-2 border-b bg-slate-50 font-semibold text-gray-700 text-sm print:bg-transparent print:border-b-2 print:border-gray-800 print:text-lg print:p-0 print:mb-4">
                    Grelha Financeira (Imutável)
                  </div>
                  <div className="p-4 print:p-0">
                    <table className="w-full text-sm mb-4 print:text-base">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-semibold">Item</th>
                          <th className="text-right py-2 font-semibold">Qtd</th>
                          <th className="text-right py-2 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDetail.items.map(item => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2">{item.description}</td>
                            <td className="text-right py-2">{item.quantity}</td>
                            <td className="text-right py-2">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                          <span>Total a Pagar:</span>
                          <span>{formatCurrency(currentDetail.quotation.grand_total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Printable Templates — only the selected one renders */}
      {selectedTemplate === "executivo" && <PrintableProposal {...proposalProps} />}
      {selectedTemplate === "minimal" && <PrintableProposalMinimal {...proposalProps} />}
      {selectedTemplate === "corporate" && <PrintableProposalCorporate {...proposalProps} />}
    </>
  );
}

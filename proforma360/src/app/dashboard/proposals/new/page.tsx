"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuotationsStore, useCompanyStore, useClientsStore } from "@/stores";
import { ArrowLeft, Sparkles, FileDown, Loader2, Save, RefreshCw, Check, Eye, EyeOff, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { PrintableProposal } from "@/components/commercial/PrintableProposal";
import { PrintableProposalMinimal } from "@/components/commercial/PrintableProposalMinimal";
import { PrintableProposalCorporate } from "@/components/commercial/PrintableProposalCorporate";
import type { ProposalTemplate, SectionVisibility, CustomProposalSection } from "@/components/commercial/proposalTypes";
import { DEFAULT_VISIBILITY, parseSavedProposal, serializeProposal, resolveVisibility, normalizeCustomSections } from "@/components/commercial/proposalTypes";
import {
  BUILTIN_SECTION_DEFS,
  createCustomSection,
  proposalHasContent,
} from "@/components/commercial/proposalContent";


const TEMPLATES: Array<{
  id: ProposalTemplate;
  name: string;
  description: string;
  tagline: string;
  palette: { ring: string; bg: string; accent: string; text: string };
}> = [
  {
    id: "executivo",
    name: "Executivo",
    description: "Índice numerado, secções teal e hierarquia clara",
    tagline: "Consultoria · Estruturado",
    palette: { ring: "ring-teal-500", bg: "from-teal-50 via-white to-emerald-50/40", accent: "bg-teal-600", text: "text-teal-900" },
  },
  {
    id: "minimal",
    name: "Minimalista",
    description: "Capa centrada, índice leve e tipografia editorial",
    tagline: "Editorial · Limpo",
    palette: { ring: "ring-slate-600", bg: "from-slate-50 via-white to-zinc-50", accent: "bg-slate-800", text: "text-slate-800" },
  },
  {
    id: "corporate",
    name: "Corporativo",
    description: "Navy e dourado, badges, cartões e formalidade",
    tagline: "Institucional · Premium",
    palette: { ring: "ring-blue-700", bg: "from-blue-50 via-white to-amber-50/50", accent: "bg-gradient-to-r from-blue-900 to-blue-700", text: "text-blue-950" },
  },
];

function TemplatePreview({ id }: { id: ProposalTemplate }) {
  if (id === "executivo") {
    return (
      <div className="w-full h-full p-1 flex flex-col gap-0.5 bg-white rounded border border-teal-100 overflow-hidden">
        <div className="h-1 w-5 bg-teal-600 rounded-sm" />
        <div className="flex-1 space-y-0.5">
          <div className="flex gap-0.5 items-center"><span className="text-[6px] font-bold text-teal-700">01</span><span className="h-0.5 flex-1 bg-teal-100 rounded" /></div>
          <div className="flex gap-0.5 items-center"><span className="text-[6px] font-bold text-teal-700">02</span><span className="h-0.5 flex-1 bg-slate-100 rounded" /></div>
        </div>
      </div>
    );
  }
  if (id === "minimal") {
    return (
      <div className="w-full h-full p-1 flex flex-col items-center justify-center gap-0.5 bg-white rounded border border-slate-200 overflow-hidden">
        <div className="h-0.5 w-4 bg-slate-300 rounded-full" />
        <div className="h-1.5 w-7 bg-slate-800/80 rounded-sm" />
        <div className="h-px w-3 bg-slate-400" />
      </div>
    );
  }
  return (
    <div className="w-full h-full p-1 flex flex-col gap-0.5 bg-white rounded border border-blue-200 overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-900 to-blue-600 rounded-sm" />
      <div className="flex gap-0.5 flex-1">
        <div className="w-2.5 h-full bg-amber-400/70 rounded-sm shrink-0" />
        <div className="flex-1 space-y-0.5 pt-0.5">
          <div className="h-1 w-5 bg-blue-900/80 rounded" />
          <div className="h-0.5 w-full bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

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
  const [visibility, setVisibility] = useState<SectionVisibility>(DEFAULT_VISIBILITY);

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
  const [customSections, setCustomSections] = useState<CustomProposalSection[]>([]);

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
            const saved = parseSavedProposal(existing.content);
            setSections({
              executiveSummary: saved.sections.executiveSummary || "",
              proposedSolution: saved.sections.proposedSolution || "",
              scope: saved.sections.scope || "",
              timeline: saved.sections.timeline || "",
              conditions: saved.sections.conditions || "",
            });
            setCustomSections(normalizeCustomSections(saved.customSections));
            setVisibility(resolveVisibility(saved.visibility));
            if (saved.template) setSelectedTemplate(saved.template);
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
        serializeProposal({ sections, customSections, visibility, template: selectedTemplate }),
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

  const handleSectionChange = (key: string, value: string) => {
    setSections(prev => ({ ...prev, [key]: value }));
    setStatus("edited");
  };

  const toggleVisibility = (key: keyof SectionVisibility) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
    setStatus("edited");
  };

  const addCustomSection = () => {
    setCustomSections(prev => [...prev, createCustomSection()]);
    setStatus("edited");
  };

  const updateCustomSection = (id: string, patch: Partial<CustomProposalSection>) => {
    setCustomSections(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
    setStatus("edited");
  };

  const removeCustomSection = (id: string) => {
    setCustomSections(prev => prev.filter(s => s.id !== id));
    setStatus("edited");
  };

  const moveCustomSection = (id: string, direction: -1 | 1) => {
    setCustomSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const next = idx + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
    setStatus("edited");
  };

  const hasContent = proposalHasContent(sections, customSections);

  const proposalProps = {
    company,
    client: clientObj,
    quotation: currentDetail.quotation,
    items: currentDetail.items,
    sections,
    customSections,
    visibility,
  };

  return (
    <>
      <div className="max-w-7xl mx-auto pb-24 md:pb-20 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleRefreshData}
            title="Sincronizar Itens e Valores da Proforma"
            className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar Dados
          </button>
          <button 
            disabled={!hasContent || isSaving}
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-slate-900 text-white rounded-md text-sm font-medium disabled:opacity-50 hover:bg-slate-800 transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar / Configuration */}
        <div className="w-full lg:w-1/3 space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm print:hidden">
          
          {/* Template Selector */}
          <div>
            <h2 className="font-semibold text-gray-800 border-b pb-2 mb-3 text-sm">Modelo da Proposta</h2>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setSelectedTemplate(t.id); setStatus("edited"); }}
                  className={`relative flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-lg border transition-all text-center min-h-[44px] ${
                    selectedTemplate === t.id
                      ? `border-transparent bg-gradient-to-br ${t.palette.bg} ${t.palette.ring} ring-1 ring-offset-1 shadow-sm`
                      : "border-gray-200 bg-white hover:border-gray-300 active:bg-gray-50"
                  }`}
                >
                  <div className="w-full h-10 sm:h-11 rounded-md border border-white/80 overflow-hidden shadow-sm">
                    <TemplatePreview id={t.id} />
                  </div>
                  <div className="w-full min-w-0">
                    <div className="flex items-center justify-center gap-0.5">
                      <span className={`font-semibold text-[10px] sm:text-[11px] leading-tight ${selectedTemplate === t.id ? t.palette.text : "text-gray-900"}`}>{t.name}</span>
                      {selectedTemplate === t.id && <Check className="w-2.5 h-2.5 text-green-600 shrink-0" />}
                    </div>
                    <p className="text-[8px] sm:text-[9px] text-gray-500 leading-tight mt-0.5 line-clamp-2 hidden sm:block">{t.description}</p>
                  </div>
                  {selectedTemplate === t.id && (
                    <div className={`absolute left-0 top-1 bottom-1 w-0.5 rounded-full ${t.palette.accent}`} />
                  )}
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
          <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 print:hidden">
            <div>
              <h2 className="font-semibold text-gray-800">Editor Estruturado</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Modelo: <strong className="text-gray-600">{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</strong>
                {" · "}Use o ícone de olho em cada bloco para controlar o PDF
              </p>
            </div>
            <button 
              disabled={!hasContent} 
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] w-full sm:w-auto bg-green-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-green-700 transition-colors shadow-sm"
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
                {BUILTIN_SECTION_DEFS.map(({ key, visKey, title }) => {
                  const value = sections[key] || "";
                  const isVisible = visibility[visKey];
                  return (
                  <div key={key} className={`bg-white border rounded-lg overflow-hidden transition-all ${isVisible ? "border-gray-200" : "border-dashed border-gray-200 opacity-75"}`}>
                    <div className="px-4 py-2.5 border-b bg-slate-50 font-semibold text-gray-700 text-sm print:bg-transparent print:border-b-2 print:border-gray-800 print:text-lg print:p-0 print:mb-2 flex items-center justify-between gap-2">
                      <span>{title}</span>
                      <button
                        type="button"
                        onClick={() => toggleVisibility(visKey)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                          isVisible ? "text-teal-700 bg-teal-50 hover:bg-teal-100" : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                        }`}
                        title={isVisible ? "Ocultar no PDF" : "Mostrar no PDF"}
                      >
                        {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {isVisible ? "No PDF" : "Oculto"}
                      </button>
                    </div>
                    <textarea 
                      className="w-full min-h-[120px] md:min-h-[150px] p-4 bg-white font-serif text-gray-800 text-base resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-b-lg print:border-none print:resize-none print:p-0 print:min-h-0 print:overflow-visible block"
                      value={value}
                      onChange={(e) => handleSectionChange(key, e.target.value)}
                    />
                  </div>
                );})}

                {/* Secções personalizadas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">Secções Personalizadas</h3>
                      <p className="text-[11px] text-gray-400">Blocos extra com título e conteúdo à sua medida</p>
                    </div>
                    <button
                      type="button"
                      onClick={addCustomSection}
                      className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 rounded-md transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>

                  {customSections.length === 0 && (
                    <p className="text-xs text-gray-400 italic px-1">Nenhuma secção personalizada. Clique em Adicionar para criar uma.</p>
                  )}

                  {customSections.map((block, index) => (
                    <div
                      key={block.id}
                      className={`bg-white border rounded-lg overflow-hidden transition-all ${block.visible ? "border-indigo-200" : "border-dashed border-gray-200 opacity-75"}`}
                    >
                      <div className="px-4 py-2.5 border-b bg-indigo-50/60 flex items-center gap-2">
                        <input
                          type="text"
                          value={block.title}
                          onChange={(e) => updateCustomSection(block.id, { title: e.target.value })}
                          placeholder="Título da secção"
                          className="flex-1 min-w-0 bg-transparent border-none outline-none font-semibold text-gray-800 text-sm focus:ring-0"
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-500 shrink-0">Personalizada</span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveCustomSection(block.id, -1)}
                            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-30"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={index === customSections.length - 1}
                            onClick={() => moveCustomSection(block.id, 1)}
                            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-30"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCustomSection(block.id, { visible: !block.visible })}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                              block.visible ? "text-teal-700 bg-teal-50 hover:bg-teal-100" : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            {block.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCustomSection(block.id)}
                            className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
                            title="Remover secção"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="w-full min-h-[100px] p-4 bg-white font-serif text-gray-800 text-base resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-b-lg block"
                        value={block.content}
                        onChange={(e) => updateCustomSection(block.id, { content: e.target.value })}
                        placeholder="Escreva o conteúdo desta secção..."
                      />
                    </div>
                  ))}
                </div>

                {/* Condições Gerais */}
                <div className={`bg-white border rounded-lg overflow-hidden transition-all ${visibility.conditions ? "border-gray-200" : "border-dashed border-gray-200 opacity-75"}`}>
                  <div className="px-4 py-2.5 border-b bg-slate-50 font-semibold text-gray-700 text-sm flex items-center justify-between gap-2">
                    <span>Condições Gerais</span>
                    <button
                      type="button"
                      onClick={() => toggleVisibility("conditions")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                        visibility.conditions ? "text-teal-700 bg-teal-50 hover:bg-teal-100" : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {visibility.conditions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {visibility.conditions ? "No PDF" : "Oculto"}
                    </button>
                  </div>
                  <textarea
                    className="w-full min-h-[120px] p-4 bg-white font-serif text-gray-800 text-base resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-b-lg block"
                    value={sections.conditions}
                    onChange={(e) => handleSectionChange("conditions", e.target.value)}
                  />
                </div>

                <div className={`bg-white border rounded-lg overflow-hidden ${visibility.financialTable ? "border-gray-200" : "border-dashed border-gray-200 opacity-75"}`}>
                  <div className="px-4 py-2.5 border-b bg-slate-50 font-semibold text-gray-700 text-sm print:bg-transparent print:border-b-2 print:border-gray-800 print:text-lg print:p-0 print:mb-4 flex items-center justify-between gap-2">
                    <span>Grelha Financeira (Imutável)</span>
                    <button
                      type="button"
                      onClick={() => toggleVisibility("financialTable")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                        visibility.financialTable ? "text-teal-700 bg-teal-50 hover:bg-teal-100" : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {visibility.financialTable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {visibility.financialTable ? "No PDF" : "Oculto"}
                    </button>
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

                {[
                  { key: "toc" as const, label: "Índice", hint: "Página de índice automática (activo por defeito)" },
                  { key: "signatures" as const, label: "Página de Aceitação", hint: "Assinaturas do fornecedor e cliente" },
                ].map(({ key, label, hint }) => (
                  <div key={key} className={`bg-white border rounded-lg overflow-hidden ${visibility[key] ? "border-gray-200" : "border-dashed border-gray-200 opacity-75"}`}>
                    <div className="px-4 py-2.5 border-b bg-slate-50 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-gray-700 text-sm">{label}</span>
                        <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleVisibility(key)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                          visibility[key]
                            ? "text-teal-700 bg-teal-50 hover:bg-teal-100"
                            : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {visibility[key] ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {visibility[key] ? "No PDF" : "Oculto"}
                      </button>
                    </div>
                    <div className="p-4 text-sm text-gray-500 italic">Bloco automático — não editável.</div>
                  </div>
                ))}
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

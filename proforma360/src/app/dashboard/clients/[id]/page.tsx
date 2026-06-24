"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useClientsStore, useQuotationsStore, useInteractionsStore, useCompanyStore } from "@/stores";
import { InteractionType, INTERACTION_TYPES, QuotationHistory } from "@/lib/types";
import { 
  ArrowLeft, 
  Edit2, 
  FileText, 
  Plus, 
  User, 
  Calendar, 
  Activity, 
  Tag, 
  Link as LinkIcon, 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  Send,
  Sparkles,
  ChevronDown,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate, formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { quotationsRepo } from "@/lib/db";
import { buildClientTimeline } from "@/lib/crm/clientTimeline";
import { WhatsAppActions, WHATSAPP_TEMPLATES } from "@/lib/communication/whatsappActions";
import { EmailActions, EMAIL_TEMPLATES } from "@/lib/communication/emailActions";
import { SeverityEngine } from "@/lib/pipeline/severityEngine";
import { ActivityTimeline } from "@/components/timeline/ActivityTimeline";
import { RelationshipScore } from "@/lib/crm/relationshipScore";
import { getFollowupSuggestions } from "@/lib/pipeline/followupSuggestions";
import { NotesEngine } from "@/lib/crm/notesEngine";
import { ActionEngine } from "@/lib/pipeline/actionEngine";
import { CalendarSyncOrchestrator } from "@/lib/sync/calendarSync";

export default function ClientDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { clients, fetchClients, isLoading: isClientsLoading } = useClientsStore();
  const { quotations, fetchQuotations, isLoading: isQuotationsLoading } = useQuotationsStore();
  const { company, fetchCompany } = useCompanyStore();
  
  const [activeTab, setActiveTab] = useState<"overview" | "quotations" | "crm">("overview");
  const { interactions, fetchByClient, addInteraction } = useInteractionsStore();
  const [interactionType, setInteractionType] = useState<InteractionType>("note");
  const [interactionTitle, setInteractionTitle] = useState("");
  const [interactionDesc, setInteractionDesc] = useState("");
  const [quotationHistory, setQuotationHistory] = useState<(QuotationHistory & { quotation_number?: string })[]>([]);
  
  // Custom templates & suggests state
  const [whatsappTemplateOpen, setWhatsappTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(WHATSAPP_TEMPLATES[0].id);
  const [snoozeMenuOpen, setSnoozeMenuOpen] = useState<string | null>(null);
  const [engageMetrics, setEngageMetrics] = useState<any>(null);
  const [emailTemplateOpen, setEmailTemplateOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setWhatsappTemplateOpen(false);
        setEmailTemplateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchClients();
    fetchQuotations();
    fetchCompany();
    if (id) {
      fetchByClient(id);
      
      // Fetch quotation history for this client's deals
      (async () => {
        try {
          const allQ = await quotationsRepo.getAll();
          const clientQs = allQ.filter((q: any) => q.client_id === id);
          const allHistory: (QuotationHistory & { quotation_number?: string })[] = [];
          for (const q of clientQs) {
            const detail = await quotationsRepo.getById(q.id);
            if (detail) {
              detail.history.forEach((h) => {
                allHistory.push({ ...h, quotation_number: q.quotation_number });
              });
            }
          }
          setQuotationHistory(allHistory);
        } catch(e) { console.error(e); }
      })();
    }
  }, [fetchClients, fetchQuotations, fetchCompany, fetchByClient, id]);

  const client = clients.find((c) => c.id === id);
  const clientQuotations = useMemo(() => quotations.filter((q) => q.client_id === id), [quotations, id]);

  // CRM Analytics & Scoring
  const relationshipMetrics = useMemo(() => {
    if (!client) return null;
    return RelationshipScore.getMetrics(client, clientQuotations);
  }, [client, clientQuotations]);

  const stats = useMemo(() => {
    const totalQuotations = clientQuotations.length;
    const totalValue = clientQuotations.reduce((sum, q) => sum + q.grand_total, 0);
    
    // Sort by date descending
    const sorted = [...clientQuotations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastQuotationDate = sorted.length > 0 ? sorted[0].date : null;
    
    const lastActivity = lastQuotationDate ? Math.max(new Date(lastQuotationDate).getTime(), new Date(client?.updated_at || 0).getTime()) : new Date(client?.updated_at || 0).getTime();

    return { totalQuotations, totalValue, lastQuotationDate, lastActivity: new Date(lastActivity).toISOString() };
  }, [clientQuotations, client]);

  // Smart suggestions from most recent proposal requiring attention
  const activeSuggestions = useMemo(() => {
    const activeQ = clientQuotations.find(q => q.pipeline_stage !== "won" && q.pipeline_stage !== "lost");
    if (!activeQ) return [];
    return getFollowupSuggestions(activeQ);
  }, [clientQuotations]);

  const activeQuotationForAction = useMemo(() => {
    return clientQuotations.find(q => q.pipeline_stage !== "won" && q.pipeline_stage !== "lost") || null;
  }, [clientQuotations]);

  useEffect(() => {
    async function loadEngage() {
      if (activeQuotationForAction) {
        const { EngagementTracker } = await import("@/lib/engagement/engagementTracker");
        const m = await EngagementTracker.getMetrics(activeQuotationForAction);
        setEngageMetrics(m);
      } else {
        setEngageMetrics(null);
      }
    }
    loadEngage();
  }, [activeQuotationForAction]);

  // Timeline events assembly
  const timelineEvents = useMemo(() => {
    return buildClientTimeline(interactions, clientQuotations, quotationHistory);
  }, [interactions, clientQuotations, quotationHistory]);

  // Automatic tagging suggestion based on typed note
  useEffect(() => {
    if (interactionDesc.trim().length > 5) {
      const suggestedTags = NotesEngine.extractTags(interactionDesc);
      if (suggestedTags.length > 0 && client) {
        // Expose suggestions without directly writing yet, or suggest tags in UI
      }
    }
  }, [interactionDesc, client]);

  if (isClientsLoading && !client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="w-full max-w-7xl mx-auto animate-fade-in pb-20 text-center py-12">
        <h2 className="text-xl font-bold mb-2">Cliente não encontrado</h2>
        <Link href="/dashboard/clients" className="text-teal-600 hover:underline">Voltar para a lista</Link>
      </div>
    );
  }

  // Quick Action Handlers
  const handleSnooze = async (quotationId: string, preset: "30m" | "tomorrow_9h" | "end_of_day" | "next_monday" | "next_week") => {
    await ActionEngine.snoozeAction(quotationId, preset);
    await CalendarSyncOrchestrator.syncQuotationAction(quotationId);
    setSnoozeMenuOpen(null);
    fetchQuotations();
    if (id) fetchByClient(id);
  };

  const handleCompleteTask = async (quotationId: string) => {
    await ActionEngine.completeAction(quotationId);
    await CalendarSyncOrchestrator.syncQuotationAction(quotationId);
    fetchQuotations();
    if (id) fetchByClient(id);
  };

  // WhatsApp communication launcher
  const launchWhatsApp = (templateId: string) => {
    if (!client.phone) return;
    const template = WHATSAPP_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const doc = activeQuotationForAction || { quotation_number: "n/a", expiry_date: "", id: "" };
    const docUrl = doc.id ? `${window.location.origin}/view/${doc.id}` : "";

    const message = WhatsAppActions.formatMessage(template.text, {
      clientName: client.name,
      docNumber: doc.quotation_number,
      docUrl,
      companyName: company?.name || "Nossa Empresa",
      expiryDate: doc.expiry_date
    });

    const url = WhatsAppActions.getClickToChatUrl(client.phone, message);
    window.open(url, "_blank");
    setWhatsappTemplateOpen(false);
  };

  const launchEmail = (templateId: string) => {
    if (!client.email) return;
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const doc = activeQuotationForAction || { quotation_number: "n/a", expiry_date: "", id: "" };
    const docUrl = doc.id ? `${window.location.origin}/view/${doc.id}` : "";

    const { subject, body } = EmailActions.formatTemplate(template, {
      clientName: client.name,
      docNumber: doc.quotation_number,
      docUrl,
      companyName: company?.name || "Nossa Empresa",
      expiryDate: doc.expiry_date ? formatDate(doc.expiry_date) : ""
    });

    const mailtoUrl = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open synchronously to preserve the trusted user gesture (prevents blocking)
    window.location.href = mailtoUrl;

    // Background clipboard copy
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(`Assunto: ${subject}\n\n${body}`)
        .then(() => toast.success("Assunto e corpo do email copiados!"))
        .catch(err => console.warn("Failed to copy email text", err));
    } else {
      console.warn("Clipboard API not available or not secure context");
    }

    setEmailTemplateOpen(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in pb-12">
      
      {/* Header and Back Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">{client.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider", 
                client.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                client.status === "new" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-700"
              )}>
                {client.status === "active" ? "Ativo" : client.status === "new" ? "Novo" : "Inativo"}
              </span>
              {relationshipMetrics && (
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold border", relationshipMetrics.tierColor)}>
                  Cliente {relationshipMetrics.tier}
                </span>
              )}
              {client.tax_number && (
                <span className="text-xs text-slate-500 font-medium ml-2">NUIT: {client.tax_number}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 self-start md:self-center">
          <Link
            href={`/dashboard/quotations/new?client_id=${client.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Nova Proforma
          </Link>
          <Link
            href={`/dashboard/clients/${client.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition-colors"
          >
            <Edit2 className="w-4 h-4" /> Editar
          </Link>
        </div>
      </div>

      {/* QUICK COMMUNICATION HUB COMPANION */}
      <div className="bg-teal-50 border border-teal-100 text-teal-900 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-teal-800">Companion de Comunicação</span>
        </div>
        <div ref={dropdownRef} className="flex flex-wrap gap-2">
          {client.phone && (
            <>
              <a 
                href={`tel:${client.phone}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-lg transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Ligar
              </a>
              
              {/* WhatsApp Quick Templates */}
              <div className="relative">
                <button 
                  onClick={() => setWhatsappTemplateOpen(!whatsappTemplateOpen)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp <ChevronDown className="w-3 h-3" />
                </button>
                
                {whatsappTemplateOpen && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-100 text-slate-800 max-h-[60vh] overflow-y-auto">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-1.5">Escolher Template Quick-Chat</p>
                    {WHATSAPP_TEMPLATES.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => launchWhatsApp(t.id)}
                        className="w-full text-left px-3 py-2.5 text-xs hover:bg-slate-50 font-bold block"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {client.email && (
            <div className="relative">
              <button 
                onClick={() => setEmailTemplateOpen(!emailTemplateOpen)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-lg transition-colors"
              >
                <Mail className="w-3.5 h-3.5" /> Email <ChevronDown className="w-3 h-3" />
              </button>
              
              {emailTemplateOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-100 text-slate-800 max-h-[60vh] overflow-y-auto">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-1.5">Escolher Template de Email</p>
                  {EMAIL_TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => launchEmail(t.id)}
                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-slate-50 font-bold block"
                    >
                      {t.name}
                    </button>
                  ))}
                  <a 
                    href={`mailto:${client.email}`}
                    onClick={() => setEmailTemplateOpen(false)}
                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-slate-50 font-bold block text-teal-600 border-t border-slate-100"
                  >
                    Enviar Email em Branco (mailto)
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SMART FOLLOW-UP SUGGESTIONS BAR */}
      {activeSuggestions.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-teal-800">Sugestões do Assistente CRM</p>
              <p className="text-xs text-teal-700 mt-0.5">Ações recomendadas com base na inatividade comercial.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeSuggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => {
                  if (sug.actionKey === "whatsapp_nudge") {
                    setWhatsappTemplateOpen(true);
                  } else if (sug.actionKey === "reschedule_action" && activeQuotationForAction) {
                    setSnoozeMenuOpen(activeQuotationForAction.id);
                  } else if (sug.actionKey === "call_client" && client.phone) {
                    window.open(`tel:${client.phone}`);
                  } else {
                    // Default fallback
                    setActiveTab("crm");
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-200 hover:border-teal-300 text-teal-800 text-xs font-black rounded-lg transition-all hover:scale-[1.02] shadow-sm"
              >
                <span>{sug.icon}</span> {sug.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn("px-6 py-3 font-bold text-sm transition-colors border-b-2", activeTab === "overview" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800")}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab("quotations")}
          className={cn("px-6 py-3 font-bold text-sm transition-colors border-b-2 flex items-center gap-2", activeTab === "quotations" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800")}
        >
          Proformas
          <span className="bg-slate-100 text-xs py-0.5 px-2 rounded-full text-slate-600 font-black">{clientQuotations.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("crm")}
          className={cn("px-6 py-3 font-bold text-sm transition-colors border-b-2 flex items-center gap-2", activeTab === "crm" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800")}
        >
          <MessageCircle className="w-4 h-4" />
          Timeline & CRM
          <span className="bg-slate-100 text-xs py-0.5 px-2 rounded-full text-slate-600 font-black">{timelineEvents.length}</span>
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Analytical Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Total de Proformas</h3>
              <p className="text-2xl font-bold text-slate-800 truncate" title={String(stats.totalQuotations)}>{stats.totalQuotations}</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Valor de Negociação</h3>
              <p className="text-2xl font-bold text-slate-800 truncate" title={formatCurrency(stats.totalValue)}>{formatCurrency(stats.totalValue)}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Lifetime Value (LTV)</h3>
              <p className="text-2xl font-bold text-emerald-600 truncate" title={relationshipMetrics ? formatCurrency(relationshipMetrics.ltv) : "0,00 MTn"}>
                {relationshipMetrics ? formatCurrency(relationshipMetrics.ltv) : "0,00 MTn"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Última Atividade</h3>
              <p className="text-sm font-bold text-slate-700 mt-2 truncate" title={formatDate(stats.lastActivity)}>{formatDate(stats.lastActivity)}</p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            
            {/* Contact Details Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Informações de Contacto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                    <p className="text-sm font-medium text-slate-800">{client.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Telefone</p>
                    <p className="text-sm font-medium text-slate-800">{client.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Endereço</p>
                    <p className="text-sm font-medium text-slate-800">{client.address || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inactivity warnings & engagement scores */}
            {activeQuotationForAction && engageMetrics && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Comportamento Comercial</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Visualizações Proforma</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{engageMetrics.viewsCount}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Downloads de PDF</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{engageMetrics.downloadsCount}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-center col-span-2 md:col-span-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Estado Geral</p>
                    <p className="text-xs font-black text-teal-700 mt-2 uppercase tracking-wide">{engageMetrics.statusLabel}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            
            {/* Tags Box */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Segmentação / Tags</h2>
              {client.tags && client.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {client.tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-xs font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-semibold">Nenhuma tag ou segmento associado.</p>
              )}
            </div>

            {/* Internal Notes Box */}
            {client.notes && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Notas Profiling</h2>
                <p className="text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap leading-relaxed">
                  {client.notes}
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {activeTab === "quotations" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto w-full">
          {clientQuotations.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold mb-1">Sem proformas</h3>
              <p className="text-xs text-slate-400 mb-4 font-semibold">Este cliente ainda não tem proformas associadas.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Número</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {clientQuotations.map(q => {
                  const severity = SeverityEngine.calculateSeverity(q);
                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-bold">
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/quotations/${q.id}`} className="text-teal-600 hover:underline">
                            {q.quotation_number}
                          </Link>
                          <span
                            className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide text-white"
                            style={{ backgroundColor: severity.color }}
                            title={severity.reasons.join("\n")}
                          >
                            {severity.state}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{formatDate(q.date)}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide",
                          q.status === 'approved' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          q.status === 'rejected' ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          q.status === 'sent' ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          "bg-gray-100 text-gray-700"
                        )}>{q.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(q.grand_total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "crm" && (
        <div className="space-y-6">
          {/* Add Interaction Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Registar Interação</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {INTERACTION_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setInteractionType(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                    interactionType === t.key
                      ? "border-teal-600 bg-teal-50 text-teal-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={interactionTitle}
              onChange={(e) => setInteractionTitle(e.target.value)}
              placeholder="Título (ex: Reunião comercial sobre preços)"
              className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-2 font-semibold"
            />
            <textarea
              value={interactionDesc}
              onChange={(e) => setInteractionDesc(e.target.value)}
              placeholder="Detalhes adicionais..."
              className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none h-20 mb-3 font-medium"
            />
            <button
              onClick={async () => {
                if (!interactionTitle.trim()) return;
                await addInteraction(id, interactionType, interactionTitle.trim(), interactionDesc.trim() || null);
                setInteractionTitle("");
                setInteractionDesc("");
                fetchByClient(id);
              }}
              disabled={!interactionTitle.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" /> Registar
            </button>
          </div>

          {/* Chronological Unified timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Atividade Cronológica Viva</h3>
            <ActivityTimeline clientId={id} />
          </div>

        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useClientsStore, useQuotationsStore, useInteractionsStore } from "@/stores";
import { InteractionType, INTERACTION_TYPES, QuotationHistory } from "@/lib/types";
import { ArrowLeft, Edit2, FileText, Plus, User, Calendar, Activity, Tag, Link as LinkIcon, Phone, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { cn, formatDate, formatCurrency, formatDateTime } from "@/lib/utils";
import { quotationsRepo } from "@/lib/db";

export default function ClientDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { clients, fetchClients, isLoading: isClientsLoading } = useClientsStore();
  const { quotations, fetchQuotations, isLoading: isQuotationsLoading } = useQuotationsStore();
  
  const [activeTab, setActiveTab] = useState<"overview" | "quotations" | "crm">("overview");
  const { interactions, fetchByClient, addInteraction } = useInteractionsStore();
  const [interactionType, setInteractionType] = useState<InteractionType>("note");
  const [interactionTitle, setInteractionTitle] = useState("");
  const [interactionDesc, setInteractionDesc] = useState("");
  const [quotationHistory, setQuotationHistory] = useState<(QuotationHistory & { quotation_number?: string })[]>([]);

  useEffect(() => {
    fetchClients();
    fetchQuotations();
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
  }, [fetchClients, fetchQuotations, fetchByClient, id]);

  const client = clients.find((c) => c.id === id);
  const clientQuotations = useMemo(() => quotations.filter((q) => q.client_id === id), [quotations, id]);

  const stats = useMemo(() => {
    const totalQuotations = clientQuotations.length;
    const totalValue = clientQuotations.reduce((sum, q) => sum + q.grand_total, 0);
    
    // Sort by date descending
    const sorted = [...clientQuotations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastQuotationDate = sorted.length > 0 ? sorted[0].date : null;
    
    // "Last activity" could be the updated_at of the client or the last quotation date
    const lastActivity = lastQuotationDate ? Math.max(new Date(lastQuotationDate).getTime(), new Date(client?.updated_at || 0).getTime()) : new Date(client?.updated_at || 0).getTime();

    return { totalQuotations, totalValue, lastQuotationDate, lastActivity: new Date(lastActivity).toISOString() };
  }, [clientQuotations, client]);

  if (isClientsLoading && !client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in text-center py-12">
        <h2 className="text-headline-md mb-2">Cliente não encontrado</h2>
        <Link href="/dashboard/clients" className="text-[var(--color-primary)] hover:underline">Voltar para a lista</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[var(--spacing-container-max)] mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/clients" className="p-2 hover:bg-[var(--color-surface-container)] rounded-full transition-colors text-[var(--color-on-surface-variant)]">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-headline-lg text-[var(--color-on-surface)]">{client.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", 
              client.status === "active" ? "bg-green-100 text-green-800" :
              client.status === "new" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
            )}>
              {client.status === "active" ? "Ativo" : client.status === "new" ? "Novo" : "Inativo"}
            </span>
            {client.tax_number && (
              <span className="text-body-sm text-[var(--color-on-surface-variant)]">NUIT: {client.tax_number}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/quotations/new?client_id=${client.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[#003ea8] transition-colors elevation-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Proforma</span>
          </Link>
          <Link
            href={`/dashboard/clients/${client.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] rounded-md hover:bg-[var(--color-surface-container-high)] transition-colors elevation-1"
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">Editar</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-outline-variant)] mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn("px-6 py-3 font-medium text-sm transition-colors border-b-2", activeTab === "overview" ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]")}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab("quotations")}
          className={cn("px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2", activeTab === "quotations" ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]")}
        >
          Proformas
          <span className="bg-[var(--color-surface-container-high)] text-xs py-0.5 px-2 rounded-full text-[var(--color-on-surface)]">{clientQuotations.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("crm")}
          className={cn("px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2", activeTab === "crm" ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]")}
        >
          <MessageCircle className="w-4 h-4" />
          Histórico & CRM
          <span className="bg-[var(--color-surface-container-high)] text-xs py-0.5 px-2 rounded-full text-[var(--color-on-surface)]">{interactions.length}</span>
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Panel */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <div className="bg-white p-5 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-label-md text-[var(--color-on-surface-variant)]">Total de Proformas</h3>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-headline-md text-[var(--color-on-surface)]">{stats.totalQuotations}</p>
            </div>
            <div className="bg-white p-5 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-label-md text-[var(--color-on-surface-variant)]">Valor Total</h3>
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-headline-md text-[var(--color-on-surface)]">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="bg-white p-5 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-label-md text-[var(--color-on-surface-variant)]">Última Proforma</h3>
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <p className="text-headline-sm text-[var(--color-on-surface)] truncate">{stats.lastQuotationDate ? formatDate(stats.lastQuotationDate) : "—"}</p>
            </div>
            <div className="bg-white p-5 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-label-md text-[var(--color-on-surface-variant)]">Última Atividade</h3>
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-headline-sm text-[var(--color-on-surface)] truncate">{formatDate(stats.lastActivity)}</p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
              <h2 className="text-headline-sm mb-4">Informações de Contacto</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[var(--color-outline)] mt-0.5" />
                  <div>
                    <p className="text-label-sm text-[var(--color-on-surface-variant)]">Email</p>
                    <p className="text-body-md">{client.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[var(--color-outline)] mt-0.5" />
                  <div>
                    <p className="text-label-sm text-[var(--color-on-surface-variant)]">Telefone</p>
                    <p className="text-body-md">{client.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[var(--color-outline)] mt-0.5" />
                  <div>
                    <p className="text-label-sm text-[var(--color-on-surface-variant)]">Endereço</p>
                    <p className="text-body-md">{client.address || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {(client.notes || client.origin) && (
              <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
                <h2 className="text-headline-sm mb-4">Detalhes Adicionais</h2>
                {client.origin && (
                  <div className="mb-4">
                    <p className="text-label-sm text-[var(--color-on-surface-variant)] mb-1">Origem</p>
                    <p className="text-body-md capitalize">{client.origin === 'referral' ? 'Recomendação' : client.origin === 'social' ? 'Redes Sociais' : client.origin === 'direct' ? 'Contacto Direto' : client.origin}</p>
                  </div>
                )}
                {client.notes && (
                  <div>
                    <p className="text-label-sm text-[var(--color-on-surface-variant)] mb-1">Notas Internas</p>
                    <p className="text-body-md whitespace-pre-wrap bg-[var(--color-surface-container-lowest)] p-4 rounded-md border border-[var(--color-outline-variant)]">{client.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
              <h2 className="text-headline-sm mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[var(--color-primary)]" />
                Tags
              </h2>
              {client.tags && client.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] rounded-full text-sm font-medium border border-[var(--color-outline-variant)]">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-[var(--color-on-surface-variant)]">Nenhuma tag adicionada.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "quotations" && (
        <div className="bg-white rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)] overflow-hidden">
          {clientQuotations.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-[var(--color-outline)] mx-auto mb-3" />
              <h3 className="text-headline-sm mb-2">Nenhuma proforma</h3>
              <p className="text-body-sm text-[var(--color-on-surface-variant)] mb-4">Este cliente ainda não tem proformas associadas.</p>
              <Link href={`/dashboard/quotations/new?client_id=${client.id}`} className="inline-flex px-4 py-2 bg-[var(--color-primary)] text-white rounded-md">Criar Proforma</Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] text-label-sm border-b border-[var(--color-outline-variant)]">
                  <th className="px-6 py-4 font-semibold uppercase">Número</th>
                  <th className="px-6 py-4 font-semibold uppercase">Data</th>
                  <th className="px-6 py-4 font-semibold uppercase">Estado</th>
                  <th className="px-6 py-4 font-semibold uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)]">
                {clientQuotations.map(q => (
                  <tr key={q.id} className="hover:bg-[var(--color-surface-container-lowest)] transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/quotations/${q.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                        {q.quotation_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm">{formatDate(q.date)}</td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium uppercase",
                        q.status === 'approved' ? "bg-green-100 text-green-800" :
                        q.status === 'rejected' ? "bg-red-100 text-red-800" :
                        q.status === 'sent' ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      )}>{q.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(q.grand_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {activeTab === "crm" && (
        <div className="space-y-6">
          {/* Add Interaction Form */}
          <div className="bg-white rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)] p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Registar Interação</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {INTERACTION_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setInteractionType(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                    interactionType === t.key
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
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
              placeholder="Título (ex: Chamada com o João)"
              className="w-full p-3 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] mb-2"
            />
            <textarea
              value={interactionDesc}
              onChange={(e) => setInteractionDesc(e.target.value)}
              placeholder="Detalhes (opcional)"
              className="w-full p-3 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] resize-none h-20 mb-3"
            />
            <button
              onClick={async () => {
                if (!interactionTitle.trim()) return;
                await addInteraction(id, interactionType, interactionTitle.trim(), interactionDesc.trim() || null);
                setInteractionTitle("");
                setInteractionDesc("");
              }}
              disabled={!interactionTitle.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#003ea8]"
            >
              <Send className="w-4 h-4" /> Registar
            </button>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)] p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Linha do Tempo</h3>
            {(() => {
              // Merge manual interactions + quotation history into one timeline
              const manualEvents = interactions.map((i) => ({
                id: i.id,
                date: i.created_at,
                type: "manual" as const,
                icon: INTERACTION_TYPES.find((t) => t.key === i.type)?.icon || "📝",
                color: INTERACTION_TYPES.find((t) => t.key === i.type)?.color || "#6b7280",
                label: INTERACTION_TYPES.find((t) => t.key === i.type)?.label || "Nota",
                title: i.title,
                description: i.description,
              }));

              const autoEvents = quotationHistory.map((h) => ({
                id: h.id,
                date: h.created_at,
                type: "auto" as const,
                icon: h.action === "Created" ? "📄" : h.action === "Shared" ? "📤" : h.action === "Pipeline" ? "📊" : "🔄",
                color: h.action === "Created" ? "#3b82f6" : h.action === "Shared" ? "#22c55e" : "#8b5cf6",
                label: h.quotation_number || "Proforma",
                title: h.action === "Created" ? "Proforma criada" : h.action === "Shared" ? "Proforma enviada" : h.action === "Pipeline" ? `Pipeline: ${h.new_status}` : `Status: ${h.old_status} → ${h.new_status}`,
                description: h.details,
              }));

              const allEvents = [...manualEvents, ...autoEvents].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              );

              if (allEvents.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma interação registada.</p>
                    <p className="text-xs mt-1">Use o formulário acima para registar uma chamada, nota ou reunião.</p>
                  </div>
                );
              }

              return (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                  <div className="space-y-4">
                    {allEvents.map((event) => (
                      <div key={event.id} className="flex gap-3 relative">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 z-10 border-2 border-white"
                          style={{ backgroundColor: event.color + "20", borderColor: event.color }}
                        >
                          {event.icon}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold" style={{ color: event.color }}>
                                {event.label}
                              </span>
                              {event.type === "auto" && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded-full uppercase">auto</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatDateTime(event.date)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-800">{event.title}</p>
                          {event.description && (
                            <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{event.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

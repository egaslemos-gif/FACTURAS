"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuotationsStore } from "@/stores";
import { Search, Plus, FileText, Clock, Send, CheckCircle2, XCircle } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { SeverityEngine } from "@/lib/pipeline/severityEngine";
import { getSemanticProfile } from "@/lib/ui/semanticPresentationRegistry";
import { useAppSettingsStore } from "@/stores/appSettings";

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  draft: { label: "Rascunho", icon: Clock, className: "text-slate-500" },
  sent: { label: "Enviada", icon: Send, className: "text-blue-500" },
  approved: { label: "Aprovada", icon: CheckCircle2, className: "text-emerald-500" },
  rejected: { label: "Rejeitada", icon: XCircle, className: "text-rose-500" },
  expired: { label: "Expirada", icon: XCircle, className: "text-rose-500" },
};

export function QuotationsSplitViewClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { quotations, fetchQuotations, isLoading } = useQuotationsStore();
  const { businessProfile } = useAppSettingsStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const profile = getSemanticProfile(businessProfile);

  const isIndexPage = pathname === "/dashboard/quotations";
  const isFormPage = pathname === "/dashboard/quotations/new" || pathname?.endsWith("/edit");
  
  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch = 
      q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.client_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || q.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] md:h-[calc(100vh-theme(spacing.16)-theme(spacing.10))] gap-6">
      {/* Left List Pane (Hidden on mobile if we are on a detail page) */}
      <div className={cn(
        "w-full xl:w-[280px] flex-shrink-0 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-surface-1",
        isIndexPage ? "flex" : "hidden",
        !isIndexPage && !isFormPage && "xl:flex"
      )}>
        {/* List Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-[var(--text-primary)]">{profile.pipelineLabel}</h2>
          <Link href="/dashboard/quotations/new" className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
          </Link>
        </div>
        
        {/* Search & Filter */}
        <div className="p-3 border-b border-slate-100 bg-white space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={`Pesquisar por N°, ${profile.clientLabel}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-[var(--text-secondary)] outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
          >
            <option value="all">Todos os Estados</option>
            <option value="draft">Rascunho</option>
            <option value="sent">Enviadas (Em Aberto)</option>
            <option value="approved">Aprovadas</option>
            <option value="rejected">Rejeitadas/Expiradas</option>
          </select>
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : filteredQuotations.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm font-medium">Nenhuma {profile.quotationLabel.toLowerCase()} encontrada.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredQuotations.map(q => {
                const isActive = pathname === `/dashboard/quotations/${q.id}` || pathname === `/dashboard/quotations/${q.id}/edit`;
                const status = statusConfig[q.status] || statusConfig.draft;
                const StatusIcon = status.icon;
                
                // We will default to 'DEFAULT' profile if company profile is not loaded in this component
                const severity = SeverityEngine.calculateSeverity(q, businessProfile || "DEFAULT");
                
                // Aplicar Operational Tension Language
                const isCritical = severity.state === "critical" || severity.state === "urgent";
                const isWarning = severity.state === "warning";

                return (
                  <Link 
                    key={q.id}
                    href={`/dashboard/quotations/${q.id}`}
                    className={cn(
                      "flex flex-col gap-2 p-4 transition-all cursor-pointer group relative border-l-4",
                      isActive ? "bg-teal-50/30 hover:bg-teal-50/50" : "bg-white hover:bg-slate-50",
                      isCritical ? "border-[var(--severity-critical)]" : 
                      isWarning ? "border-[var(--severity-attention)]" : 
                      isActive ? "border-teal-500" : "border-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between min-w-0 w-full gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-bold text-sm truncate", isActive ? "text-teal-900" : "text-[var(--text-primary)] group-hover:text-teal-700")}>
                            {q.quotation_number}
                          </span>
                          {(isCritical || isWarning) && q.status === "sent" && (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider truncate max-w-[120px]",
                              isCritical ? "bg-[var(--severity-critical-bg)] text-[var(--severity-critical)] ring-1 ring-[var(--severity-critical)]" :
                              "bg-[var(--severity-attention-bg)] text-[var(--severity-attention)] ring-1 ring-[var(--severity-attention)]"
                            )} title={severity.reasons[0] || severity.state}>
                              {severity.reasons[0] || severity.state}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5 font-medium">{q.client_name || "Cliente Desconhecido"}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-sm text-[var(--text-primary)]">{formatCurrency(q.grand_total)}</div>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <StatusIcon className={cn("w-3 h-3", status.className)} />
                          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">{status.label}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        isIndexPage && "hidden xl:flex bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 items-center justify-center"
      )}>
        {isIndexPage ? (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">Central de {profile.quotationPluralLabel}</h3>
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              Selecione uma {profile.quotationLabel.toLowerCase()} na lista para visualizar, aprovar, editar ou acompanhar o aging do SLA operacional.
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto pr-2 pb-12 xl:pb-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

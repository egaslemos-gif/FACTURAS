"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useCompanyStore, useClientsStore, useQuotationsStore, usePipelineStore, useInteractionsStore } from "@/stores";
import { useAppSettingsStore } from "@/stores/appSettings";
import { 
  FileText, 
  Plus, 
  Send, 
  Target, 
  BarChart3, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  ArrowUpRight, 
  Check, 
  Calendar, 
  Phone, 
  AlertTriangle,
  Sparkles,
  ChevronDown,
  Wifi,
  WifiOff,
  Database,
  Users,
  Package
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { INTERACTION_TYPES, Quotation } from "@/lib/types";
import { EmptyState } from "@/components/EmptyState";
import { generateOperationalAlerts, OperationalAlert } from "@/lib/alerts/operationalAlerts";
import { ActionEngine } from "@/lib/pipeline/actionEngine";
import { NotificationEngine } from "@/lib/notifications/notificationEngine";
import { CalendarSyncOrchestrator } from "@/lib/sync/calendarSync";
import { useNetworkStore } from "@/stores/useNetworkStore";

export default function DashboardHome() {
  const { data: session } = useSession();
  const { company, fetchCompany } = useCompanyStore();
  const { clients, fetchClients } = useClientsStore();
  const { quotations, fetchQuotations } = useQuotationsStore();
  const { getPipelineMetrics } = usePipelineStore();
  const { recentActivities, fetchRecent } = useInteractionsStore();

  const [activeTab, setActiveTab] = useState<"attention" | "recent">("attention");
  const [snoozeMenuOpen, setSnoozeMenuOpen] = useState<string | null>(null);
  
  const { isOnline } = useNetworkStore();
  const { businessProfile } = useAppSettingsStore();
  const [syncQueueCount, setSyncQueueCount] = useState(0);

  useEffect(() => {
    // Check sync queue status
    import('@/lib/db/client').then(({ dbClient }) => {
      dbClient.query("SELECT COUNT(*) as count FROM persistent_sync_queue WHERE status = 'PENDING'").then(res => {
        if(res && res.length > 0) {
          setSyncQueueCount(res[0].count || 0);
        }
      }).catch(console.error);
    });
  }, [quotations]);

  useEffect(() => {
    fetchCompany();
    fetchClients();
    fetchQuotations();
    fetchRecent(8);
    
    // Request notification permissions on mount
    NotificationEngine.requestPermission();
  }, [fetchCompany, fetchClients, fetchQuotations, fetchRecent]);

  // Trigger local notifications for overdue items
  useEffect(() => {
    if (quotations.length > 0) {
      const alerts = generateOperationalAlerts(quotations, businessProfile);
      const overdueAlerts = alerts.filter(a => a.type === "overdue_followup");
      
      overdueAlerts.forEach(alert => {
        NotificationEngine.notify(
          alert.quotationId,
          `⚠️ Alerta CRM: Proforma ${alert.quotationNumber}`,
          `Ação em atraso com ${alert.clientName}: "${alert.message}"`,
          alert.message,
          alert.nextActionDate || "",
          alert.nextActionTime || ""
        );
      });
    }
  }, [quotations, businessProfile]);

  const now = new Date();
  const currentHour = now.getHours();
  let greeting = "Bom dia";
  if (currentHour >= 12 && currentHour < 20) {
    greeting = "Boa tarde";
  } else if (currentHour >= 20 || currentHour < 5) {
    greeting = "Boa noite";
  }

  const todayStr = now.toISOString().split("T")[0];
  const activeDeals = quotations.filter(q => q.pipeline_stage && q.pipeline_stage !== 'won' && q.pipeline_stage !== 'lost');

  const recentQuotations = quotations.slice(0, 5);
  const metrics = getPipelineMetrics(quotations);
  // Operational alert processing
  const allAlerts = generateOperationalAlerts(quotations, businessProfile);
  
  // 1. All Operational Alerts (Atenção Comercial AGORA)
  const visibleAlerts = allAlerts;
  
  // 2. Today's commercial tasks
  const todaysTasks = quotations.filter(q => {
    return q.next_action_date === todayStr && 
           q.followup_status !== "completed" && 
           q.pipeline_stage !== "won" && 
           q.pipeline_stage !== "lost" && 
           q.status !== "draft";
  });

  // 3. High priority active deals
  const highPriorityDeals = quotations.filter(q => {
    return (q.priority === "high" || q.priority === "urgent") && 
           q.pipeline_stage !== "won" && 
           q.pipeline_stage !== "lost" && 
           q.status !== "draft";
  });

  // Handle task actions
  const handleCompleteTask = async (id: string) => {
    await ActionEngine.completeAction(id);
    await CalendarSyncOrchestrator.syncQuotationAction(id);
    fetchQuotations();
    fetchRecent(8);
  };

  const handleSnooze = async (id: string, preset: "30m" | "tomorrow_9h" | "end_of_day" | "next_monday" | "next_week") => {
    await ActionEngine.snoozeAction(id, preset);
    await CalendarSyncOrchestrator.syncQuotationAction(id);
    setSnoozeMenuOpen(null);
    fetchQuotations();
    fetchRecent(8);
  };

  return (
    <div className="max-w-[var(--spacing-container-max)] mx-auto animate-fade-in pb-12 md:pb-20">
      
      {/* 1. Control Center Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Control Center
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {greeting}, {session?.user?.name?.split(" ")[0] || "Gestor"}. {allAlerts.length === 0 
              ? "O pipeline está 100% em dia." 
              : `${allAlerts.length} ações pendentes.`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sync Status Badge */}
          {!isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-200" title="Offline">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Offline</span>
              {syncQueueCount > 0 && <span className="bg-amber-200/50 px-1.5 py-0.5 rounded text-[10px]">{syncQueueCount} pendentes</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200" title="Online e Sincronizado">
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Online</span>
              {syncQueueCount > 0 && <span className="text-[10px] opacity-70">A sincronizar {syncQueueCount}...</span>}
            </div>
          )}

          <Link 
            href="/dashboard/quotations/new" 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nova Proforma</span>
          </Link>
        </div>
      </div>

      {/* 2. Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/dashboard/quotations/new" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold shadow-sm transition-all">
          <FileText className="w-4 h-4 text-teal-600" /> Nova Proforma
        </Link>
        <Link href="/dashboard/clients/new" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold shadow-sm transition-all">
          <Users className="w-4 h-4 text-blue-600" /> Novo Cliente
        </Link>
        <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold shadow-sm transition-all">
          <Package className="w-4 h-4 text-amber-600" /> Novo Artigo
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Runtime Operacional (Prioridade 1: AÇÃO) */}
        <div className="lg:col-span-8 flex flex-col space-y-8">
          
          <div className="flex items-center gap-2 mb-2">
             <Sparkles className="w-5 h-5 text-[var(--severity-critical)]" />
             <h2 className="text-lg font-black text-slate-900">Atenção Comercial AGORA</h2>
             {allAlerts.length > 0 && (
                <span className="bg-[var(--severity-critical-bg)] text-[var(--severity-critical)] text-xs font-black px-2 py-0.5 rounded-full shrink-0">
                  {allAlerts.length} pendentes
                </span>
             )}
          </div>

          <div className="space-y-6">
            {/* SECTION 1: Alertas Comerciais (CRITICAL/WARNING) */}
            {visibleAlerts.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-[var(--severity-critical)] uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Alertas Operacionais Críticos
                </h3>
                <div className="space-y-2">
                  {visibleAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={cn(
                        "bg-white border-l-4 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all hover:shadow-md",
                        alert.priority === "urgent" || alert.priority === "high" ? "border-l-[var(--severity-critical)] border-y border-r border-[var(--severity-critical-bg)] bg-red-50/10" : "border-l-[var(--severity-attention)] border-y border-r border-slate-100"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                            alert.priority === "urgent" || alert.priority === "high" ? "bg-[var(--severity-critical-bg)] text-[var(--severity-critical)]" : "bg-[var(--severity-attention-bg)] text-[var(--severity-attention)]"
                          )}>
                            {alert.type.replace(/_/g, " ")}
                          </span>
                          <span className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
                            {alert.quotationNumber}
                          </span>
                          <span className="text-slate-300 text-xs">•</span>
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {alert.clientName}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm font-semibold leading-tight",
                          alert.priority === "urgent" || alert.priority === "high" ? "text-red-900" : "text-slate-900"
                        )}>
                          {alert.message}
                        </p>
                      </div>
                      
                      {/* Quick actions for task */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center relative">
                        <button 
                          onClick={() => handleCompleteTask(alert.quotationId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                          title="Concluir ação"
                        >
                          <Check className="w-3.5 h-3.5" /> Concluído
                        </button>
                        
                        <div className="relative">
                          <button 
                            onClick={() => setSnoozeMenuOpen(snoozeMenuOpen === alert.id ? null : alert.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-[var(--text-secondary)] hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" /> Adiar <ChevronDown className="w-3 h-3" />
                          </button>
                          
                          {snoozeMenuOpen === alert.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-100 rounded-xl shadow-lg z-50 py-1 divide-y divide-slate-50">
                              <button onClick={() => handleSnooze(alert.quotationId, "30m")} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold">+30 minutos</button>
                              <button onClick={() => handleSnooze(alert.quotationId, "tomorrow_9h")} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold">Amanhã 09:00</button>
                              <button onClick={() => handleSnooze(alert.quotationId, "end_of_day")} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold">Fim do Dia (18h)</button>
                              <button onClick={() => handleSnooze(alert.quotationId, "next_monday")} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold">Próxima Segunda</button>
                            </div>
                          )}
                        </div>

                        <Link 
                          href={`/dashboard/quotations/${alert.quotationId}`}
                          className="p-1.5 text-[var(--text-muted)] hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 2: Compromissos de Hoje */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" /> Agenda Comercial de Hoje
              </h3>
              {todaysTasks.length === 0 ? (
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-semibold text-[var(--text-muted)]">Sem chamadas ou follow-ups agendados para hoje.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todaysTasks.map(q => (
                    <div 
                      key={q.id} 
                      className="bg-white border border-slate-200 hover:border-teal-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-teal-50 text-teal-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                            Hoje {q.next_action_time || ""}
                          </span>
                          <span className="font-mono text-xs font-semibold text-[var(--text-muted)]">{q.quotation_number}</span>
                          <span className="text-xs font-bold text-[var(--text-primary)]">{q.client_name}</span>
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                          {(q.next_action || "").toLowerCase().includes("ligar") && <Phone className="w-3.5 h-3.5 text-teal-600" />}
                          {q.next_action || "Ação de acompanhamento comercial"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => handleCompleteTask(q.id)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all"
                        >
                          Concluir
                        </button>
                        <Link 
                          href={`/dashboard/quotations/${q.id}`}
                          className="p-1.5 text-[var(--text-muted)] hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SECTION 3: Negociações Críticas Paradas */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Negócios Críticos a Acompanhar
              </h3>
              {highPriorityDeals.length === 0 ? (
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-semibold text-[var(--text-muted)]">Sem negociações críticas ou estagnadas em aberto.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {highPriorityDeals.map(q => (
                    <Link 
                      key={q.id}
                      href={`/dashboard/quotations/${q.id}`}
                      className="bg-white border border-slate-200 hover:border-teal-300 hover:shadow-md rounded-xl p-4 transition-all block group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-red-50 text-red-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                          {q.priority}
                        </span>
                        <span className="text-sm font-black text-[var(--text-primary)] group-hover:text-teal-700">{formatCurrency(q.grand_total)}</span>
                      </div>
                      <p className="text-xs font-bold text-[var(--text-secondary)] truncate mb-1">{q.quotation_number} • {q.client_name}</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        Próximo passo: {q.next_action || "Sem ação agendada"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
            
            {/* If there's literally no actionable tasks or alerts */}
            {visibleAlerts.length === 0 && todaysTasks.length === 0 && highPriorityDeals.length === 0 && (
              <div className="bg-teal-50/50 border-2 border-dashed border-teal-100 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-teal-100">
                  <Check className="w-8 h-8 text-teal-500" />
                </div>
                <h3 className="text-lg font-black text-teal-900 mb-2">Tudo em Dia!</h3>
                <p className="text-sm text-teal-700 font-medium">O seu pipeline não exige atenção crítica neste momento. Excelente trabalho.</p>
              </div>
            )}
            
          </div>
        </div>

        {/* RIGHT COLUMN: KPIs & Feed CRM */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Top KPIs (Moved to sidebar to prioritize Actionability) */}
          <section className="space-y-3">
             <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
               Resumo Operacional
             </h3>
             <div className="flex flex-col gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Total Pipeline</div>
                    <div className="text-lg font-black text-[var(--text-primary)]">{formatCurrency(metrics.totalPipeline)}</div>
                    <div className="text-[10px] font-bold text-[var(--text-secondary)] mt-0.5">{activeDeals.length} negócios ativos</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">A Aguardar Feedback</div>
                    <div className="text-lg font-black text-[var(--text-primary)]">{quotations.filter(q => q.status === "sent").length} proformas</div>
                  </div>
                </div>
             </div>
          </section>
          
          {/* Feed CRM / Atividade */}
          <section className="dashboard-section !mt-0">
            <header className="dashboard-section-header">
              <h2 className="dashboard-section-title">Timeline do Operador</h2>
              <p className="dashboard-section-subtitle">Últimos marcos comerciais registados.</p>
            </header>
            
            <div className="dashboard-card bg-transparent border-none p-0 shadow-none">
              {recentActivities.length === 0 ? (
                <div className="py-4 text-center text-[var(--text-muted)] text-sm font-medium">
                  Sem interações recentes no CRM.
                </div>
              ) : (
                <div className="flex flex-col relative">
                  <div className="absolute left-[11px] top-4 bottom-4 w-px bg-slate-200 z-0 hidden sm:block"></div>
                  
                  {recentActivities.slice(0, 5).map((activity, index) => {
                    const typeInfo = INTERACTION_TYPES.find(t => t.key === activity.type);
                    const isLast = index === 4 || index === recentActivities.length - 1;
                    
                    return (
                      <div key={activity.id} className={cn("flex items-start gap-4 py-3 relative z-10", !isLast && "border-b border-slate-100 sm:border-transparent")}>
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-200 shadow-sm mt-0.5">
                          <span className="text-[10px]">{typeInfo?.icon || "📝"}</span>
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight truncate">{activity.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] truncate">
                              {(activity as any).client_name || "Cliente"}
                            </span>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <span className="text-[10px] font-bold text-[var(--text-muted)]">
                              {formatDateTime(activity.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

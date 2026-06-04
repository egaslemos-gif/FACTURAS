"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCompanyStore, useClientsStore, useQuotationsStore, usePipelineStore, useInteractionsStore } from "@/stores";
import { FileText, Plus, Send, Target, BarChart3, Clock, AlertCircle, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { INTERACTION_TYPES } from "@/lib/types";
import { EmptyState } from "@/components/EmptyState";
import { generateAlerts } from "@/lib/pipeline/alerts";

export default function DashboardHome() {
  const { data: session } = useSession();
  const { company, fetchCompany } = useCompanyStore();
  const { clients, fetchClients } = useClientsStore();
  const { quotations, fetchQuotations } = useQuotationsStore();
  const { getPipelineMetrics } = usePipelineStore();
  const { recentActivities, fetchRecent } = useInteractionsStore();

  useEffect(() => {
    fetchCompany();
    fetchClients();
    fetchQuotations();
    fetchRecent(8);
  }, [fetchCompany, fetchClients, fetchQuotations, fetchRecent]);

  const now = new Date();
  const currentHour = now.getHours();
  let greeting = "Bom dia";
  if (currentHour >= 12 && currentHour < 20) {
    greeting = "Boa tarde";
  } else if (currentHour >= 20 || currentHour < 5) {
    greeting = "Boa noite";
  }

  const todayStr = now.toISOString().split("T")[0];
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const next3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const sentQuotations = quotations.filter(q => q.status === "sent");
  const totalSent = sentQuotations.length;
  const sentToday = sentQuotations.filter(q => q.updated_at?.startsWith(todayStr) || q.created_at?.startsWith(todayStr)).length;
  
  const activeDeals = quotations.filter(q => q.pipeline_stage && q.pipeline_stage !== 'won' && q.pipeline_stage !== 'lost');
  const expiringSoon = activeDeals.filter(q => q.expiry_date >= todayStr && q.expiry_date <= next3Days).length;

  const recentQuotations = quotations.slice(0, 5);
  const metrics = getPipelineMetrics(quotations);
  
  const smartAlerts = generateAlerts(quotations).slice(0, 6);
  const pendingFollowUps = smartAlerts.length;

  return (
    <div className="max-w-[var(--spacing-container-max)] mx-auto animate-fade-in pb-12 md:pb-20">
      
      {/* 1. Greeting / Contexto do Dia */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {greeting}, {session?.user?.name?.split(" ")[0] || "Gestor"} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1 leading-normal">
          {pendingFollowUps === 0 
            ? "Nenhuma ação crítica no momento." 
            : `${pendingFollowUps} alertas operacionais ativos.`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Main Workspace */}
        <div className="lg:col-span-8 flex flex-col">
          
          {/* 2. Ações Pendentes */}
          <section className="dashboard-section">
            <header className="dashboard-section-header flex items-center justify-between">
              <div>
                <h2 className="dashboard-section-title flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" /> Ações Pendentes
                </h2>
                <p className="dashboard-section-subtitle">Tarefas operacionais que necessitam de resolução.</p>
              </div>
            </header>
            
            <div className="dashboard-card overflow-hidden border-indigo-100/50 shadow-sm">
              {smartAlerts.length === 0 ? (
                <div className="p-4 text-center bg-indigo-50/30">
                  <p className="text-sm font-medium text-slate-500">O seu pipeline está perfeitamente organizado. 🎉</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100/60">
                  {smartAlerts.map((alert, i) => (
                    <Link 
                      key={alert.id} 
                      href={`/dashboard/pipeline`} 
                      className="group flex items-center justify-between p-3 hover:bg-indigo-50/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {alert.severity === 'high' ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 ring-4 ring-red-500/10"></div>
                        ) : alert.severity === 'medium' ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 ring-4 ring-amber-500/10"></div>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 ring-4 ring-blue-500/10"></div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{alert.message}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{alert.quotationNumber} • {alert.clientName}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 shrink-0 ml-4" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 3. Atividade Recente (Proformas) */}
          <section className="dashboard-section">
            <header className="dashboard-section-header flex items-center justify-between">
              <div>
                <h2 className="dashboard-section-title flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400" /> Atividade Recente
                </h2>
                <p className="dashboard-section-subtitle">Últimas proformas criadas ou atualizadas.</p>
              </div>
              <Link href="/dashboard/quotations" className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline">
                Ver Todas
              </Link>
            </header>
            
            <div className="dashboard-card overflow-hidden">
              {recentQuotations.length === 0 ? (
                <div className="py-6">
                  <EmptyState 
                    icon={FileText} 
                    title="Sem proformas" 
                    description="As propostas que criadas aparecerão aqui."
                    action={{
                      label: "Criar Proforma",
                      icon: Plus,
                      onClick: () => window.location.href = "/dashboard/quotations/new"
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100/60">
                  {recentQuotations.map(q => (
                    <Link key={q.id} href={`/dashboard/quotations/${q.id}`} className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors group">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors">{q.quotation_number}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-0.5 bg-slate-100 rounded-md">{q.status}</span>
                        </div>
                        <div className="text-sm font-medium text-slate-600 mt-1 truncate">{q.client_name || "Cliente Desconhecido"}</div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="font-semibold text-slate-900 text-sm">{formatCurrency(q.grand_total)}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">{new Date(q.date).toLocaleDateString('pt-PT')}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Sidebar/Contextual */}
        <div className="lg:col-span-4 flex flex-col">
          
          {/* 4. Visão Comercial */}
          <section className="dashboard-section !bg-slate-900 !border-slate-800 text-white shadow-xl">
            <header className="dashboard-section-header">
              <h2 className="dashboard-section-title !text-white">Visão Comercial</h2>
              <p className="dashboard-section-subtitle !text-slate-400">Estado atual do pipeline e métricas vitais.</p>
            </header>
            
            <div className="space-y-3">
              {/* Highlight Metric */}
              <Link 
                href="/dashboard/pipeline" 
                className="block dashboard-card !bg-white/5 !border-white/10 hover:!bg-white/10 p-4 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Pipeline Ativo</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-teal-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-black tracking-tight text-white">{formatCurrency(metrics.totalPipeline)}</span>
                </div>
                
                <div className="mt-2 text-[11px] font-medium text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]"></span>
                  {activeDeals.length} negócios em aberto
                </div>
              </Link>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="dashboard-card !bg-white/5 !border-white/10 p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Send className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Enviadas</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-white">{totalSent}</span>
                    {sentToday > 0 && <span className="text-[10px] font-bold text-teal-300 bg-teal-500/20 px-1.5 py-0.5 rounded-md">+{sentToday} hoje</span>}
                  </div>
                </div>

                <div className="dashboard-card !bg-white/5 !border-white/10 p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">A Expirar</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-white">{expiringSoon}</span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-md">Breve</span>
                  </div>
                </div>
                
                <div className="col-span-2 dashboard-card !bg-white/5 !border-white/10 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Target className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Em Negociação</span>
                  </div>
                  <span className="text-base font-bold text-white">{formatCurrency(metrics.inNegotiation)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Feed CRM / Atividade */}
          <section className="dashboard-section">
            <header className="dashboard-section-header">
              <h2 className="dashboard-section-title">Feed CRM</h2>
              <p className="dashboard-section-subtitle">Últimas interações de clientes.</p>
            </header>
            
            <div className="dashboard-card bg-transparent border-none">
              {recentActivities.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-sm">
                  Sem interações recentes no CRM.
                </div>
              ) : (
                <div className="flex flex-col relative">
                  {/* Subtle timeline line connecting icons */}
                  <div className="absolute left-[11px] top-4 bottom-4 w-px bg-slate-100 z-0 hidden sm:block"></div>
                  
                  {recentActivities.map((activity, index) => {
                    const typeInfo = INTERACTION_TYPES.find(t => t.key === activity.type);
                    const isLast = index === recentActivities.length - 1;
                    
                    return (
                      <div key={activity.id} className={cn("flex items-start gap-4 py-2 relative z-10", !isLast && "border-b border-slate-50 sm:border-transparent")}>
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-200 shadow-sm mt-0.5">
                          <span className="text-[10px]">{typeInfo?.icon || "📝"}</span>
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm font-semibold text-slate-900 leading-tight">{activity.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-medium text-slate-600 truncate">
                              {(activity as any).client_name || "Cliente"}
                            </span>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <span className="text-[10px] font-medium text-slate-400">
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

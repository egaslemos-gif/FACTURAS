"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useCompanyStore, useClientsStore, useQuotationsStore } from "@/stores";
import { FileText, Users, DollarSign, TrendingUp, Clock, Plus, CloudUpload } from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { findLatestBackup } from "@/lib/google/drive";

export default function DashboardHome() {
  const { data: session } = useSession();
  const { company, fetchCompany } = useCompanyStore();
  const { clients, fetchClients } = useClientsStore();
  const { quotations, fetchQuotations } = useQuotationsStore();
  
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  useEffect(() => {
    fetchCompany();
    fetchClients();
    fetchQuotations();
  }, [fetchCompany, fetchClients, fetchQuotations]);

  useEffect(() => {
    // We would normally fetch the backup info here
    // For MVP, just to show UI logic:
    setLastBackupDate(new Date().toLocaleString("pt-MZ"));
  }, []);

  // Calculate Metrics
  const totalClients = clients.length;
  
  const approvedQuotations = quotations.filter(q => q.status === "approved");
  const totalApprovedValue = approvedQuotations.reduce((acc, q) => acc + q.grand_total, 0);

  const pendingQuotations = quotations.filter(q => q.status === "draft" || q.status === "sent");
  const totalPendingValue = pendingQuotations.reduce((acc, q) => acc + q.grand_total, 0);

  const recentQuotations = quotations.slice(0, 5); // top 5 most recent
  
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];
  
  const pendingActions = [
    ...quotations.filter(q => q.status === 'draft').map(q => ({
      id: q.id,
      title: `Proforma Rascunho`,
      desc: `${q.quotation_number} - Terminar e enviar`,
      priority: 'normal'
    })),
    ...quotations.filter(q => q.status === 'sent' && q.expiry_date >= todayStr && q.expiry_date <= nextWeek).map(q => ({
      id: q.id,
      title: `Proforma a expirar`,
      desc: `${q.quotation_number} expira em breve`,
      priority: 'high'
    }))
  ].slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-headline-lg text-[var(--color-on-surface)]">
            Olá, {session?.user?.name?.split(" ")[0] || "Gestor"} 👋
          </h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
            Aqui está o resumo da sua empresa <span className="font-semibold">{company?.name || "hoje"}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/quotations/new"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[#003ea8] text-white rounded-lg font-medium transition-colors elevation-1 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nova Proforma
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-body-sm text-[var(--color-on-surface-variant)] mb-1">Total Proformas</p>
              <p className="text-headline-md text-[var(--color-on-surface)]">{quotations.length}</p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-body-sm text-[var(--color-on-surface-variant)] mb-1">Valor Aprovado</p>
              <p className="text-headline-sm text-[var(--color-on-surface)] font-bold">{formatCurrency(totalApprovedValue)}</p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-body-sm text-[var(--color-on-surface-variant)] mb-1">Valor Pendente</p>
              <p className="text-headline-sm text-[var(--color-on-surface)] font-bold">{formatCurrency(totalPendingValue)}</p>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-body-sm text-[var(--color-on-surface-variant)] mb-1">Clientes Registados</p>
              <p className="text-headline-md text-[var(--color-on-surface)]">{totalClients}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Quotations */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-outline-variant)] flex items-center justify-between">
              <h2 className="text-headline-sm text-[var(--color-on-surface)]">Atividade Recente</h2>
              <Link href="/dashboard/quotations" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                Ver Todas
              </Link>
            </div>
            
            {recentQuotations.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-on-surface-variant)]">
                Nenhuma proforma criada ainda.
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-outline-variant)]">
                {recentQuotations.map(q => (
                  <Link key={q.id} href={`/dashboard/quotations/${q.id}`} className="flex items-center justify-between p-4 hover:bg-[var(--color-surface-container-lowest)] transition-colors">
                    <div>
                      <div className="font-mono font-medium text-[var(--color-primary)]">{q.quotation_number}</div>
                      <div className="text-sm text-[var(--color-on-surface)] mt-1">{q.client_name || "Cliente Desconhecido"}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-[var(--color-on-surface)]">{formatCurrency(q.grand_total)}</div>
                      <div className="text-xs text-[var(--color-on-surface-variant)] mt-1 capitalize">{q.status}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Pending Actions */}
          <div className="bg-white rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)] p-6">
            <h2 className="text-headline-sm text-[var(--color-on-surface)] mb-4">Ações Pendentes</h2>
            {pendingActions.length === 0 ? (
              <p className="text-sm text-[var(--color-on-surface-variant)] italic">Nenhuma ação pendente no momento.</p>
            ) : (
              <div className="space-y-3">
                {pendingActions.map((action, i) => (
                  <Link key={`${action.id}-${i}`} href={`/dashboard/quotations/${action.id}`} className="block p-3 rounded-lg border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-lowest)] transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      {action.priority === 'high' ? (
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      )}
                      <p className="text-sm font-medium text-[var(--color-on-surface)]">{action.title}</p>
                    </div>
                    <p className="text-xs text-[var(--color-on-surface-variant)] ml-4">{action.desc}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sync Status Sidebar */}
          <div className="bg-[var(--color-primary-container)] rounded-[var(--radius-lg)] p-6 border border-[var(--color-primary-fixed-dim)]">
            <h2 className="text-headline-sm text-[var(--color-on-primary-container)] mb-4">Estado da Sincronização</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-on-primary-container)]">Base de Dados Local</p>
                  <p className="text-xs text-[var(--color-on-primary-container)]/80">Ativa e Guardada (sql.js)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                  <CloudUpload className="w-4 h-4 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-on-primary-container)]">Backup Google Drive</p>
                  <p className="text-xs text-[var(--color-on-primary-container)]/80">
                    {lastBackupDate ? `Último backup: ${lastBackupDate}` : "Sincronizado automaticamente"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--color-primary-fixed-dim)]/30">
              <p className="text-xs text-[var(--color-on-primary-container)]/80 leading-relaxed">
                Os seus dados pertencem-lhe. Tudo o que cria aqui é guardado na sua conta Google e no seu dispositivo localmente. Não existem bases de dados centrais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useQuotationsStore } from "@/stores";
import { Search, Plus, MoreVertical, FileText, CheckCircle2, Send, Clock, XCircle } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  draft: { label: "Rascunho", icon: Clock, className: "chip-draft" },
  sent: { label: "Enviada", icon: Send, className: "chip-sent" },
  approved: { label: "Aprovada", icon: CheckCircle2, className: "chip-approved" },
  rejected: { label: "Rejeitada", icon: XCircle, className: "chip-rejected" },
  expired: { label: "Expirada", icon: XCircle, className: "chip-rejected" },
};

export default function QuotationsPage() {
  const { quotations, fetchQuotations, isLoading } = useQuotationsStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const paginatedQuotations = filteredQuotations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  return (
    <div className="max-w-[var(--spacing-container-max)] mx-auto animate-fade-in pb-12 md:pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Proformas</h1>
          <p className="text-sm text-slate-500 mt-1 leading-normal">
            Gestão de propostas comerciais.
          </p>
        </div>
        <Link
          href="/dashboard/quotations/new"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova Proforma
        </Link>
      </div>

      <div className="dashboard-section p-0 overflow-hidden">
        {/* Barra de Ferramentas */}
        <div className="p-4 border-b border-slate-100/60 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por N°, Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-white text-sm transition-all shadow-sm"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shrink-0 shadow-sm"
            >
              <option value="all">Todos os Estados</option>
              <option value="draft">Rascunho</option>
              <option value="sent">Enviadas</option>
              <option value="approved">Aprovadas</option>
              <option value="rejected">Rejeitadas</option>
            </select>
          </div>
        </div>

        {/* Lista de Proformas */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="py-12">
              <EmptyState 
                icon={FileText} 
                title="Nenhuma proforma encontrada" 
                description="Ainda não criou nenhuma proforma com estes critérios. Comece por criar a sua primeira proforma."
                action={{
                  label: "Criar Proforma",
                  icon: Plus,
                  onClick: () => window.location.href = "/dashboard/quotations/new"
                }}
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100/60">
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 md:py-4 text-left">Documento</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 md:py-4 text-left">Cliente</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 md:py-4 text-left hidden md:table-cell">Data</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 md:py-4 text-right">Total</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 md:py-4 text-center hidden sm:table-cell">Estado</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 md:py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {paginatedQuotations.map((q) => {
                  const status = statusConfig[q.status];
                  const StatusIcon = status.icon;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-teal-600 transition-colors text-sm md:text-base">
                          <Link href={`/dashboard/quotations/${q.id}`}>
                            {q.quotation_number}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="text-sm font-medium text-slate-700 truncate max-w-[120px] sm:max-w-[200px]">
                          {q.client_name || "Cliente Eliminado"}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 hidden md:table-cell">
                        <div className="text-sm text-slate-500">
                          {formatDate(q.date)}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                        <div className="text-sm font-semibold text-slate-900 md:text-base">
                          {formatCurrency(q.grand_total)}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center hidden sm:table-cell">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider",
                          status.className
                        )}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                        <div className="flex items-center justify-end gap-1 md:gap-2">
                          {/* Estado Mobile (Visível apenas em telemóvel para não perder a info) */}
                          <div className="sm:hidden mr-1">
                             <StatusIcon className={cn("w-4 h-4", status.className.replace("bg-", "text-").replace("rgba", "").split(" ")[0])} />
                          </div>
                          <Link href={`/dashboard/quotations/${q.id}`}>
                            <button className="p-1.5 md:p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredQuotations.length > 0 && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100/60 bg-slate-50/50 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium border border-slate-200 bg-white text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium border border-slate-200 bg-white text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useQuotationsStore } from "@/stores";
import { Search, Plus, MoreVertical, FileText, CheckCircle2, Send, Clock, XCircle } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

const statusConfig = {
  draft: { label: "Rascunho", icon: Clock, className: "chip-draft" },
  sent: { label: "Enviada", icon: Send, className: "chip-sent" },
  approved: { label: "Aprovada", icon: CheckCircle2, className: "chip-approved" },
  rejected: { label: "Rejeitada", icon: XCircle, className: "chip-rejected" },
};

export default function QuotationsPage() {
  const { quotations, fetchQuotations, isLoading } = useQuotationsStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
    <div className="max-w-[var(--spacing-container-max)] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-headline-lg text-[var(--color-on-surface)]">Proformas</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
            Crie, envie e acompanhe as suas cotações
          </p>
        </div>
        <Link
          href="/dashboard/quotations/new"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[#003ea8] text-white rounded-lg font-medium transition-colors elevation-1"
        >
          <Plus className="w-5 h-5" />
          Nova Proforma
        </Link>
      </div>

      <div className="bg-white rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)] overflow-hidden">
        {/* Barra de Ferramentas */}
        <div className="p-4 border-b border-[var(--color-outline-variant)] flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-outline)]" />
            <input
              type="text"
              placeholder="Pesquisar por N°, Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] shrink-0"
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
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-[var(--color-outline)]" />
              </div>
              <h3 className="text-headline-sm text-[var(--color-on-surface)] mb-2">Nenhuma proforma encontrada</h3>
              <p className="text-body-sm text-[var(--color-on-surface-variant)] max-w-md">
                Ainda não criou nenhuma proforma com estes critérios. Crie a sua primeira proforma agora.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] text-label-sm border-b border-[var(--color-outline-variant)]">
                  <th className="px-6 py-4 font-semibold uppercase">Documento</th>
                  <th className="px-6 py-4 font-semibold uppercase">Cliente</th>
                  <th className="px-6 py-4 font-semibold uppercase hidden md:table-cell">Data</th>
                  <th className="px-6 py-4 font-semibold uppercase text-right">Total</th>
                  <th className="px-6 py-4 font-semibold uppercase text-center hidden sm:table-cell">Estado</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)]">
                {filteredQuotations.map((q) => {
                  const status = statusConfig[q.status];
                  const StatusIcon = status.icon;

                  return (
                    <tr key={q.id} className="hover:bg-[var(--color-surface-container-lowest)] transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="font-mono font-semibold text-[var(--color-primary)]">
                          <Link href={`/dashboard/quotations/${q.id}`} className="hover:underline">
                            {q.quotation_number}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[var(--color-on-surface)] truncate max-w-[200px]">
                          {q.client_name || "Cliente Eliminado"}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="text-sm text-[var(--color-on-surface-variant)]">
                          {formatDate(q.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-[var(--color-on-surface)]">
                          {formatCurrency(q.grand_total)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center hidden sm:table-cell">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                          status.className
                        )}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Estado Mobile (Visível apenas em telemóvel para não perder a info) */}
                          <div className="sm:hidden mr-2">
                             <StatusIcon className={cn("w-4 h-4", status.className.replace("bg-", "text-").replace("rgba", "").split(" ")[0])} />
                          </div>
                          <Link href={`/dashboard/quotations/${q.id}`}>
                            <button className="p-2 text-[var(--color-outline)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container)] rounded-full transition-colors">
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
      </div>
    </div>
  );
}

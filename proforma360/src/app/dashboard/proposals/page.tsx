"use client";

import { useEffect, useState } from "react";
import { useQuotationsStore, useCompanyStore, useClientsStore } from "@/stores";
import { ClipboardList, ArrowRight, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function ProposalsPage() {
  const { quotations, fetchQuotations } = useQuotationsStore();
  const { company, fetchCompany } = useCompanyStore();
  const { clients, fetchClients } = useClientsStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchQuotations(), fetchCompany(), fetchClients()]).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-4 text-gray-600">A carregar proformas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-teal-600" />
            Propostas Técnicas
          </h1>
          <p className="text-sm text-gray-500 mt-1">Selecione uma proforma para gerar ou editar a proposta comercial</p>
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma proforma encontrada.</p>
          <p className="text-sm text-gray-400 mt-1">Crie uma proforma primeiro para gerar propostas técnicas.</p>
          <Link href="/dashboard/quotations/new" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
            Criar Proforma
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {quotations.map(q => {
            const client = clients.find(c => c.id === q.client_id);
            return (
              <Link
                key={q.id}
                href={`/dashboard/proposals/new?quotationId=${q.id}`}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{q.quotation_number}</p>
                    <p className="text-sm text-gray-500">{client?.name || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(q.grand_total)}</p>
                    <p className="text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString("pt-PT")}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

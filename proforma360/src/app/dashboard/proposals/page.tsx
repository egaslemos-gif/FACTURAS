"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuotationsStore } from "@/stores";
import { ClipboardList, ArrowRight, Loader2, FileText, Trash2, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  generated: "Gerada",
  edited: "Editada",
};

export default function ProposalsPage() {
  const {
    quotations,
    commercialProposals,
    fetchQuotations,
    fetchCommercialProposals,
    deleteCommercialProposal,
  } = useQuotationsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchQuotations(), fetchCommercialProposals()]).finally(() => setIsLoading(false));
  }, []);

  const proformasWithoutProposal = useMemo(() => {
    const withProposal = new Set(commercialProposals.map((p) => p.quotation_id));
    return quotations.filter((q) => !withProposal.has(q.id));
  }, [quotations, commercialProposals]);

  const handleDelete = async (quotationId: string, label: string) => {
    if (!confirm(`Remover a proposta técnica de ${label}? Esta acção não pode ser desfeita.`)) return;
    setDeletingId(quotationId);
    try {
      await deleteCommercialProposal(quotationId);
      toast.success("Proposta técnica removida.");
    } catch {
      toast.error("Não foi possível remover a proposta.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-4 text-gray-600">A carregar propostas técnicas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Propostas Técnicas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Documentos comerciais gerados a partir das proformas — distintos dos orçamentos proforma.
          </p>
        </div>
        {proformasWithoutProposal.length > 0 && (
          <Link
            href={`/dashboard/proposals/new?quotationId=${proformasWithoutProposal[0].id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova Proposta
          </Link>
        )}
      </div>

      {commercialProposals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma proposta técnica guardada.</p>
          <p className="text-sm text-gray-400 mt-1">Crie uma proforma e gere a proposta comercial associada.</p>
          {quotations.length > 0 ? (
            <Link
              href={`/dashboard/proposals/new?quotationId=${quotations[0].id}`}
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Criar primeira proposta
            </Link>
          ) : (
            <Link
              href="/dashboard/quotations/new"
              className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Criar Proforma
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {commercialProposals.map((proposal) => (
            <div
              key={proposal.id}
              className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <Link
                href={`/dashboard/proposals/new?quotationId=${proposal.quotation_id}`}
                className="flex items-center gap-4 min-w-0 flex-1 group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{proposal.quotation_number}</p>
                  <p className="text-sm text-gray-500 truncate">{proposal.client_name || "—"}</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {STATUS_LABELS[proposal.status] || proposal.status}
                    {" · "}
                    {new Date(proposal.updated_at).toLocaleDateString("pt-PT")}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="font-bold text-gray-900">{formatCurrency(proposal.grand_total)}</p>
                </div>
                <Link
                  href={`/dashboard/proposals/new?quotationId=${proposal.quotation_id}`}
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Editar proposta"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(proposal.quotation_id, proposal.quotation_number)}
                  disabled={deletingId === proposal.quotation_id}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Remover proposta"
                >
                  {deletingId === proposal.quotation_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
                <Link
                  href={`/dashboard/proposals/new?quotationId=${proposal.quotation_id}`}
                  className="p-2 text-gray-400 group-hover:text-blue-600 transition-colors hidden sm:block"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {proformasWithoutProposal.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            Proformas sem proposta técnica
          </h2>
          <div className="grid gap-2">
            {proformasWithoutProposal.map((q) => (
              <Link
                key={q.id}
                href={`/dashboard/proposals/new?quotationId=${q.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-teal-200 hover:bg-white transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{q.quotation_number}</p>
                    <p className="text-xs text-gray-500 truncate">{q.client_name || "—"}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-teal-600 shrink-0">Gerar proposta</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuotationsStore, useCompanyStore, useClientsStore } from "@/stores";
import { ArrowLeft, FileText, Send, CheckCircle2, XCircle, Printer, Download, Clock, History, FileDown, Edit2, Copy, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency, formatDate, formatDateTime, generateQuotationNumber } from "@/lib/utils";
import { toast } from "sonner";
import ShareQuotationModal from "@/components/ShareQuotationModal";

const statusConfig = {
  draft: { label: "Rascunho", icon: Clock, className: "bg-gray-100 text-gray-700 border-gray-200" },
  sent: { label: "Enviada", icon: Send, className: "bg-blue-100 text-blue-700 border-blue-200" },
  approved: { label: "Aprovada", icon: CheckCircle2, className: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Rejeitada", icon: XCircle, className: "bg-red-100 text-red-700 border-red-200" },
  expired: { label: "Expirada", icon: Clock, className: "bg-orange-100 text-orange-700 border-orange-200" },
};

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { currentDetail, fetchQuotationDetail, updateStatus, isLoading, createQuotation, quotations } = useQuotationsStore();
  const { company, fetchCompany } = useCompanyStore();
  const { clients, fetchClients } = useClientsStore();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  useEffect(() => {
    fetchCompany();
    fetchClients();
  }, [fetchCompany, fetchClients]);

  useEffect(() => {
    if (id) {
      fetchQuotationDetail(id);
    }
  }, [id, fetchQuotationDetail]);

  if (isLoading && !currentDetail) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentDetail) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-700">Proforma não encontrada</h2>
        <Link href="/dashboard/quotations" className="text-blue-600 hover:underline mt-4 inline-block">
          Voltar para as proformas
        </Link>
      </div>
    );
  }

  const { quotation, items, history } = currentDetail;
  const currentClient = clients.find(c => c.id === quotation.client_id) || (quotation.client_name ? { name: quotation.client_name } as any : null);
  const currentStatus = statusConfig[quotation.status as keyof typeof statusConfig];
  const StatusIcon = currentStatus.icon;

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await updateStatus(id, newStatus, `Estado alterado manualmente para ${statusConfig[newStatus as keyof typeof statusConfig].label}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const latestQuotation = quotations.length > 0 ? quotations[0].quotation_number : null;
      const newNumber = generateQuotationNumber(latestQuotation, company?.quotation_prefix || "PF");
      
      const newItems = items.map(({id, quotation_id, ...rest}, index) => ({...rest, sort_order: index})) as any;
      
      const newDate = new Date().toISOString().split("T")[0];
      // Preserve the original validity period (difference between date and expiry_date)
      const originalDiffMs = new Date(quotation.expiry_date).getTime() - new Date(quotation.date).getTime();
      const originalDiffDays = Math.max(1, Math.round(originalDiffMs / (1000 * 60 * 60 * 24)));
      const expiryDate = new Date(Date.now() + originalDiffDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const { id: _id, quotation_number, status, date, expiry_date, created_at, updated_at, client_name, pdf_url, pdf_drive_id, ...quotationDataToCopy } = quotation as any;

      const newId = await createQuotation({
        ...quotationDataToCopy,
        quotation_number: newNumber,
        document_context: quotation.document_context || "GENERAL",
        schema_version: quotation.schema_version || "v1",
        date: newDate,
        expiry_date: expiryDate,
        status: 'draft',
        pdf_url: null,
        pdf_drive_id: null,
      }, newItems);
      
      toast.success("Proforma duplicada com sucesso!");
      router.push(`/dashboard/quotations/${newId}`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao duplicar proforma.");
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <>
    <div className="max-w-7xl mx-auto animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/quotations" className="p-2 hover:bg-[var(--color-surface-container)] rounded-full transition-colors text-[var(--color-on-surface-variant)]">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-headline-lg text-[var(--color-on-surface)] font-mono">
                {quotation.quotation_number}
              </h1>
              <span className={cn("px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5", currentStatus.className)}>
                <StatusIcon className="w-3.5 h-3.5" />
                {currentStatus.label}
              </span>
            </div>
            <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
              Cliente: {quotation.client_name || "Desconhecido"} • Emitida a: {formatDate(quotation.date)}
            </p>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex gap-2">
          <button 
            onClick={() => setIsShareModalOpen(true)}
            title="Partilhar"
            className="flex items-center justify-center p-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>

          <a 
            href={`/api/view/${quotation.id}`} 
            target="_blank" 
            title="Imprimir / PDF"
            className="flex items-center justify-center p-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shrink-0"
          >
            <Printer className="w-5 h-5" />
          </a>

          <button 
            onClick={handleDuplicate}
            disabled={isDuplicating}
            title="Duplicar Proforma"
            className="flex items-center justify-center p-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shrink-0 disabled:opacity-50"
          >
            {isDuplicating ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> : <Copy className="w-5 h-5" />}
          </button>

          {quotation.status === 'draft' && (
            <>
              <button 
                onClick={async () => {
                  if (confirm('Tem a certeza que deseja apagar este rascunho de proforma? Esta ação não pode ser desfeita.')) {
                    try {
                      await useQuotationsStore.getState().deleteQuotation(id);
                      toast.success("Rascunho apagado com sucesso!");
                      router.push('/dashboard/quotations');
                    } catch (e) {
                      toast.error("Erro ao apagar o rascunho.");
                    }
                  }
                }}
                disabled={isUpdatingStatus}
                title="Apagar Rascunho"
                className="flex items-center justify-center p-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors shrink-0 disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => handleStatusChange('sent')}
                disabled={isUpdatingStatus}
                title="Marcar como Enviada"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> Enviar
              </button>
            </>
          )}

          {quotation.status === 'sent' && (
            <button 
              onClick={() => handleStatusChange('approved')}
              disabled={isUpdatingStatus}
              title="Aprovar"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shrink-0 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> Aprovar
            </button>
          )}

          <Link href={`/dashboard/quotations/${quotation.id}/edit`} title="Editar" className="flex items-center justify-center p-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shrink-0">
            <Edit2 className="w-5 h-5" />
          </Link>

          {quotation.status !== 'rejected' && quotation.status !== 'approved' && (
            <button 
              onClick={() => handleStatusChange('rejected')} 
              disabled={isUpdatingStatus}
              title="Rejeitar"
              className="flex items-center justify-center p-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors shrink-0 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}

          {quotation.status !== 'draft' && (
            <button 
              onClick={() => handleStatusChange('draft')} 
              disabled={isUpdatingStatus}
              title="Reverter (Rascunho)"
              className="flex items-center justify-center p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors shrink-0 disabled:opacity-50"
            >
              <Clock className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile Sticky Bottom Bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-white border-t border-slate-200 shadow-[0_-4px_15px_-3px_rgb(0,0,0,0.1)] z-40 flex items-center gap-2 overflow-x-auto hide-scrollbar pb-safe">
        {quotation.status === 'draft' && (
          <button 
            onClick={() => handleStatusChange('sent')}
            disabled={isUpdatingStatus}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white font-bold rounded-xl active:bg-teal-700 transition-colors"
          >
            <Send className="w-4 h-4" /> Enviar
          </button>
        )}
        {quotation.status === 'sent' && (
          <button 
            onClick={() => handleStatusChange('approved')}
            disabled={isUpdatingStatus}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl active:bg-emerald-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> Aprovar
          </button>
        )}
        <Link href={`/dashboard/quotations/${quotation.id}/edit`} className="flex items-center justify-center p-3 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl">
          <Edit2 className="w-5 h-5" />
        </Link>
        <button onClick={() => setIsShareModalOpen(true)} className="flex items-center justify-center p-3 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl">
          <Send className="w-5 h-5" />
        </button>
        <a href={`/api/view/${quotation.id}`} target="_blank" className="flex items-center justify-center p-3 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl">
          <Printer className="w-5 h-5" />
        </a>
      </div>

      <div className="flex flex-col gap-8">
        {/* Main Document View */}
        <div className="w-full space-y-6">
          <div className="bg-white p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
            <div className="flex justify-between items-start mb-10 pb-6 border-b border-[var(--color-outline-variant)]">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Para</h3>
                <p className="text-lg font-medium text-gray-900">{quotation.client_name}</p>
                {/* Aqui poderíamos mostrar os detalhes completos do cliente se estivessem populados no detalhe */}
              </div>
              <div className="text-right">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Detalhes</h3>
                <p className="text-gray-600">Emitido em: <span className="font-medium text-gray-900">{formatDate(quotation.date)}</span></p>
                <p className="text-gray-600">Válido até: <span className="font-medium text-gray-900">{formatDate(quotation.expiry_date)}</span></p>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left mb-8 min-w-[600px]">
                <thead>
                  <tr className="border-b-2 border-gray-800 text-sm">
                    <th className="py-3 font-semibold text-gray-800">Descrição</th>
                    <th className="py-3 font-semibold text-gray-800 text-center w-20">Qtd</th>
                    <th className="py-3 font-semibold text-gray-800 text-right w-32">Preço Unit.</th>
                    <th className="py-3 font-semibold text-gray-800 text-right w-24">IVA</th>
                    <th className="py-3 font-semibold text-gray-800 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 pr-4">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.description}</p>
                      </td>
                      <td className="py-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                      <td className="py-4 text-sm text-gray-600 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-4 text-sm text-gray-600 text-right">{item.vat_rate}%</td>
                      <td className="py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Desconto ({quotation.discount_type === 'percentage' ? `${quotation.discount}%` : 'Fixo'})</span>
                    <span>- {formatCurrency(
                      quotation.discount_type === 'percentage' 
                        ? quotation.subtotal * (quotation.discount / 100) 
                        : quotation.discount
                    )}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total IVA</span>
                  <span>{formatCurrency(quotation.vat_total)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-800">
                  <span className="font-bold text-gray-900">Total Final</span>
                  <span className="font-bold text-xl text-[var(--color-primary)]">{formatCurrency(quotation.grand_total)}</span>
                </div>
              </div>
            </div>

            {(quotation.notes || quotation.terms) && (
              <div className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-8">
                {quotation.notes && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.notes}</p>
                  </div>
                )}
                {quotation.terms && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Termos e Condições</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions & History */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
            <h3 className="text-headline-sm mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <button onClick={() => setIsShareModalOpen(true)} className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--color-primary)] text-white hover:bg-[#003ea8] rounded-md transition-all active:scale-[0.98] font-medium text-sm shadow-md shadow-[var(--color-primary)]/20">
                <Send className="w-4 h-4" /> Partilhar Proforma
              </button>
              <Link href={`/dashboard/pdf-preview/${quotation.id}`} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors font-medium text-sm mt-2">
                <FileText className="w-4 h-4" /> Visualizar PDF
              </Link>
            </div>
          </div>

          {/* Timeline / History */}
          <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[var(--color-outline-variant)]">
              <History className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="text-headline-sm">Histórico</h3>
            </div>

            <div className="space-y-6">
              {history.slice(0, showFullHistory ? undefined : 3).map((record, index, arr) => (
                <div key={record.id} className="relative pl-6">
                  {/* Linha conectora */}
                  {index !== arr.length - 1 && (
                    <div className="absolute left-2 top-6 bottom-[-24px] w-0.5 bg-gray-200"></div>
                  )}
                  {/* Ponto */}
                  <div className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] ring-4 ring-white"></div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">{record.action}</p>
                    {record.details && (
                      <p className="text-xs text-gray-600 mt-1">{record.details}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(record.created_at)}</p>
                  </div>
                </div>
              ))}
              
              {history.length > 3 && !showFullHistory && (
                <button 
                  onClick={() => setShowFullHistory(true)}
                  className="w-full mt-4 py-2 text-sm text-[var(--color-primary)] font-medium hover:bg-teal-50 rounded-lg transition-colors border border-transparent hover:border-teal-100"
                >
                  Ver todo o histórico ({history.length - 3} mais)
                </button>
              )}

              {showFullHistory && history.length > 3 && (
                <button 
                  onClick={() => setShowFullHistory(false)}
                  className="w-full mt-4 py-2 text-sm text-gray-500 font-medium hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Ocultar histórico
                </button>
              )}
              
              {history.length === 0 && (
                <p className="text-sm text-gray-500 italic text-center py-4">Nenhum histórico registado.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
      
      <ShareQuotationModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        quotation={quotation} 
        company={company!} 
        client={currentClient} 
        items={items} 
      />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuotationsStore } from "@/stores";
import { ArrowLeft, FileText, Send, CheckCircle2, XCircle, Printer, Download, Clock, History, FileDown, MoreVertical } from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

const statusConfig = {
  draft: { label: "Rascunho", icon: Clock, className: "bg-gray-100 text-gray-700 border-gray-200" },
  sent: { label: "Enviada", icon: Send, className: "bg-blue-100 text-blue-700 border-blue-200" },
  approved: { label: "Aprovada", icon: CheckCircle2, className: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Rejeitada", icon: XCircle, className: "bg-red-100 text-red-700 border-red-200" },
};

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { currentDetail, fetchQuotationDetail, updateStatus, isLoading } = useQuotationsStore();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20">
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

        <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
          <button className="flex items-center gap-2 px-4 py-2 border border-[var(--color-outline-variant)] bg-white hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          
          <Link href={`/dashboard/pdf-preview/${quotation.id}`} className="flex items-center gap-2 px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-container)] rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
            <FileText className="w-4 h-4" /> Gerar PDF
          </Link>

          {quotation.status === 'draft' && (
            <button 
              onClick={() => handleStatusChange('sent')}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[#003ea8] text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Send className="w-4 h-4" /> Marcar como Enviada
            </button>
          )}

          {quotation.status === 'sent' && (
            <button 
              onClick={() => handleStatusChange('approved')}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" /> Aprovar
            </button>
          )}

          <Link href={`/dashboard/quotations/${quotation.id}/edit`} className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
            Editar
          </Link>

          {quotation.status !== 'rejected' && quotation.status !== 'approved' && (
            <button 
              onClick={() => handleStatusChange('rejected')} 
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Rejeitar
            </button>
          )}

          {quotation.status !== 'draft' && (
            <button 
              onClick={() => handleStatusChange('draft')} 
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Reverter (Rascunho)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Document View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
            <div className="flex justify-between items-start mb-10 pb-6 border-b border-[var(--color-outline-variant)]">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Para</h3>
                <p className="text-lg font-medium text-gray-900">{quotation.client_name}</p>
                {/* Aqui poderíamos mostrar os detalhes completos do cliente se estivessem populados no detalhe */}
              </div>
              <div className="text-right">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Detalhes</h3>
                <p className="text-gray-600">Data: <span className="font-medium text-gray-900">{formatDate(quotation.date)}</span></p>
                <p className="text-gray-600">Validade: <span className="font-medium text-gray-900">{formatDate(quotation.expiry_date)}</span></p>
              </div>
            </div>

            <table className="w-full text-left mb-8">
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

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
            <h3 className="text-headline-sm mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <Link href={`/dashboard/pdf-preview/${quotation.id}`} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm">
                <FileText className="w-4 h-4" /> Visualizar PDF
              </Link>
              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors font-medium text-sm">
                <Send className="w-4 h-4" /> Enviar por Email
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-lg transition-colors font-medium text-sm">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar via WhatsApp
              </button>
            </div>
          </div>

          {/* Timeline / History */}
          <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[var(--color-outline-variant)]">
              <History className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="text-headline-sm">Histórico</h3>
            </div>

            <div className="space-y-6">
              {history.map((record, index) => (
                <div key={record.id} className="relative pl-6">
                  {/* Linha conectora */}
                  {index !== history.length - 1 && (
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
              
              {history.length === 0 && (
                <p className="text-sm text-gray-500 italic text-center py-4">Nenhum histórico registado.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

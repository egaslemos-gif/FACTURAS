import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, FileText, CheckCircle2, AlertCircle, Building2, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import PrintButton from '@/components/PrintButton';
import { fetchSharedProposal } from '@/lib/google/share-fetch';
import ViewTracker from '@/components/ViewTracker';

type Props = {
  params: Promise<{ id: string }>;
};

// --- DATA FETCHING (Server Side) ---
async function fetchProposalData(id: string) {
  return await fetchSharedProposal(id);
}

// --- OPEN GRAPH METADATA ---
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await fetchProposalData(resolvedParams.id);
  
  if (!data || !data.q || !data.cmp) {
    return {
      title: 'Proposta Comercial | Proforma360',
      description: 'Proposta não encontrada ou link expirado.',
    };
  }

  const { q: quotation, cmp: company } = data;
  const title = `Proposta Comercial ${quotation.quotation_number} — ${company.name}`;
  const description = `Valor Total: ${formatCurrency(quotation.grand_total)} | Válida até ${formatDate(quotation.expiry_date)}. Visualizar proposta comercial oficial enviada por ${company.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: company.name,
      images: company.logo_url 
        ? [{ url: company.logo_url }] 
        : [{ url: 'https://proforma360.vercel.app/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: company.logo_url ? [company.logo_url] : ['https://proforma360.vercel.app/og-image.png'],
    }
  };
}

// --- TEMPLATES ---

function MinimalTemplate({ quotation, client, company, items, diffDays, isExpiringSoon }: any) {
  return (
    <div className="bg-white border border-slate-100 shadow-soft rounded-xl print:shadow-none print:border-none print:rounded-none">
      <div className="p-8 sm:p-12 flex flex-col">
        {/* Top Header */}
        <div className="flex justify-between items-start mb-20">
            <div>
                {company.logo_url ? (
                  <img src={company.logo_url} alt="Logo" className="max-h-12 object-contain mb-2" />
                ) : (
                  <div className="text-3xl font-light tracking-tighter mb-1 text-black">{company.name}</div>
                )}
                <div className="text-sm text-gray-400 font-light max-w-xs whitespace-pre-wrap">{company.address}</div>
            </div>
            <div className="text-right">
                <div className="text-sm text-gray-800 border border-gray-200 rounded-full px-3 py-1 inline-block mb-4 uppercase tracking-widest text-[10px]">Proforma Invoice</div>
                <div className="text-sm text-gray-500 font-light">{quotation.quotation_number}</div>
                <div className="text-sm text-gray-500 font-light">Emitido: {formatDate(quotation.date)}</div>
                {diffDays > 0 && (
                  <div className={`text-xs mt-1 font-medium ${isExpiringSoon ? 'text-amber-600' : 'text-gray-400'}`}>
                    Válido até: {formatDate(quotation.expiry_date)}
                  </div>
                )}
            </div>
        </div>

        {/* Bill To & Total */}
        <div className="flex justify-between items-end mb-16">
            <div>
                <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-3">Faturar A</h3>
                <div className="text-base font-medium text-black">{client?.name || quotation.client_name}</div>
                <div className="text-sm text-gray-500 font-light leading-relaxed">
                    {client?.address && <p className="whitespace-pre-wrap">{client.address}</p>}
                    {client?.tax_number && <p>NUIT: {client.tax_number}</p>}
                </div>
            </div>
            <div className="text-right">
                <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-2">Total a Pagar</h3>
                <div className="text-5xl font-light tracking-tighter text-black">{formatCurrency(quotation.grand_total)}</div>
            </div>
        </div>

        {/* Items Table */}
        <div className="mb-12 flex-grow">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr>
                        <th className="py-3 border-b border-black text-xs text-gray-400 uppercase tracking-widest font-normal">Descrição</th>
                        <th className="py-3 border-b border-black text-xs text-gray-400 uppercase tracking-widest font-normal text-center">Qtd</th>
                        <th className="py-3 border-b border-black text-xs text-gray-400 uppercase tracking-widest font-normal text-right">Preço Un.</th>
                        <th className="py-3 border-b border-black text-xs text-gray-400 uppercase tracking-widest font-normal text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="font-light text-gray-800">
                    {items.map((item: any, i: number) => (
                      <tr key={i}>
                          <td className="py-5 border-b border-gray-100 pr-4">
                            <p className="whitespace-pre-wrap">{item.description}</p>
                            {item.vat_rate > 0 && <span className="text-[10px] text-gray-400">IVA: {item.vat_rate}%</span>}
                          </td>
                          <td className="py-5 border-b border-gray-100 text-center">{item.quantity}</td>
                          <td className="py-5 border-b border-gray-100 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="py-5 border-b border-gray-100 text-right text-black">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Subtotals */}
        <div className="flex justify-end mb-16">
            <div className="w-full sm:w-1/2">
                <div className="flex justify-between py-2 text-sm text-gray-500 font-light">
                    <span>Subtotal</span>
                    <span>{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex justify-between py-2 text-sm text-red-500 font-light">
                      <span>Desconto</span>
                      <span>-{formatCurrency(quotation.discount_type === 'percentage' ? (quotation.subtotal * quotation.discount / 100) : quotation.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-sm text-gray-500 font-light border-b border-gray-200">
                    <span>IVA</span>
                    <span>{formatCurrency(quotation.vat_total)}</span>
                </div>
                <div className="flex justify-between py-3 text-base text-black font-medium">
                    <span>Total Final</span>
                    <span>{formatCurrency(quotation.grand_total)}</span>
                </div>
            </div>
        </div>

        {/* Footer info */}
        <div className="mt-auto pt-8 border-t border-gray-200 flex justify-between text-xs text-gray-400 font-light">
            <div className="max-w-md">
                {(quotation.notes || quotation.terms) && (
                  <>
                    <p className="text-black font-medium mb-1">Notas e Termos</p>
                    <p className="whitespace-pre-wrap mb-4">{quotation.notes}</p>
                    <p className="whitespace-pre-wrap">{quotation.terms}</p>
                  </>
                )}
            </div>
            <div className="text-right">
                {company.email && <p>{company.email}</p>}
                {company.phone && <p>{company.phone}</p>}
                {company.tax_number && <p>NUIT: {company.tax_number}</p>}
            </div>
        </div>
      </div>
      
      {company.show_branding !== false && (
        <div className="p-8 text-center border-t border-slate-100 print:hidden">
          <a href="https://proforma360.vercel.app" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors text-xs font-medium tracking-wide">
            Generated with Proforma360 • Commercial Operating Workspace
          </a>
        </div>
      )}
    </div>
  );
}

function ModernTemplate({ quotation, client, company, items, diffDays, isExpiringSoon }: any) {
  return (
    <div className="bg-white shadow-soft relative text-slate-900 print:shadow-none print:m-0 font-sans overflow-hidden">
      {/* Top absolute bar */}
      <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
      
      <div className="p-8 sm:p-12 flex-grow flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-12">
              <div className="flex items-center gap-4">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="Logo" className="max-h-12 object-contain" />
                  ) : (
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                        {company.name.charAt(0)}
                    </div>
                  )}
                  <div>
                      <div className="text-xl font-bold text-slate-900 tracking-tight">{company.name}</div>
                      <div className="text-sm text-slate-500">{company.email || company.phone}</div>
                  </div>
              </div>
              <div className="flex flex-col items-start sm:items-end">
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-2" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Proforma</span>
                  <h2 className="text-2xl font-bold text-slate-400"># {quotation.quotation_number}</h2>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Dados do Cliente</h3>
                  <div className="font-semibold text-slate-900 text-base">{client?.name || quotation.client_name}</div>
                  <div className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{client?.address}</div>
                  {client?.tax_number && <div className="text-sm text-slate-600 mt-1 font-medium">NUIT: {client.tax_number}</div>}
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <div className="flex justify-between mb-3">
                      <span className="text-sm text-slate-500 font-medium">Emissão</span>
                      <span className="text-sm font-semibold text-slate-900">{formatDate(quotation.date)}</span>
                  </div>
                  <div className="flex justify-between mb-3">
                      <span className="text-sm text-slate-500 font-medium">Válido Até</span>
                      <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        {formatDate(quotation.expiry_date)}
                        {isExpiringSoon && <span className="w-2 h-2 rounded-full bg-amber-500" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></span>}
                      </span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-sm text-slate-500 font-medium">NUIT Emissor</span>
                      <span className="text-sm font-semibold text-slate-900">{company.tax_number || '---'}</span>
                  </div>
              </div>
          </div>

          <div className="mb-10 rounded-xl overflow-hidden border border-slate-200">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <tr>
                          <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                          <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase text-center">Qtd</th>
                          <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Preço Un.</th>
                          <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Total</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {items.map((item: any, i: number) => (
                        <tr key={i} className="bg-white">
                            <td className="py-4 px-6">
                                <div className="font-medium text-slate-900 whitespace-pre-wrap">{item.description}</div>
                                {item.vat_rate > 0 && <div className="text-slate-500 text-[10px] mt-1 font-medium">IVA: {item.vat_rate}%</div>}
                            </td>
                            <td className="py-4 px-6 text-center text-slate-600">{item.quantity}</td>
                            <td className="py-4 px-6 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                            <td className="py-4 px-6 text-right font-medium text-slate-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                  </tbody>
              </table>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end mb-8 mt-auto gap-8">
              <div className="w-full md:w-1/2">
                  {(quotation.notes || quotation.terms) && (
                    <>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Notas e Termos</h4>
                      <div className="text-xs text-slate-600 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 whitespace-pre-wrap" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          {quotation.notes && <p className="mb-2">{quotation.notes}</p>}
                          {quotation.terms && <p>{quotation.terms}</p>}
                      </div>
                    </>
                  )}
              </div>
              <div className="w-full md:w-1/2 bg-slate-900 rounded-2xl p-6 text-white shadow-lg print:bg-slate-900" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <div className="flex justify-between py-2 text-sm text-slate-300">
                      <span>Subtotal</span>
                      <span>{formatCurrency(quotation.subtotal)}</span>
                  </div>
                  {quotation.discount > 0 && (
                    <div className="flex justify-between py-2 text-sm text-red-300">
                        <span>Desconto</span>
                        <span>-{formatCurrency(quotation.discount_type === 'percentage' ? (quotation.subtotal * quotation.discount / 100) : quotation.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-sm text-slate-300 border-b border-slate-700 mb-3">
                      <span>IVA</span>
                      <span>{formatCurrency(quotation.vat_total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-base font-medium">Total Final</span>
                      <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{formatCurrency(quotation.grand_total)}</span>
                  </div>
              </div>
          </div>
      </div>
      
      {company.show_branding !== false && (
        <div className="p-4 text-center border-t border-slate-100 print:hidden bg-slate-50 mt-auto">
          <a href="https://proforma360.vercel.app" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-600 transition-colors text-[10px] font-semibold tracking-wide uppercase">
            Powered by Proforma360
          </a>
        </div>
      )}
    </div>
  );
}

function CorporateTemplate({ quotation, client, company, items, diffDays, isExpiringSoon }: any) {
  return (
    <div className="bg-white border border-slate-200/80 shadow-soft rounded-xl print:shadow-none print:border-none print:rounded-none overflow-hidden font-sans text-gray-800">
      
      {/* 1. Solid Dark Slate Header Banner */}
      <div className="bg-slate-900 text-white p-8 sm:p-12 flex flex-col sm:flex-row justify-between items-start gap-8" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <div className="flex flex-col max-w-md">
              <div className="flex items-center gap-4 mb-4">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="Logo" className="max-h-12 object-contain bg-white/10 rounded p-1" />
                  ) : (
                    <div className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                        <span className="text-slate-400">C/D</span> {company.name}
                    </div>
                  )}
              </div>
              
              {company.tax_number && <p className="text-sm font-bold text-slate-300 mb-1">NUIT: {company.tax_number}</p>}
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {company.address}
                  {(company.phone || company.email) && ` | ${[company.phone, company.email].filter(Boolean).join(" • ")}`}
              </p>
          </div>
          
          <div className="flex flex-col sm:text-right">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-wide uppercase">Proforma</h1>
              <div className="space-y-1 text-sm text-slate-300">
                  <p>Ref. <span className="font-semibold text-white">{quotation.quotation_number}</span></p>
                  <p>Emitido em: {formatDate(quotation.date)}</p>
                  <p>Válido até: {formatDate(quotation.expiry_date)}</p>
              </div>
          </div>
      </div>

      <div className="p-8 sm:p-12 flex flex-col">
          {/* Faturar A */}
          <div className="mb-10 pl-4 border-l-4 border-slate-900" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Faturar A</h3>
              <p className="font-bold text-lg text-slate-900">{client?.name || quotation.client_name}</p>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{client?.address}</p>
              {client?.tax_number && <p className="text-sm text-slate-600 mt-1 font-semibold">NUIT: {client.tax_number}</p>}
          </div>

          {/* Table */}
          <div className="mb-10">
              <table className="w-full text-sm border-collapse">
                  <thead>
                      <tr className="bg-slate-900 text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          <th className="p-4 text-left font-semibold">Descrição</th>
                          <th className="p-4 text-center font-semibold w-16">Qtd</th>
                          <th className="p-4 text-right font-semibold w-32">Preço Unitário</th>
                          <th className="p-4 text-center font-semibold w-20">IVA %</th>
                          <th className="p-4 text-right font-semibold w-32">Total</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                      {items.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-medium text-slate-900 whitespace-pre-wrap">{item.description}</td>
                            <td className="p-4 text-center text-slate-600">{item.quantity}</td>
                            <td className="p-4 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                            <td className="p-4 text-center text-slate-500 text-xs">{item.vat_rate}%</td>
                            <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                  </tbody>
              </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-12">
              <div className="w-full sm:w-1/2 md:w-2/5">
                  <div className="flex text-sm py-3 border-b border-slate-200">
                      <div className="w-1/2 font-bold text-slate-600">Subtotal</div>
                      <div className="w-1/2 text-right font-medium text-slate-900">{formatCurrency(quotation.subtotal)}</div>
                  </div>
                  {quotation.discount > 0 && (
                    <div className="flex text-sm py-3 border-b border-slate-200">
                        <div className="w-1/2 font-bold text-red-500">Desconto</div>
                        <div className="w-1/2 text-right font-medium text-red-500">-{formatCurrency(quotation.discount_type === 'percentage' ? (quotation.subtotal * quotation.discount / 100) : quotation.discount)}</div>
                    </div>
                  )}
                  <div className="flex text-sm py-3 border-b border-slate-200">
                      <div className="w-1/2 font-bold text-slate-600">Total IVA</div>
                      <div className="w-1/2 text-right font-medium text-slate-900">{formatCurrency(quotation.vat_total)}</div>
                  </div>
                  <div className="flex text-lg mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <div className="w-1/2 font-bold text-slate-900">TOTAL FINAL</div>
                      <div className="w-1/2 text-right font-bold text-slate-900">{formatCurrency(quotation.grand_total)}</div>
                  </div>
              </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-auto grid grid-cols-1 md:grid-cols-2 gap-12 text-sm pt-8 border-t border-slate-200">
              <div>
                  {quotation.terms && (
                    <div className="mb-6">
                      <h4 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-wider">Termos & Condições</h4>
                      <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{quotation.terms}</div>
                    </div>
                  )}
                  {quotation.notes && (
                      <div>
                          <h4 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-wider">Notas Adicionais</h4>
                          <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{quotation.notes}</div>
                      </div>
                  )}
              </div>
              <div className="flex flex-col justify-end items-end">
                  <div className="w-48 border-b-2 border-slate-800 mb-3" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
                  <p className="text-xs font-semibold text-slate-900 uppercase tracking-widest">Assinatura Autorizada</p>
                  <p className="text-xs text-slate-500 mt-1">{company.name}</p>
              </div>
          </div>
      </div>
      
      {company.show_branding !== false && (
        <div className="bg-slate-900 p-4 text-center print:hidden" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <a href="https://proforma360.vercel.app" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors text-[10px] font-semibold tracking-widest uppercase block">
            Powered by Proforma360
          </a>
        </div>
      )}
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default async function ViewProposalPage({ params }: Props) {
  const resolvedParams = await params;
  const data = await fetchProposalData(resolvedParams.id);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposta não encontrada</h1>
          <p className="text-gray-500 mb-6">O link pode estar incorreto, ter expirado ou a proposta foi removida pelo emissor.</p>
          <a href="/" className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
            Voltar à página inicial
          </a>
        </div>
      </div>
    );
  }

  const { q: quotation, c: client, cmp: company, i: items, expires_at } = data;

  if (expires_at && Date.now() > expires_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expirado</h1>
          <p className="text-gray-500 mb-6">Esta proposta comercial expirou a {new Date(expires_at).toLocaleDateString()}. Por favor contacte o emissor para solicitar um novo link.</p>
        </div>
      </div>
    );
  }

  const isApproved = quotation.status === 'approved';
  const isRejected = quotation.status === 'rejected';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(quotation.expiry_date);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isExpiringSoon = diffDays > 0 && diffDays <= 3;

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      <ViewTracker quotationId={quotation.id} />
      
      {/* Top Banner (Action Bar) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {company.logo_url ? (
               <img src={company.logo_url} alt="Logo" className="w-8 h-8 object-contain" />
             ) : (
               <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center text-white font-bold">P</div>
             )}
             <span className="font-bold text-gray-800 hidden sm:inline">{company.name}</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
             <a 
               href={`https://wa.me/${company.phone?.replace(/[^0-9]/g, '')}?text=Olá! Estou a ver a proposta comercial ${quotation.quotation_number}.`}
               target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#25D366] text-[#25D366] text-sm font-semibold rounded-lg hover:bg-green-50 transition-colors shadow-sm"
             >
               <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
               <span className="hidden sm:inline">WhatsApp</span>
             </a>
             <div className="bg-slate-900 text-white rounded-lg shadow-md hover:bg-slate-800 transition-colors">
               <PrintButton />
             </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-10">
        
        {/* Status Banner */}
        {isApproved && (
           <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800">
             <CheckCircle2 className="w-6 h-6 text-green-600" />
             <div>
               <h3 className="font-bold">Proposta Aprovada</h3>
               <p className="text-sm text-green-700">Obrigado pela preferência. Esta proposta já foi confirmada.</p>
             </div>
           </div>
        )}
        
        {isRejected && (
           <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800">
             <AlertCircle className="w-6 h-6 text-red-600" />
             <div>
               <h3 className="font-bold">Proposta Rejeitada ou Cancelada</h3>
               <p className="text-sm text-red-700">Esta proposta já não se encontra válida ou foi declinada.</p>
             </div>
           </div>
        )}

        {/* Paper Document rendered dynamically */}
        {company.pdf_template === 'modern' ? (
          <ModernTemplate quotation={quotation} client={client} company={company} items={items} diffDays={diffDays} isExpiringSoon={isExpiringSoon} />
        ) : company.pdf_template === 'corporate' ? (
          <CorporateTemplate quotation={quotation} client={client} company={company} items={items} diffDays={diffDays} isExpiringSoon={isExpiringSoon} />
        ) : (
          <MinimalTemplate quotation={quotation} client={client} company={company} items={items} diffDays={diffDays} isExpiringSoon={isExpiringSoon} />
        )}

      </main>
    </div>
  );
}

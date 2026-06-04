import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, FileText, CheckCircle2, AlertCircle, Building2, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import PrintButton from '@/components/PrintButton';
import { fetchSharedProposal } from '@/lib/google/share-fetch';

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
    <div className="card-premium overflow-hidden print:shadow-none print:border-none print:rounded-none">
      <div className="p-8 sm:p-12 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-4">
          {company.logo_url ? (
            <img src={company.logo_url} alt="Logo" className="max-h-24 object-contain" />
          ) : (
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{company.name}</h2>
          )}
          <div className="text-slate-500 text-sm space-y-1">
            {company.tax_number && <p>NUIT: {company.tax_number}</p>}
            {company.address && <p className="whitespace-pre-wrap max-w-xs">{company.address}</p>}
          </div>
        </div>
        <div className="text-left md:text-right w-full md:w-auto">
          <h1 className="text-3xl font-bold text-slate-200 uppercase tracking-widest mb-6">Proposta Comercial</h1>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 inline-block w-full md:w-auto text-left">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <span className="text-slate-500 font-medium">Referência:</span>
              <span className="font-bold text-slate-900 text-right">{quotation.quotation_number}</span>
              <span className="text-slate-500 font-medium">Data Emissão:</span>
              <span className="text-slate-900 font-medium text-right">{formatDate(quotation.date)}</span>
              <span className="text-slate-500 font-medium">Validade:</span>
              <span className={`font-semibold text-right flex flex-col items-end ${isExpiringSoon ? 'text-amber-600' : 'text-slate-900'}`}>
                {formatDate(quotation.expiry_date)}
                {diffDays > 0 && (
                  <span className="text-xs mt-0.5 px-2 py-0.5 bg-white border border-current rounded-full">
                    Expira em {diffDays} {diffDays === 1 ? 'dia' : 'dias'}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 sm:p-12 border-b border-gray-100 bg-slate-50/50">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Preparado Para</h3>
        <p className="text-xl font-bold text-slate-900 mb-1">{client?.name || quotation.client_name}</p>
        {client?.tax_number && <p className="text-sm text-slate-500 mb-1">NUIT: {client.tax_number}</p>}
        {client?.address && <p className="text-sm text-slate-500 max-w-md">{client.address}</p>}
      </div>

      <div className="p-8 sm:p-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 px-2 font-bold text-slate-400 uppercase tracking-wider text-xs w-1/2">Descrição</th>
                <th className="py-3 px-2 font-bold text-slate-400 uppercase tracking-wider text-xs text-center">Qtd</th>
                <th className="py-3 px-2 font-bold text-slate-400 uppercase tracking-wider text-xs text-right">Preço Un.</th>
                <th className="py-3 px-2 font-bold text-slate-400 uppercase tracking-wider text-xs text-right">IVA</th>
                <th className="py-3 px-2 font-bold text-slate-400 uppercase tracking-wider text-xs text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-2"><p className="text-sm font-medium text-slate-900 whitespace-pre-wrap leading-relaxed">{item.description}</p></td>
                  <td className="py-5 px-2 text-sm text-center text-slate-600 font-medium">{item.quantity}</td>
                  <td className="py-5 px-2 text-sm text-right text-slate-600 font-medium">{formatCurrency(item.unit_price)}</td>
                  <td className="py-5 px-2 text-sm text-right text-slate-400">{item.vat_rate}%</td>
                  <td className="py-5 px-2 text-sm font-bold text-right text-slate-900">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-12 gap-8">
          <div className="w-full md:w-1/2 space-y-4 text-sm text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            {quotation.notes && (
              <div>
                <h4 className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">Notas</h4>
                <p className="whitespace-pre-wrap leading-relaxed">{quotation.notes}</p>
              </div>
            )}
            {quotation.terms && (
              <div className={quotation.notes ? "pt-4 border-t border-slate-200" : ""}>
                <h4 className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">Termos e Condições</h4>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-500">{quotation.terms}</p>
              </div>
            )}
            {!quotation.notes && !quotation.terms && (
              <p className="text-slate-400 italic">Nenhuma nota adicional.</p>
            )}
          </div>
          <div className="w-full md:w-80 space-y-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Subtotal:</span><span className="font-bold text-slate-900">{formatCurrency(quotation.subtotal)}</span></div>
            {quotation.discount > 0 && (
              <div className="flex justify-between text-sm text-red-600"><span className="font-medium">Desconto:</span><span className="font-bold">-{formatCurrency(quotation.discount_type === 'percentage' ? (quotation.subtotal * quotation.discount / 100) : quotation.discount)}</span></div>
            )}
            <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Total IVA:</span><span className="font-bold text-slate-900">{formatCurrency(quotation.vat_total)}</span></div>
            <div className="flex justify-between items-end pt-4 mt-2 border-t border-slate-200"><span className="font-black text-slate-900 uppercase tracking-wider text-sm mb-1">Total Final:</span><span className="text-2xl font-black text-[#2563eb]">{formatCurrency(quotation.grand_total)}</span></div>
          </div>
        </div>
      </div>
      
      {company.show_branding !== false && (
        <div className="p-8 bg-slate-900 text-center rounded-b-2xl border-t border-slate-800 print:bg-white print:border-none print:text-left print:p-0 print:pt-8 print:mt-8">
          <p className="text-slate-400 text-sm print:text-slate-900">Desenvolvido com <Link href="/" className="text-white font-bold hover:underline transition-colors print:text-slate-900">Proforma360</Link></p>
          <p className="text-slate-500 text-xs mt-1.5 font-medium tracking-wide print:text-slate-500">SOFTWARE PROFISSIONAL DE ORÇAMENTAÇÃO & CRM</p>
        </div>
      )}
    </div>
  );
}

function ModernTemplate({ quotation, client, company, items, diffDays, isExpiringSoon }: any) {
  return (
    <div className="card-premium overflow-hidden print:shadow-none print:rounded-none">
      {/* Header Solid Color */}
      <div className="bg-[#003d99] p-8 sm:p-12 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-4">
            {company.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="max-h-20 object-contain bg-white/10 p-2 rounded-lg" />
            ) : (
              <h2 className="text-3xl font-black tracking-tight">{company.name}</h2>
            )}
            <div className="text-blue-100 text-sm space-y-1">
              {company.tax_number && <p>NUIT: {company.tax_number}</p>}
              {company.address && <p className="whitespace-pre-wrap max-w-xs">{company.address}</p>}
            </div>
          </div>
          <div className="text-left md:text-right w-full md:w-auto">
            <h1 className="text-3xl font-bold uppercase tracking-widest mb-4">Proforma</h1>
            <div className="space-y-1 text-sm text-blue-100">
              <p><span className="font-semibold text-white">Nº:</span> {quotation.quotation_number}</p>
              <p><span className="font-semibold text-white">Data:</span> {formatDate(quotation.date)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 sm:p-12 pb-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-slate-50 rounded-xl p-6 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Faturar A</h3>
            <p className="text-lg font-bold text-[#003d99] mb-1">{client?.name || quotation.client_name}</p>
            {client?.tax_number && <p className="text-sm text-slate-600 mb-1">NUIT: {client.tax_number}</p>}
            {client?.address && <p className="text-sm text-slate-600">{client.address}</p>}
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-6 border border-slate-100">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Detalhes</h3>
             <div className="text-sm text-slate-600 space-y-2">
               <p><span className="font-medium">Validade:</span> <span className={isExpiringSoon ? 'text-amber-600 font-bold' : ''}>{formatDate(quotation.expiry_date)}</span></p>
               {diffDays > 0 && <p className="text-xs text-slate-400">Expira em {diffDays} {diffDays === 1 ? 'dia' : 'dias'}</p>}
             </div>
          </div>
        </div>
      </div>

      <div className="p-8 sm:p-12 pt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#003d99] text-white">
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs w-1/2 rounded-tl-lg print:rounded-none">Descrição</th>
                <th className="py-3 px-2 font-bold uppercase tracking-wider text-xs text-center">Qtd</th>
                <th className="py-3 px-2 font-bold uppercase tracking-wider text-xs text-right">Preço Un.</th>
                <th className="py-3 px-2 font-bold uppercase tracking-wider text-xs text-right">IVA</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right rounded-tr-lg print:rounded-none">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item: any, i: number) => (
                <tr key={i} className="even:bg-slate-50 transition-colors">
                  <td className="py-4 px-4"><p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{item.description}</p></td>
                  <td className="py-4 px-2 text-sm text-center text-slate-600">{item.quantity}</td>
                  <td className="py-4 px-2 text-sm text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                  <td className="py-4 px-2 text-sm text-right text-slate-500">{item.vat_rate}%</td>
                  <td className="py-4 px-4 text-sm font-bold text-right text-slate-900">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start mt-8 gap-8">
          <div className="w-full md:w-1/2 space-y-4 text-sm text-slate-600">
            {quotation.notes && (
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Notas</h4>
                <p className="whitespace-pre-wrap leading-relaxed">{quotation.notes}</p>
              </div>
            )}
            {quotation.terms && (
              <div className={quotation.notes ? "pt-4" : ""}>
                <h4 className="font-bold text-slate-800 mb-1">Termos e Condições</h4>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-500">{quotation.terms}</p>
              </div>
            )}
          </div>
          <div className="w-full md:w-80 space-y-3 p-6 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal:</span><span className="font-bold text-slate-900">{formatCurrency(quotation.subtotal)}</span></div>
            {quotation.discount > 0 && (
              <div className="flex justify-between text-sm text-red-600"><span>Desconto:</span><span className="font-bold">-{formatCurrency(quotation.discount_type === 'percentage' ? (quotation.subtotal * quotation.discount / 100) : quotation.discount)}</span></div>
            )}
            <div className="flex justify-between text-sm"><span className="text-slate-500">Total IVA:</span><span className="font-bold text-slate-900">{formatCurrency(quotation.vat_total)}</span></div>
            <div className="flex justify-between items-end pt-3 mt-1 border-t border-slate-200"><span className="font-bold text-[#003d99] text-sm">TOTAL FINAL:</span><span className="text-xl font-black text-[#003d99]">{formatCurrency(quotation.grand_total)}</span></div>
          </div>
        </div>
      </div>
      {company.show_branding !== false && (
        <div className="p-6 bg-slate-50 text-center border-t border-slate-100 print:bg-white print:border-none print:text-left print:p-0 print:pt-8 print:mt-8">
          <p className="text-slate-400 text-sm">Desenvolvido com <Link href="/" className="text-[#003d99] font-bold hover:underline">Proforma360</Link></p>
        </div>
      )}
    </div>
  );
}

function CorporateTemplate({ quotation, client, company, items, diffDays, isExpiringSoon }: any) {
  return (
    <div className="card-premium overflow-hidden print:shadow-none print:border-none print:m-0">
      <div className="p-8 sm:p-12 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-4">
          {company.logo_url ? (
            <img src={company.logo_url} alt="Logo" className="max-h-20 object-contain" />
          ) : (
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">{company.name}</h2>
          )}
          <div className="text-slate-600 text-sm space-y-1">
            {company.tax_number && <p>NUIT: {company.tax_number}</p>}
            {company.address && <p className="whitespace-pre-wrap max-w-xs">{company.address}</p>}
          </div>
        </div>
        <div className="text-left md:text-right w-full md:w-auto flex flex-col items-start md:items-end">
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-widest mb-6">Proforma</h1>
          <div className="border border-slate-300 bg-slate-50 p-4 w-full md:w-64 text-left">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="font-bold text-slate-700">Nº Doc:</span>
              <span className="text-slate-900 text-right">{quotation.quotation_number}</span>
              <span className="font-bold text-slate-700">Data:</span>
              <span className="text-slate-900 text-right">{formatDate(quotation.date)}</span>
              <span className="font-bold text-slate-700">Validade:</span>
              <span className={`text-right ${isExpiringSoon ? 'text-amber-600 font-bold' : 'text-slate-900'}`}>{formatDate(quotation.expiry_date)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 sm:px-12">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-2">Faturar A</h3>
        <hr className="border-slate-300 mb-4" />
        <p className="text-lg font-bold text-slate-900 mb-1">{client?.name || quotation.client_name}</p>
        {client?.tax_number && <p className="text-sm text-slate-700 mb-1">NUIT: {client.tax_number}</p>}
        {client?.address && <p className="text-sm text-slate-700 max-w-md">{client.address}</p>}
      </div>

      <div className="p-8 sm:p-12 mt-4">
        <div className="overflow-x-auto border border-slate-300">
          <table className="w-full text-left border-collapse bg-white">
            <thead className="bg-slate-100 border-b border-slate-300">
              <tr>
                <th className="py-2 px-3 font-bold text-slate-800 text-xs w-1/2 border-r border-slate-300">Descrição</th>
                <th className="py-2 px-3 font-bold text-slate-800 text-xs text-center border-r border-slate-300">Qtd</th>
                <th className="py-2 px-3 font-bold text-slate-800 text-xs text-right border-r border-slate-300">Preço Un.</th>
                <th className="py-2 px-3 font-bold text-slate-800 text-xs text-right border-r border-slate-300">IVA</th>
                <th className="py-2 px-3 font-bold text-slate-800 text-xs text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {items.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="py-3 px-3 border-r border-slate-300"><p className="text-sm text-slate-800 whitespace-pre-wrap">{item.description}</p></td>
                  <td className="py-3 px-3 text-sm text-center text-slate-800 border-r border-slate-300">{item.quantity}</td>
                  <td className="py-3 px-3 text-sm text-right text-slate-800 border-r border-slate-300">{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 px-3 text-sm text-right text-slate-800 border-r border-slate-300">{item.vat_rate}%</td>
                  <td className="py-3 px-3 text-sm font-bold text-right text-slate-900">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start mt-8 gap-8">
          <div className="w-full md:w-1/2 space-y-4 text-sm text-slate-700">
            {quotation.notes && (
              <div>
                <h4 className="font-bold text-slate-900 mb-1 uppercase text-xs">Notas</h4>
                <p className="whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            )}
            {quotation.terms && (
              <div className={quotation.notes ? "pt-4" : ""}>
                <h4 className="font-bold text-slate-900 mb-1 uppercase text-xs">Termos e Condições</h4>
                <p className="whitespace-pre-wrap">{quotation.terms}</p>
              </div>
            )}
          </div>
          <div className="w-full md:w-72 p-4 bg-slate-50 border border-slate-300">
            <div className="flex justify-between text-sm mb-2"><span className="text-slate-700">Subtotal:</span><span className="font-medium text-slate-900">{formatCurrency(quotation.subtotal)}</span></div>
            {quotation.discount > 0 && (
              <div className="flex justify-between text-sm text-slate-700 mb-2"><span>Desconto:</span><span className="font-medium">-{formatCurrency(quotation.discount_type === 'percentage' ? (quotation.subtotal * quotation.discount / 100) : quotation.discount)}</span></div>
            )}
            <div className="flex justify-between text-sm mb-4"><span className="text-slate-700">Total IVA:</span><span className="font-medium text-slate-900">{formatCurrency(quotation.vat_total)}</span></div>
            <hr className="border-slate-300 mb-3" />
            <div className="flex justify-between items-end"><span className="font-bold text-slate-900 text-sm">TOTAL FINAL:</span><span className="text-lg font-bold text-slate-900">{formatCurrency(quotation.grand_total)}</span></div>
          </div>
        </div>
      </div>
      {company.show_branding !== false && (
        <div className="p-4 border-t border-slate-300 text-center print:bg-white print:border-none print:text-left print:p-0 print:pt-8 print:mt-8">
          <p className="text-slate-500 text-xs">Desenvolvido com <Link href="/" className="font-bold hover:underline text-slate-700">Proforma360</Link></p>
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

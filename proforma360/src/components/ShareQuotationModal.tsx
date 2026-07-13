import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Mail, Download, Link2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { Quotation, Company, Client } from '@/lib/types';
import { useQuotationsStore } from '@/stores';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { useLicenseStore } from '@/stores/licenseStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { generateQuotationPDF } from '@/lib/pdf/generator';
import { generateProposalPDFFromTemplate } from '@/lib/pdf/proposalClientExport';
import { parseSavedProposal } from '@/components/commercial/proposalTypes';
import { proposalHasContent } from '@/components/commercial/proposalContent';
import type { SavedProposalData } from '@/components/commercial/proposalTypes';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation;
  company: Company;
  client: Client | null;
  items: any[];
}

export default function ShareQuotationModal({ isOpen, onClose, quotation, company, client, items }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'link'>('email');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offlineWarning, setOfflineWarning] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showAssistant, setShowAssistant] = useState<{ platform: string, url: string } | null>(null);
  
  const [shareId, setShareId] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState('');
  
  const [whatsappText, setWhatsappText] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBodyPlain, setEmailBodyPlain] = useState('');
  // Calculate real validity from quotation dates
  const validityDays = Math.max(1, Math.round((new Date(quotation.expiry_date).getTime() - new Date(quotation.date).getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.ceil((new Date(quotation.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const expiryDateFormatted = formatDate(quotation.expiry_date);
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [attachTechnicalProposal, setAttachTechnicalProposal] = useState(false);
  const [hasTechnicalProposal, setHasTechnicalProposal] = useState(false);
  const [savedProposal, setSavedProposal] = useState<SavedProposalData | null>(null);
  
  const { markAsSent, fetchCommercialProposal } = useQuotationsStore();
  
  const htmlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;

    async function loadProposal() {
      try {
        const existing = await fetchCommercialProposal(quotation.id);
        if (isMounted && existing?.content) {
          const parsed = parseSavedProposal(existing.content);
          const hasContent = proposalHasContent(parsed.sections || {}, parsed.customSections);
          setHasTechnicalProposal(hasContent);
          setSavedProposal(parsed);
        } else if (isMounted) {
          setHasTechnicalProposal(false);
          setSavedProposal(null);
        }
      } catch {
        if (isMounted) {
          setHasTechnicalProposal(false);
          setSavedProposal(null);
        }
      }
    }

    loadProposal();
    
    async function generateShareLink() {
      const { isOnline } = useNetworkStore.getState();

      // O limite é verificado rigorosamente na criação da proforma.
      // O utilizador tem total permissão para partilhar as proformas que conseguiu criar dentro do seu limite.

      if (!isOnline) {
        if (isMounted) {
          setOfflineWarning('Modo Offline: A partilha por Link Seguro e rastreio de visualização estão suspensos. Pode ainda assim descarregar ou partilhar o PDF (Premium Flow / WhatsApp / App de Email).');
          setIsLoading(false);
          const clientName = client?.name || quotation.client_name || 'Cliente';
          const cName = company?.name || 'A Empresa';
          
          let wText = `📄 *Proposta Comercial ${quotation.quotation_number}*\n\nOlá ${clientName},\nSegue a nossa proposta comercial para sua apreciação.\n\n*Valor Total:* ${formatCurrency(quotation.grand_total)}\n*Válido até:* ${expiryDateFormatted} (${validityDays} dias)\n\n(O ficheiro PDF segue em anexo.)\n\nCom os melhores cumprimentos,\n${cName}`;

          if (company.show_branding !== false) {
             wText += `\n\n---\n⚡ Powered by Proforma360`;
          }
          
          setWhatsappText(wText);
          setEmailSubject(`Proposta Comercial ${quotation.quotation_number} — ${cName}`);
          setEmailBodyPlain(`Estimado(a) ${clientName},\n\nSegue em anexo a nossa proposta comercial número ${quotation.quotation_number}.\n\nValor: ${formatCurrency(quotation.grand_total)}\nVálido até: ${expiryDateFormatted} (${validityDays} dias)\n\nCaso tenha alguma dúvida, não hesite em contactar-nos.\n\nCom os melhores cumprimentos,\n${cName}`);
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const cmpToShare = { ...company };
        delete (cmpToShare as any).logo;
        delete (cmpToShare as any).stamp;
        delete (cmpToShare as any).signature;

        const payload = {
          q: quotation,
          c: client,
          cmp: cmpToShare,
          i: items,
          expires_at: new Date(quotation.expiry_date).getTime()
        };

        const res = await fetch('/api/drive/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to generate link');

        if (isMounted) {
          setShareId(data.shareId);
          const url = `${window.location.origin}/view/${data.shareId}`;
          setPublicUrl(url);
          
          const clientName = client?.name || quotation.client_name || 'Cliente';
          const cName = company?.name || 'A Empresa';
          
          let wText = `📄 *Proposta Comercial ${quotation.quotation_number}*\n\nOlá ${clientName},\nA sua proposta comercial já se encontra disponível para consulta.\n\n*Valor Total:* ${formatCurrency(quotation.grand_total)}\n*Válido até:* ${expiryDateFormatted} (${validityDays} dias)\n\n🔗 *Ver proposta e PDF:*\n${url}\n\nCom os melhores cumprimentos,\n${cName}`;

          if (company.show_branding !== false) {
             wText += `\n\n---\n⚡ Powered by Proforma360\nGestão comercial moderna para empresas.\nhttps://proforma360.vercel.app`;
          }
          
          setWhatsappText(wText);
          
          setEmailSubject(`Proposta Comercial ${quotation.quotation_number} — ${cName}`);
          setEmailBodyPlain(`Estimado(a) ${clientName},\n\nSegue a nossa proposta comercial número ${quotation.quotation_number}.\n\nValor: ${formatCurrency(quotation.grand_total)}\nVálido até: ${expiryDateFormatted} (${validityDays} dias)\n\nPode aceder à proposta no link abaixo:\n${url}\n\nCaso tenha alguma dúvida, não hesite em contactar-nos.\n\nCom os melhores cumprimentos,\n${cName}`);
          
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error(err);
        if (isMounted) {
          setError(err.message || 'Erro ao gerar link de partilha.');
          setIsLoading(false);
        }
      }
    }
    
    generateShareLink();
    
    return () => { isMounted = false; };
  }, [isOpen, quotation.id]);

  const downloadPdfBlob = (bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
    const urlObj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(urlObj);
  };

  const buildShareFiles = async (): Promise<File[]> => {
    const files: File[] = [];
    const proformaBytes = await generateQuotationPDF({ quotation, company, client: client as Client, items });
    files.push(new File([proformaBytes as BlobPart], `Proforma_${quotation.quotation_number}.pdf`, { type: 'application/pdf' }));

    if (attachTechnicalProposal && savedProposal) {
      const proposalBytes = await generateProposalPDFFromTemplate({
        company,
        client: client as Client,
        quotation,
        items,
        sections: savedProposal.sections,
        customSections: savedProposal.customSections,
        visibility: savedProposal.visibility,
        template: savedProposal.template || "executivo",
      });
      files.push(new File([proposalBytes as BlobPart], `Proposta_${quotation.quotation_number}.pdf`, { type: 'application/pdf' }));
    }
    return files;
  };

  if (!isOpen) return null;

  // Clear assistant on unmount or close handled by parent
  const handleClose = () => {
    setShowAssistant(null);
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      if (quotation.status === 'draft') await markAsSent(quotation.id);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {}
  };

  const handleCopyHtmlEmail = async () => {
    if (!htmlRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const html = htmlRef.current.innerHTML;
      const plain = emailBodyPlain;
      
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' })
      });
      
      await navigator.clipboard.write([clipboardItem]);
      setCopiedHtml(true);
      
      // Auto-download PDF(s) so they can attach them
      const files = await buildShareFiles();
      for (const file of files) {
        downloadPdfBlob(new Uint8Array(await file.arrayBuffer()), file.name);
      }

      if (quotation.status === 'draft') await markAsSent(quotation.id);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch (err) {
      console.error(err);
      alert('Erro ao copiar formato HTML. O seu browser pode não suportar esta funcionalidade.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleNativeShare = async (platform: 'whatsapp' | 'email' | 'email-web') => {
    try {
      setIsGeneratingPdf(true);
      const files = await buildShareFiles();

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
      
      const useNativeShare = isMobile && platform !== 'email-web' && navigator.canShare && navigator.canShare({ files });

      if (useNativeShare) {
        await navigator.share({
          files,
          title: emailSubject,
          text: platform === 'whatsapp' ? whatsappText : emailBodyPlain
        });
        if (quotation.status === 'draft') await markAsSent(quotation.id);
      } else {
        for (const file of files) {
          downloadPdfBlob(new Uint8Array(await file.arrayBuffer()), file.name);
        }
        
        let linkUrl = '';
        if (platform === 'whatsapp') {
          linkUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
        } else if (platform === 'email') {
          linkUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyPlain)}`;
        } else {
          linkUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyPlain)}`;
        }
        
        setShowAssistant({ platform, url: linkUrl });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        alert('Erro ao partilhar o anexo nativamente.');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[var(--color-surface-elevated)] w-full max-w-2xl rounded-[var(--radius-lg)] elevation-3 border border-[var(--color-outline-variant)] overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-elevated)]">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Partilhar Proposta</h3>
            <p className="text-sm text-gray-500 mt-0.5">{quotation.quotation_number}</p>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-700 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-gray-600 font-medium animate-pulse">A gerar link público seguro no Google Drive...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button onClick={handleClose} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md font-medium">Voltar</button>
          </div>
        ) : showAssistant ? (
          <div className="p-8 bg-gray-50/50 flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">PDF Descarregado!</h3>
              <p className="text-sm text-gray-500 mt-2">Os navegadores Desktop não permitem anexação automática, siga estes 2 passos:</p>
            </div>

            <div className="space-y-6 relative max-w-md mx-auto">
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-blue-200"></div>
              
              <div className="flex gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg border-4 border-gray-50 shadow-sm shrink-0">1</div>
                <div className="pt-2">
                  <h4 className="font-bold text-gray-900">Abra a sua aplicação</h4>
                  <p className="text-sm text-gray-600 mb-3">Clique no botão abaixo para abrir a mensagem (o texto já vai preenchido).</p>
                  <a 
                    href={showAssistant.url} 
                    target={showAssistant.platform === 'email' ? '_self' : '_blank'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition-colors"
                  >
                    Abrir {showAssistant.platform === 'whatsapp' ? 'WhatsApp Web' : showAssistant.platform === 'email' ? 'App de Email' : 'Gmail Web'}
                  </a>
                </div>
              </div>
              
              <div className="flex gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg border-4 border-gray-50 shadow-sm shrink-0">2</div>
                <div className="pt-2">
                  <h4 className="font-bold text-gray-900">Anexe o ficheiro descarregado</h4>
                  <p className="text-sm text-gray-600">Na janela que abrir, clique em <strong>Anexar</strong> (ou arraste) e selecione o ficheiro <strong>Proforma_{quotation.quotation_number}.pdf</strong> que está nas suas Transferências.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
              <button onClick={() => setShowAssistant(null)} className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Voltar às opções de partilha
              </button>
            </div>
          </div>
        ) : (
          <>
            {offlineWarning && (
              <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium leading-relaxed">{offlineWarning}</p>
              </div>
            )}

            {/* Anexar proposta técnica */}
            {hasTechnicalProposal && (
              <div className="px-6 pt-4">
                <label className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-teal-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={attachTechnicalProposal}
                    onChange={(e) => setAttachTechnicalProposal(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">Anexar Proposta Técnica</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Inclui um segundo PDF (<strong>Proposta_{quotation.quotation_number}.pdf</strong>) com o mesmo modelo guardado no Proposal Studio.
                      {!savedProposal?.template && " Modelo: Executivo (predefinido)."}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Tabs */}
            <div className="flex p-3 gap-2 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-elevated)] overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('email')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'email' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Mail className="w-4 h-4" /> Email Premium
              </button>
              <button 
                onClick={() => setActiveTab('whatsapp')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'whatsapp' ? 'bg-[#25D366] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button 
                onClick={() => setActiveTab('link')}
                disabled={!!offlineWarning}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'link' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'} ${!!offlineWarning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Link2 className="w-4 h-4" /> Link Direto
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
              
              {/* --- EMAIL TAB --- */}
              {activeTab === 'email' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  
                  {/* Premium Flow (HTML) */}
                  <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-blue-900">Premium Flow (HTML)</h4>
                        <p className="text-xs text-blue-700 mt-0.5">Copie e cole diretamente no Gmail ou Outlook Web.</p>
                      </div>
                      <button 
                        onClick={handleCopyHtmlEmail}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${copiedHtml ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {copiedHtml ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedHtml ? 'Copiado!' : 'Copiar Email'}
                      </button>
                    </div>
                    
                    <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2 text-sm text-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p><strong>Nota:</strong> Ao clicar em copiar, {attachTechnicalProposal ? 'os PDFs são descarregados' : 'o PDF é automaticamente descarregado'} para as suas Transferências. Cole este texto no seu email e arraste {attachTechnicalProposal ? 'os ficheiros' : 'o ficheiro PDF'} para os anexos.</p>
                    </div>

                    <div className="p-4 border-b border-gray-100 bg-gray-50 text-sm">
                      <span className="font-semibold text-gray-500 mr-2">Assunto:</span>
                      <span className="font-medium text-gray-900">{emailSubject}</span>
                    </div>

                    {/* HTML Preview (This div will be copied to clipboard) */}
                    <div className="p-6 bg-white" ref={htmlRef}>
                      <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto', color: '#1f2937', lineHeight: '1.6' }}>
                        
                        {/* Header */}
                        <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ marginBottom: '24px' }}>
                          <tbody>
                            <tr>
                              <td align="center">
                                {company.logo_url && (
                                  <img src={company.logo_url} alt={company.name} style={{ maxHeight: '48px', marginBottom: '8px' }} />
                                )}
                                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '8px 0 0 0' }}>Proposta Comercial</h2>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                        {/* Body */}
                        <p style={{ fontSize: '16px', color: '#1f2937', marginBottom: '20px' }}>
                          Estimado(a) <strong>{client?.name || quotation.client_name}</strong>,
                        </p>
                        
                        <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '24px' }}>
                          Junto enviamos a nossa proposta comercial para sua apreciação. O ficheiro PDF encontra-se em anexo a este email.
                        </p>

                        {/* Summary Box */}
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '32px' }}>
                          <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                            <tbody>
                              <tr>
                                <td style={{ paddingBottom: '8px', fontSize: '14px', color: '#64748b' }}>Ref.:</td>
                                <td style={{ paddingBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0f172a', textAlign: 'right' }}>{quotation.quotation_number}</td>
                              </tr>
                              <tr>
                                <td style={{ paddingBottom: '8px', fontSize: '14px', color: '#64748b' }}>Valor Total:</td>
                                <td style={{ paddingBottom: '8px', fontSize: '15px', fontWeight: 'bold', color: '#2563eb', textAlign: 'right' }}>{formatCurrency(quotation.grand_total)}</td>
                              </tr>
                              <tr>
                                <td style={{ fontSize: '14px', color: '#64748b' }}>Válido até:</td>
                                <td style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', textAlign: 'right' }}>{expiryDateFormatted} ({validityDays} dias)</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        {/* CTA Button */}
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                          <a href={publicUrl} target="_blank" style={{
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            padding: '14px 28px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            display: 'inline-block',
                            fontSize: '15px'
                          }}>
                            View Commercial Proposal
                          </a>
                        </div>
                        
                        {/* Fallback Link */}
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 4px 0' }}>Ou copie este link:</p>
                          <a href={publicUrl} target="_blank" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'underline' }}>{publicUrl}</a>
                        </div>
                        
                        {/* Signature */}
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                          <p style={{ fontSize: '14px', margin: '0 0 8px 0', color: '#4b5563' }}>Com os melhores cumprimentos,</p>
                          <p style={{ fontSize: '15px', margin: '0 0 4px 0', fontWeight: '700', color: '#111827' }}>{company.name}</p>
                          {(company.phone || company.email) && (
                            <p style={{ fontSize: '13px', margin: '0', color: '#64748b' }}>
                              {company.phone && <span>{company.phone}</span>}
                              {company.phone && company.email && <span> • </span>}
                              {company.email && <a href={`mailto:${company.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{company.email}</a>}
                            </p>
                          )}
                        </div>
                        
                        {/* Powered By Footer */}
                        {company.show_branding !== false && (
                          <div style={{ marginTop: '48px', paddingTop: '16px', textAlign: 'center' }}>
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0' }}>
                              Powered by <strong>Proforma360</strong><br/>
                              <span style={{ fontSize: '11px' }}>Professional Quotations & CRM</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Plain Text Flow */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm">Alternativa: Abrir App de Email (Texto Simples)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleNativeShare('email')}
                        disabled={isGeneratingPdf}
                        className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white py-2.5 rounded-md font-semibold text-sm transition-all disabled:opacity-70"
                      >
                        {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} 
                        {isGeneratingPdf ? 'A preparar...' : 'App Desktop/Mobile (Anexo)'}
                      </button>
                      <button 
                        onClick={() => handleNativeShare('email-web')}
                        disabled={isGeneratingPdf}
                        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-md font-semibold text-sm transition-all disabled:opacity-70"
                      >
                        {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} 
                        {isGeneratingPdf ? 'A preparar...' : 'Gmail Web (Anexo)'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- WHATSAPP TAB --- */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-green-50 p-4 border-l-4 border-green-500 rounded-r-md">
                    <p className="text-sm text-green-800 font-medium">Use a Partilha Nativa no telemóvel para enviar automaticamente com o PDF. No computador, o PDF será descarregado para anexar.</p>
                  </div>
                  <div className="bg-[#EFEAE2] p-6 rounded-xl border border-gray-200 shadow-inner flex flex-col items-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r9s4E3mJ1qR.png')] bg-repeat opacity-10 mix-blend-multiply"></div>
                    
                    <div className="relative w-full max-w-sm">
                      {/* Tail */}
                      <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-[7px] text-white fill-current">
                        <path d="M5.188 1H0v11.142c0 .873 1.066 1.3 1.672.673l3.35-3.405C6.782 7.64 7.66 5.485 7.66 3.238V1H5.188z" />
                      </svg>
                      
                      {/* Bubble */}
                      <div className="bg-white p-2.5 rounded-b-xl rounded-tr-xl shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] text-[15px] leading-relaxed text-[#111B21] whitespace-pre-wrap">
                        {whatsappText.split('\n').map((line, i) => (
                          <React.Fragment key={i}>
                            {line.split(/(\*[^*]+\*)/g).map((part, j) => {
                              if (part.startsWith('*') && part.endsWith('*')) {
                                return <strong key={j} className="font-semibold">{part.slice(1, -1)}</strong>;
                              }
                              return part;
                            })}
                            <br />
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-5 relative z-10 bg-[#EFEAE2] px-2">Preview no WhatsApp</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleNativeShare('whatsapp')}
                      disabled={isGeneratingPdf}
                      className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 rounded-xl font-bold shadow-sm transition-all disabled:opacity-70"
                    >
                      {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />} 
                      {isGeneratingPdf ? 'A preparar...' : 'Enviar com Anexo'}
                    </button>
                    <a 
                      href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => quotation.status === 'draft' && markAsSent(quotation.id)}
                      className="w-full flex items-center justify-center gap-2 bg-white border-2 border-[#25D366] text-[#25D366] hover:bg-green-50 py-3.5 rounded-xl font-bold shadow-sm transition-all"
                    >
                      <Link2 className="w-5 h-5" /> Só Enviar Link
                    </a>
                  </div>
                </div>
              )}

              {/* --- LINK TAB --- */}
              {activeTab === 'link' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pt-4">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Link2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Link Seguro Partilhável</h4>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Este link está alojado de forma segura no seu Google Drive. Qualquer pessoa com o link pode visualizar a proposta. Válido até {expiryDateFormatted}.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 bg-white border-2 border-purple-100 rounded-xl shadow-sm">
                    <input 
                      type="text" 
                      readOnly 
                      value={publicUrl} 
                      className="bg-transparent border-none outline-none w-full text-sm text-gray-700 font-medium px-3"
                    />
                    <button 
                      onClick={handleCopyLink}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors ${copiedLink ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  
                  <div className="flex justify-center mt-6">
                     <a href={publicUrl} target="_blank" className="text-purple-600 text-sm font-semibold hover:underline flex items-center gap-1">
                       Testar Link Público <Link2 className="w-3 h-3" />
                     </a>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

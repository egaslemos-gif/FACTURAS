import React, { useState } from 'react';
import { X, MessageCircle, Mail, Link2, Check, Copy } from 'lucide-react';
import { getPremiumInviteEmailHtml } from '@/lib/email/templates/premiumInviteTemplate';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareAppModal({ isOpen, onClose }: ShareAppModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const { data: session } = useSession();

  if (!isOpen) return null;
  const userName = session?.user?.name?.split(' ')[0] || '';
  
  const subject = "Otimize a gestão comercial com o Proforma360";
  const text = `🚀 Crie propostas comerciais profissionais em segundos.

✅ PDFs elegantes
✅ CRM & Pipeline Comercial
✅ Funciona 100% Offline
✅ Backup Automático na Cloud

Experimente gratuitamente:
https://proforma360.vercel.app/`;
  
  const url = "https://proforma360.vercel.app";
  const whatsappText = `${text}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {}
  };

  const handleCopyHtmlEmail = async () => {
    try {
      const html = getPremiumInviteEmailHtml(userName);
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([text], { type: 'text/plain' });
      const data = [new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })];
      
      await navigator.clipboard.write(data);
      
      toast?.success?.("Email copiado com sucesso! Pode agora colar no Gmail ou Outlook.");
      if (!toast) {
        alert("Email copiado! Pode agora colar no Gmail ou Outlook.");
      }
    } catch (err) {
      console.error(err);
      alert("O seu navegador não suporta a cópia avançada de emails HTML.");
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank');
  };

  const handleEmailDesktop = () => {
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`, '_self');
  };

  const handleGmailWeb = () => {
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity animate-in fade-in">
      <div className="bg-[var(--color-surface-elevated)] w-full max-w-lg rounded-xl shadow-elevated border border-gray-100 overflow-hidden flex flex-col slide-in-from-bottom-4 animate-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Recomendar Proforma360</h3>
            <p className="text-sm text-gray-500 mt-0.5">Partilhe o sistema com os seus parceiros</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          <button 
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 rounded-xl font-bold shadow-sm transition-all"
          >
            <MessageCircle className="w-5 h-5" /> Partilhar no WhatsApp
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleEmailDesktop}
              className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm transition-all"
            >
              <Mail className="w-4 h-4" /> App de Email
            </button>
            <button 
              onClick={handleGmailWeb}
              className="flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-semibold text-sm transition-all"
            >
              <Mail className="w-4 h-4" /> Gmail Web
            </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">email premium visual</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button 
            onClick={handleCopyHtmlEmail}
            className="w-full flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white py-3.5 rounded-xl font-bold shadow-sm transition-all"
          >
            <Copy className="w-5 h-5" /> Copiar Email Completo (Para colar no Gmail)
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">ou apenas copiar link</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button 
            onClick={handleCopyLink}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border ${copiedLink ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />} 
            {copiedLink ? 'Link Copiado!' : 'Copiar Link Direto'}
          </button>

        </div>
      </div>
    </div>
  );
}

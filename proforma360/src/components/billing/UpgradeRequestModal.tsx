import React, { useState } from 'react';
import { X, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { requestPlanUpgrade } from '@/lib/subscriptions/upgradeRequests';
import { SubscriptionPlan, PLAN_DEFINITIONS } from '@/lib/subscriptions/planDefinitions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: SubscriptionPlan;
  triggerReason?: string;
}

export function UpgradeRequestModal({ isOpen, onClose, targetPlan, triggerReason }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [reason, setReason] = useState(triggerReason || '');

  if (!isOpen) return null;

  const caps = PLAN_DEFINITIONS[targetPlan];

  const handleRequest = async () => {
    setIsSubmitting(true);
    const success = await requestPlanUpgrade(targetPlan, reason);
    setIsSubmitting(false);
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 3000);
    } else {
      alert("Falha ao enviar o pedido. Tente novamente mais tarde.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/50 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-100">Fazer Upgrade</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 flex flex-col items-center text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-in zoom-in" />
            <h4 className="text-lg font-medium text-slate-100">Pedido Enviado!</h4>
            <p className="text-sm text-slate-400">
              O administrador irá rever o seu pedido em breve.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            
            {/* Pitch */}
            <div>
              <p className="text-slate-300 text-sm mb-4">
                Solicitar alteração para o plano <span className="font-bold text-amber-400">{targetPlan}</span>.
              </p>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
                  <span>Limite de Proformas: {caps.quotas.maxProformas}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
                  <span>Funcionalidades: {caps.features.length} incluídas</span>
                </li>
              </ul>
            </div>

            {/* Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Motivo do Pedido (Opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Atingi o limite de proformas mensal."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 resize-none h-20"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRequest}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'A enviar...' : 'Solicitar'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

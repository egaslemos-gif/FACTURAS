"use client";

import { useLicenseStore } from "@/stores/licenseStore";
import { CreditCard, CheckCircle2, Shield, AlertTriangle } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";

export default function SubscriptionPage() {
  const { license, showUpgradeModal, isLimitReached } = useLicenseStore();

  if (!license) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-6">
        <div className="h-40 bg-slate-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  const percentageUsed = license.unlimited ? 0 : Math.min(100, Math.round((license.used_this_month / license.monthly_limit) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-0 max-w-full overflow-x-hidden animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-page-title">Plano e Subscrição</h1>
        <p className="text-page-subtitle">
          Faça a gestão da sua quota, limites e expanda a capacidade operacional da sua empresa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* Current Plan Details */}
        <div className="bg-white rounded-lg border border-[var(--color-outline-variant)] shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Plano {license.plan.charAt(0).toUpperCase() + license.plan.slice(1)}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {license.is_active ? "Status: Ativo" : "Status: Suspenso"}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-8 flex-1">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-900">Capacidade de Emissão</p>
                <p className="text-xs text-slate-500 mt-0.5">{license.unlimited ? "Ilimitado" : `${license.monthly_limit} proformas por mês`}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-900">Exportação PDF</p>
                <p className="text-xs text-slate-500 mt-0.5">{license.can_export_pdf ? "Ativado" : "Desativado neste plano"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-900">Marca d'água Proforma360</p>
                <p className="text-xs text-slate-500 mt-0.5">{license.remove_branding ? "Removida" : "Visível nos documentos gerados"}</p>
              </div>
            </div>
          </div>

          {!license.unlimited && (
            <button 
              onClick={showUpgradeModal}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors shadow-sm"
            >
              Solicitar Expansão
            </button>
          )}
        </div>

        {/* Quota Usage */}
        <div className="bg-white rounded-lg border border-[var(--color-outline-variant)] shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Uso Mensal</h2>
          
          {license.unlimited ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-lg border border-slate-100">
                <Shield className="w-12 h-12 text-teal-500 mb-4" />
                <h3 className="font-bold text-slate-900">Acesso Ilimitado</h3>
                <p className="text-sm text-slate-500 mt-2">A sua conta não possui restrições de volume mensal. Crie quantas propostas necessitar.</p>
             </div>
          ) : (
            <>
              <div className="mb-2 flex justify-between items-end">
                <span className="text-4xl font-bold tracking-tight text-slate-900">{license.used_this_month}</span>
                <span className="text-sm font-medium text-slate-500 mb-1">/ {license.monthly_limit} emitidas</span>
              </div>
              
              <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${isLimitReached ? 'bg-red-500' : percentageUsed > 80 ? 'bg-amber-500' : 'bg-teal-500'}`} 
                  style={{ width: `${percentageUsed}%` }}
                ></div>
              </div>
              
              {isLimitReached ? (
                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 mt-auto">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold mb-1">Limite atingido</p>
                    <p>Já não pode emitir mais proformas este mês. Aguarde a viragem do mês ou solicite mais limite.</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 mt-auto bg-slate-50 p-4 rounded-lg border border-slate-100">
                  Tem ainda <strong>{license.monthly_limit - license.used_this_month} proformas</strong> disponíveis para partilha ou download de PDF este mês.
                </div>
              )}
            </>
          )}
        </div>

      </div>

      <UpgradeModal />
    </div>
  );
}

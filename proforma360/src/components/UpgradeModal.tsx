"use client";

import { useLicenseStore } from "@/stores/licenseStore";
import { Check, X, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { useState } from "react";

export default function UpgradeModal() {
  const { showModal, hideUpgradeModal, license } = useLicenseStore();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  if (!showModal) return null;

  const currentPlan = license?.plan || "free";

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "0 MTn",
      desc: "Ideal para testar e pequenos volumes.",
      quotations: "1 proforma / mês",
      features: [
        { name: "1 Proforma", allowed: true },
        { name: "5 Clientes", allowed: true },
        { name: "10 Produtos", allowed: true },
        { name: "PDF com marca d'água", allowed: false },
        { name: "WhatsApp Companion", allowed: false },
        { name: "CRM Timeline", allowed: false },
        { name: "Sincronização de Calendários", allowed: false }
      ]
    },
    {
      id: "starter",
      name: "Starter",
      price: billingCycle === "monthly" ? "3.200 MTn" : "2.560 MTn",
      desc: "Excelente para freelancers em início de atividade.",
      quotations: "50 proformas / mês",
      features: [
        { name: "50 Proformas", allowed: true },
        { name: "25 Clientes", allowed: true },
        { name: "50 Produtos", allowed: true },
        { name: "Exportação PDF Sem Branding", allowed: false },
        { name: "WhatsApp Companion", allowed: false },
        { name: "CRM Timeline", allowed: false },
        { name: "Sincronização de Calendários", allowed: false }
      ]
    },
    {
      id: "business",
      name: "Business",
      price: billingCycle === "monthly" ? "9.800 MTn" : "7.840 MTn",
      desc: "Ideal para empresas com foco em conversão ativa.",
      quotations: "500 proformas / mês",
      featured: true,
      features: [
        { name: "500 Proformas", allowed: true },
        { name: "100 Clientes", allowed: true },
        { name: "250 Produtos", allowed: true },
        { name: "Exportação PDF Sem Branding", allowed: true },
        { name: "WhatsApp Companion", allowed: true },
        { name: "CRM Timeline Completo", allowed: true },
        { name: "Sincronização de Calendários", allowed: true }
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      desc: "Para grandes equipas com volume ilimitado.",
      quotations: "Proformas ilimitadas",
      features: [
        { name: "Proformas Ilimitadas", allowed: true },
        { name: "Clientes Ilimitados", allowed: true },
        { name: "Produtos Ilimitados", allowed: true },
        { name: "Sem Marca d'água / Custom Branding", allowed: true },
        { name: "WhatsApp Companion Completo", allowed: true },
        { name: "CRM Advanced & Timeline", allowed: true },
        { name: "Suporte prioritário e SLAs", allowed: true }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col scale-in-center">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
              {currentPlan === "free" ? "Atingiu o limite do plano Gratuito" : "Opções de Upgrade do Plano"}
            </h2>
          </div>
          <button 
            onClick={hideUpgradeModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Cycle Toggle */}
        <div className="p-6 pb-2 text-center">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button 
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${billingCycle === "monthly" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Faturação Mensal
            </button>
            <button 
              onClick={() => setBillingCycle("yearly")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${billingCycle === "yearly" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Faturação Anual <span className="bg-teal-100 text-teal-700 text-[9px] font-black px-1 py-0.5 rounded-full shrink-0">Poupança 20%</span>
            </button>
          </div>
        </div>

        {/* Comparison grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                plan.id === currentPlan ? "border-slate-200 bg-slate-50/50 opacity-90" : 
                plan.featured ? "border-teal-500 ring-2 ring-teal-500/10 shadow-lg" : "border-slate-150 hover:border-slate-350"
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-teal-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Recomendado
                </div>
              )}

              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-400 font-semibold mb-4 leading-normal min-h-[32px]">{plan.desc}</p>
                
                <div className="mb-4">
                  <span className="text-2xl font-black text-slate-950">{plan.price}</span>
                  {plan.id !== "free" && plan.id !== "enterprise" && (
                    <span className="text-xs text-slate-400 font-medium"> / {billingCycle === "monthly" ? "mês" : "ano"}</span>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-lg mb-4 text-center">
                  {plan.quotations}
                </div>

                <ul className="space-y-2.5 mb-6 text-xs text-slate-600 font-medium">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {f.allowed ? (
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <span>{f.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan.id === currentPlan ? (
                <button disabled className="w-full py-2 bg-slate-200 text-slate-500 rounded-lg text-xs font-black cursor-not-allowed">
                  Plano Atual
                </button>
              ) : (
                <button 
                  onClick={() => {
                    alert(`Upgrade solicitado para o plano ${plan.name}. Um consultor entrará em contacto para ativação.`);
                  }}
                  className={`w-full py-2 rounded-lg text-xs font-black transition-all hover:scale-[1.02] flex items-center justify-center gap-1 ${
                    plan.featured ? "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/10" : "bg-slate-900 hover:bg-slate-950 text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Escolher {plan.name}
                </button>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useLicenseStore } from "@/stores/licenseStore";

export default function UpgradeModal() {
  const { showModal, hideUpgradeModal, license } = useLicenseStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    company_name: license?.company_name || "",
    requested_quota: "10",
    phone: "",
    message: ""
  });

  if (!showModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/licensing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error("Erro ao enviar pedido. Tente novamente mais tarde.");
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Limite Operacional Atingido</h2>
            <p className="text-sm text-slate-500 mt-1">
              A sua empresa atingiu o limite operacional do plano atual.
            </p>
          </div>
          <button 
            onClick={hideUpgradeModal}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900">Pedido Enviado</h3>
              <p className="text-slate-500 mt-2">A nossa equipa comercial entrará em contacto consigo brevemente para expandir a capacidade da sua conta.</p>
              <button 
                onClick={hideUpgradeModal}
                className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                <input 
                  type="text" 
                  required
                  value={formData.company_name}
                  onChange={e => setFormData({...formData, company_name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+258..."
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cotações Mensais</label>
                  <select 
                    value={formData.requested_quota}
                    onChange={e => setFormData({...formData, requested_quota: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  >
                    <option value="10">10 cotações/mês</option>
                    <option value="50">50 cotações/mês</option>
                    <option value="100">100 cotações/mês</option>
                    <option value="unlimited">Ilimitado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem Opcional</label>
                <textarea 
                  rows={2}
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                  placeholder="Gostaria de saber mais sobre o plano anual..."
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={hideUpgradeModal}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg font-medium transition-colors disabled:opacity-70 flex justify-center items-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Solicitar Expansão"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

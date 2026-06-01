"use client";

import { useEffect, useState } from "react";
import { useCompanyStore } from "@/stores";
import { Company } from "@/lib/types";
import { Upload, Save, Building2, FileSignature, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CompanyPage() {
  const { company, fetchCompany, updateCompany, isLoading } = useCompanyStore();
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCompany(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !company) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-headline-lg text-[var(--color-on-surface)]">A Minha Empresa</h1>
        <p className="text-body-md text-[var(--color-on-surface-variant)] mt-2">
          Configure os dados da sua empresa, logotipo e assinaturas para os documentos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-[var(--color-primary)]" />
            <h2 className="text-headline-sm">Informações Básicas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-label-md mb-2">Nome da Empresa</label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-shadow"
                placeholder="Ex: Proforma360 Lda"
                required
              />
            </div>

            <div>
              <label className="block text-label-md mb-2">NUIT / NIF</label>
              <input
                type="text"
                name="tax_number"
                value={formData.tax_number || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="Ex: 400123456"
              />
            </div>

            <div>
              <label className="block text-label-md mb-2">Telefone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="+258 84 123 4567"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-label-md mb-2">E-mail Comercial</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="contacto@empresa.com"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-label-md mb-2">Endereço Completo</label>
              <textarea
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
                placeholder="Av. 25 de Setembro, Maputo"
              />
            </div>
          </div>
        </div>

        {/* Identidade Visual */}
        <div className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-3 mb-6">
            <FileSignature className="w-6 h-6 text-[var(--color-primary)]" />
            <h2 className="text-headline-sm">Identidade Visual & Assinaturas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface-container-low)] cursor-pointer hover:bg-[var(--color-surface-container)] transition-colors relative overflow-hidden group">
              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData(prev => ({ ...prev, logo_url: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="Logo" className="absolute inset-0 w-full h-full object-contain p-2" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[var(--color-outline)] mb-3 group-hover:text-[var(--color-primary)] transition-colors" />
                  <span className="text-label-sm text-[var(--color-on-surface-variant)] mb-1">LOGOTIPO</span>
                  <p className="text-xs text-center text-[var(--color-outline)]">PNG transparente (Máx 2MB)</p>
                </>
              )}
            </label>

            {/* Carimbo */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface-container-low)] cursor-pointer hover:bg-[var(--color-surface-container)] transition-colors relative overflow-hidden group">
              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData(prev => ({ ...prev, stamp_url: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {formData.stamp_url ? (
                <img src={formData.stamp_url} alt="Carimbo" className="absolute inset-0 w-full h-full object-contain p-2" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[var(--color-outline)] mb-3 group-hover:text-[var(--color-primary)] transition-colors" />
                  <span className="text-label-sm text-[var(--color-on-surface-variant)] mb-1">CARIMBO</span>
                  <p className="text-xs text-center text-[var(--color-outline)]">PNG transparente (Máx 2MB)</p>
                </>
              )}
            </label>

            {/* Assinatura */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface-container-low)] cursor-pointer hover:bg-[var(--color-surface-container)] transition-colors relative overflow-hidden group">
              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData(prev => ({ ...prev, signature_url: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {formData.signature_url ? (
                <img src={formData.signature_url} alt="Assinatura" className="absolute inset-0 w-full h-full object-contain p-2" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[var(--color-outline)] mb-3 group-hover:text-[var(--color-primary)] transition-colors" />
                  <span className="text-label-sm text-[var(--color-on-surface-variant)] mb-1">ASSINATURA</span>
                  <p className="text-xs text-center text-[var(--color-outline)]">PNG transparente (Máx 2MB)</p>
                </>
              )}
            </label>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-label-md mb-2">Prefixo da Proforma</label>
              <input
                type="text"
                name="quotation_prefix"
                value={formData.quotation_prefix || "PF"}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-mono"
                placeholder="Ex: PF"
              />
              <p className="text-xs mt-1 text-[var(--color-outline)]">Ex: {formData.quotation_prefix || "PF"}-{new Date().getFullYear()}-0001</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-label-md mb-2">Texto de Rodapé (Aparece em todas as proformas)</label>
            <input
              type="text"
              name="footer_text"
              value={formData.footer_text || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder="Obrigado por escolher os nossos serviços. Processado por computador."
            />
          </div>
        </div>

        {/* Estilo da Proforma */}
        <div className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-3 mb-6">
            <LayoutTemplate className="w-6 h-6 text-[var(--color-primary)]" />
            <h2 className="text-headline-sm">Estilo da Proforma</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, pdf_template: "classic" }))}
              className={cn(
                "relative flex flex-col items-center justify-center p-6 border-2 rounded-xl text-center transition-all",
                formData.pdf_template === "classic" || !formData.pdf_template
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-container)] ring-2 ring-[var(--color-primary)] ring-offset-2"
                  : "border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-outline)]"
              )}
            >
              <div className="w-24 h-32 bg-white border border-gray-200 shadow-sm mb-4 flex flex-col rounded-md overflow-hidden">
                <img src="/template_classic.png" alt="Classic Template" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-[var(--color-on-surface)]">Standard (Clássico)</h3>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Design simples, preto e branco tradicional.</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, pdf_template: "modern" }))}
              className={cn(
                "relative flex flex-col items-center justify-center p-6 border-2 rounded-xl text-center transition-all",
                formData.pdf_template === "modern"
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-container)] ring-2 ring-[var(--color-primary)] ring-offset-2"
                  : "border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-outline)]"
              )}
            >
              <div className="w-24 h-32 bg-white border border-gray-200 shadow-sm mb-4 flex flex-col rounded-md overflow-hidden">
                <img src="/template_modern.png" alt="Modern Template" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-[var(--color-on-surface)]">Moderno (Colorido)</h3>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Design atual com cabeçalhos azuis e arredondados.</p>
            </button>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-colors",
              isSaving ? "bg-[var(--color-primary-fixed-dim)] cursor-not-allowed" : "bg-[var(--color-primary)] hover:bg-[#003ea8]"
            )}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? "A guardar..." : "Guardar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}

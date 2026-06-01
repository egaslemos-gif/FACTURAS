"use client";

import { useEffect, useState } from "react";
import { useCompanyStore } from "@/stores";
import { Company } from "@/lib/types";
import { Upload, Save, Building2, FileSignature } from "lucide-react";
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
            <div className="flex flex-col items-center p-6 border-2 border-dashed border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface-container-low)]">
              <Upload className="w-8 h-8 text-[var(--color-outline)] mb-3" />
              <span className="text-label-sm text-[var(--color-on-surface-variant)] mb-1">LOGOTIPO</span>
              <p className="text-xs text-center text-[var(--color-outline)]">PNG transparente (Máx 2MB)</p>
            </div>

            {/* Carimbo */}
            <div className="flex flex-col items-center p-6 border-2 border-dashed border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface-container-low)]">
              <Upload className="w-8 h-8 text-[var(--color-outline)] mb-3" />
              <span className="text-label-sm text-[var(--color-on-surface-variant)] mb-1">CARIMBO</span>
              <p className="text-xs text-center text-[var(--color-outline)]">PNG transparente (Máx 2MB)</p>
            </div>

            {/* Assinatura */}
            <div className="flex flex-col items-center p-6 border-2 border-dashed border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface-container-low)]">
              <Upload className="w-8 h-8 text-[var(--color-outline)] mb-3" />
              <span className="text-label-sm text-[var(--color-on-surface-variant)] mb-1">ASSINATURA</span>
              <p className="text-xs text-center text-[var(--color-outline)]">PNG transparente (Máx 2MB)</p>
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

          <div className="mt-6">
            <label className="block text-label-md mb-2">Prefixo da Proforma</label>
            <input
              type="text"
              name="quotation_prefix"
              value={formData.quotation_prefix || "PF"}
              onChange={handleChange}
              className="w-full md:w-1/3 px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-mono"
              placeholder="Ex: PF"
            />
            <p className="text-xs mt-1 text-[var(--color-outline)]">O número gerado será: {formData.quotation_prefix || "PF"}-{new Date().getFullYear()}-0001</p>
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

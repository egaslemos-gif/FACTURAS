"use client";

import { useEffect, useState } from "react";
import { useCompanyStore } from "@/stores";
import { Company } from "@/lib/types";
import { useAppSettingsStore } from "@/stores/appSettings";
import { SEMANTIC_PROFILES, BusinessProfile } from "@/lib/ui/semanticPresentationRegistry";
import { Upload, Save, Building2, FileSignature, LayoutTemplate, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CompanyPage() {
  const { company, fetchCompany, updateCompany, isLoading } = useCompanyStore();
  const { businessProfile, fetchSettings, updateBusinessProfile, isLoading: isSettingsLoading } = useAppSettingsStore();
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [localProfile, setLocalProfile] = useState<BusinessProfile>("GENERAL");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCompany();
    fetchSettings();
  }, [fetchCompany, fetchSettings]);

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  useEffect(() => {
    if (businessProfile) {
      setLocalProfile(businessProfile as BusinessProfile);
    }
  }, [businessProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCompany(formData);
      await updateBusinessProfile(localProfile);
      toast.success("Definições da empresa guardadas com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao guardar as definições.");
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
    <div className="max-w-4xl mx-auto animate-fade-in pb-12 md:pb-20">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Perfil da Empresa</h1>
        <p className="text-sm text-slate-500 mt-1 leading-normal">
          Perfil da sua organização.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Perfil de Indústria */}
        <div className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Perfil Comercial</h2>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sector de Atividade (Adapta a Linguagem do Sistema)</label>
            <select
              value={localProfile}
              onChange={(e) => setLocalProfile(e.target.value as BusinessProfile)}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            >
              {Object.values(SEMANTIC_PROFILES).map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">Isto ajustará os termos como "Produtos", "Serviços", ou "Planos" ao longo da aplicação.</p>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Informações Básicas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome da Empresa</label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="Ex: Proforma360 Lda"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">NUIT / NIF</label>
              <input
                type="text"
                name="tax_number"
                value={formData.tax_number || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="Ex: 400123456"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="+258 84 123 4567"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail Comercial</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="contacto@empresa.com"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Endereço Completo</label>
              <textarea
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm bg-slate-50/50 hover:bg-white focus:bg-white text-sm resize-none"
                placeholder="Av. 25 de Setembro, Maputo"
              />
            </div>
          </div>
        </div>

        {/* Informações Financeiras */}
        <div className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Informações Financeiras</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome do Banco</label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="Ex: Millennium BIM"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Titular da Conta</label>
              <input
                type="text"
                name="account_holder"
                value={formData.account_holder || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="Ex: Proforma360 Lda"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Número da Conta</label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="Ex: 123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">NIB / IBAN</label>
              <input
                type="text"
                name="nib_iban"
                value={formData.nib_iban || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="Ex: 000100000012345678912"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Número M-Pesa</label>
              <input
                type="text"
                name="mpesa"
                value={formData.mpesa || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="Ex: 84 123 4567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Número e-Mola</label>
              <input
                type="text"
                name="emola"
                value={formData.emola || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder="Ex: 86 123 4567"
              />
            </div>
          </div>
        </div>

        {/* Identidade Visual */}
        <div className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Identidade Visual & Assinaturas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-teal-50 hover:border-teal-200 transition-colors relative overflow-hidden group">
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
                  <Upload className="w-8 h-8 text-slate-400 mb-3 group-hover:text-teal-600 transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">LOGOTIPO</span>
                  <p className="text-xs text-center text-slate-400">PNG transparente (Máx 2MB)</p>
                </>
              )}
            </label>

            {/* Carimbo */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-teal-50 hover:border-teal-200 transition-colors relative overflow-hidden group">
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
                  <Upload className="w-8 h-8 text-slate-400 mb-3 group-hover:text-teal-600 transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">CARIMBO</span>
                  <p className="text-xs text-center text-slate-400">PNG transparente (Máx 2MB)</p>
                </>
              )}
            </label>

            {/* Assinatura */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-teal-50 hover:border-teal-200 transition-colors relative overflow-hidden group">
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
                  <Upload className="w-8 h-8 text-slate-400 mb-3 group-hover:text-teal-600 transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">ASSINATURA</span>
                  <p className="text-xs text-center text-slate-400">PNG transparente (Máx 2MB)</p>
                </>
              )}
            </label>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prefixo da Proforma</label>
              <input
                type="text"
                name="quotation_prefix"
                value={formData.quotation_prefix || "PF"}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none font-mono transition-all shadow-sm bg-slate-50/50 hover:bg-white focus:bg-white text-sm"
                placeholder="Ex: PF"
              />
              <p className="text-xs mt-1.5 text-slate-500">Ex: {formData.quotation_prefix || "PF"}-{new Date().getFullYear()}-0001</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Texto de Rodapé (Aparece em todas as proformas)</label>
            <input
              type="text"
              name="footer_text"
              value={formData.footer_text || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder="Obrigado por escolher os nossos serviços. Processado por computador."
            />
          </div>
        </div>

        {/* Estilo da Proforma */}
        <div className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Estilo da Proforma</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, pdf_template: "minimal" }))}
              className={cn(
                "relative flex flex-col items-center justify-center p-6 border-2 rounded-xl text-center transition-all",
                formData.pdf_template === "minimal" || !formData.pdf_template
                  ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/20 ring-offset-2"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
              )}
            >
              <div className="w-24 h-32 bg-white border border-slate-200 shadow-sm mb-4 flex flex-col rounded-md overflow-hidden">
                <img src="/template_classic.png" alt="Minimal Template" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-slate-900">Minimal (Clássico)</h3>
              <p className="text-xs text-slate-500 mt-1">Design simples, preto e branco tradicional.</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, pdf_template: "modern" }))}
              className={cn(
                "relative flex flex-col items-center justify-center p-6 border-2 rounded-xl text-center transition-all",
                formData.pdf_template === "modern"
                  ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/20 ring-offset-2"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
              )}
            >
              <div className="w-24 h-32 bg-white border border-slate-200 shadow-sm mb-4 flex flex-col rounded-md overflow-hidden">
                <img src="/template_modern.png" alt="Modern Template" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-slate-900">Moderno (Colorido)</h3>
              <p className="text-xs text-slate-500 mt-1">Design atual com cabeçalhos azuis.</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, pdf_template: "corporate" }))}
              className={cn(
                "relative flex flex-col items-center justify-center p-6 border-2 rounded-xl text-center transition-all md:col-span-2 lg:col-span-1",
                formData.pdf_template === "corporate"
                  ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/20 ring-offset-2"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
              )}
            >
              <div className="w-24 h-32 bg-white border border-slate-200 shadow-sm mb-4 flex flex-col rounded-md overflow-hidden relative">
                {/* Header */}
                <div className="w-full p-2 flex justify-between items-start border-b border-slate-100">
                  <div className="w-4 h-4 rounded-full bg-slate-300"></div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="w-8 h-1 bg-slate-800 rounded"></div>
                    <div className="w-6 h-1 bg-slate-300 rounded"></div>
                  </div>
                </div>
                {/* Client / Info Box */}
                <div className="flex p-2 gap-2 border-b border-slate-100">
                  <div className="flex-1 h-6 border border-slate-200 rounded-sm bg-slate-50"></div>
                  <div className="w-8 h-6 border border-slate-200 rounded-sm bg-slate-50"></div>
                </div>
                {/* Table Header */}
                <div className="w-[calc(100%-16px)] mx-auto mt-2 h-2 bg-slate-200 rounded-sm"></div>
                {/* Table Rows */}
                <div className="flex-1 w-[calc(100%-16px)] mx-auto mt-1 flex flex-col gap-1">
                  <div className="w-full h-1 bg-slate-100 border-b border-slate-200"></div>
                  <div className="w-full h-1 bg-slate-100 border-b border-slate-200"></div>
                  <div className="w-full h-1 bg-slate-100 border-b border-slate-200"></div>
                </div>
                {/* Footer Total */}
                <div className="w-[calc(100%-16px)] mx-auto mb-2 flex justify-end">
                  <div className="w-10 h-3 border border-slate-200 bg-slate-50 rounded-sm"></div>
                </div>
              </div>
              <h3 className="font-bold text-slate-900">Corporativo</h3>
              <p className="text-xs text-slate-500 mt-1">Design sério para empresas de grande porte.</p>
            </button>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition-all active:scale-95",
              isSaving ? "bg-slate-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
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

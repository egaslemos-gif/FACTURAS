"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClientsStore } from "@/stores";
import { ArrowLeft, Save, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NewClientPage() {
  const router = useRouter();
  const { addClient } = useClientsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    tax_number: "",
    address: "",
    notes: "",
    origin: "",
    tagsInput: "",
    status: "active" as const,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { tagsInput, ...rest } = formData;
      const payload = {
        ...rest,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      };
      await addClient(payload);
      toast.success("Cliente adicionado com sucesso!");
      router.push("/dashboard/clients");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar cliente.");
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/clients" className="p-2 hover:bg-[var(--color-surface-container)] rounded-full transition-colors text-[var(--color-on-surface-variant)]">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-headline-lg text-[var(--color-on-surface)]">Novo Cliente</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
            Adicionar um novo cliente à sua carteira
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-[var(--color-primary)]" />
          <h2 className="text-headline-sm">Detalhes do Cliente</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-label-md mb-2">Nome Completo / Empresa *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder="Ex: João Silva ou Empresa XYZ"
            />
          </div>

          <div>
            <label className="block text-label-md mb-2">NUIT / NIF</label>
            <input
              type="text"
              name="tax_number"
              value={formData.tax_number}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder="Ex: 400123456"
            />
          </div>

          <div>
            <label className="block text-label-md mb-2">Telefone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder="+258 84 123 4567"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-label-md mb-2">E-mail</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder="cliente@email.com"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-label-md mb-2">Endereço Completo</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
              placeholder="Av. 25 de Setembro, Maputo"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-label-md mb-2">Notas Internas (Opcional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
              placeholder="Informação adicional sobre este cliente..."
            />
          </div>

          <div>
            <label className="block text-label-md mb-2">Origem do Cliente</label>
            <select
              name="origin"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
            >
              <option value="">Selecione...</option>
              <option value="website">Website</option>
              <option value="referral">Recomendação</option>
              <option value="social">Redes Sociais</option>
              <option value="direct">Contacto Direto</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-label-md mb-2">Tags (Separadas por vírgula)</label>
            <input
              type="text"
              name="tagsInput"
              value={formData.tagsInput}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder="Ex: VIP, Retalho, B2B"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-[var(--color-outline-variant)]">
          <Link
            href="/dashboard/clients"
            className="px-6 py-3 rounded-md text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] font-medium transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-md text-white font-medium transition-colors",
              isSaving ? "bg-[var(--color-primary-fixed-dim)] cursor-not-allowed" : "bg-[var(--color-primary)] hover:bg-[#003ea8]"
            )}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? "A guardar..." : "Guardar Cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}

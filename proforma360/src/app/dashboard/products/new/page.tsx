"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProductsStore } from "@/stores";
import { ArrowLeft, Save, Package } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NewProductPage() {
  const router = useRouter();
  const { addProduct } = useProductsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    category: "Geral",
    price: 0,
    vat: 16, // Default VAT for Mozambique is 16% (historicamente 17%, atualizar conforme necessidade)
    unit: "un",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === "number" ? parseFloat(value) || 0 : value 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addProduct(formData);
      router.push("/dashboard/products");
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/products" className="p-2 hover:bg-[var(--color-surface-container)] rounded-full transition-colors text-[var(--color-on-surface-variant)]">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-headline-lg text-[var(--color-on-surface)]">Novo Produto / Serviço</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
            Adicionar um item ao seu catálogo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-[var(--color-primary)]" />
          <h2 className="text-headline-sm">Detalhes do Item</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-label-md mb-2">Nome do Produto ou Serviço *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder="Ex: Consultoria em TI (Mensal)"
            />
          </div>

          <div>
            <label className="block text-label-md mb-2">Código / Referência (Opcional)</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-mono"
              placeholder="Ex: SRV-001"
            />
          </div>

          <div>
            <label className="block text-label-md mb-2">Categoria</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
            >
              <option value="Geral">Geral</option>
              <option value="Serviços">Serviços</option>
              <option value="Produtos Físicos">Produtos Físicos</option>
              <option value="Software/Licenças">Software / Licenças</option>
            </select>
          </div>

          <div>
            <label className="block text-label-md mb-2">Preço Unitário (MZN) *</label>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              required
              value={formData.price || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md mb-2">IVA (%)</label>
              <input
                type="number"
                name="vat"
                min="0"
                max="100"
                value={formData.vat}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-label-md mb-2">Unidade</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
              >
                <option value="un">un (Unidade)</option>
                <option value="hr">hr (Hora)</option>
                <option value="dia">dia (Dia)</option>
                <option value="mês">mês (Mês)</option>
                <option value="ano">ano (Ano)</option>
                <option value="kg">kg (Quilograma)</option>
              </select>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-label-md mb-2">Descrição / Notas para o cliente (Opcional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
              placeholder="Detalhes que aparecerão na linha da proforma..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-[var(--color-outline-variant)]">
          <Link
            href="/dashboard/products"
            className="px-6 py-3 rounded-lg text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] font-medium transition-colors"
          >
            Cancelar
          </Link>
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
            {isSaving ? "A guardar..." : "Guardar Produto"}
          </button>
        </div>
      </form>
    </div>
  );
}

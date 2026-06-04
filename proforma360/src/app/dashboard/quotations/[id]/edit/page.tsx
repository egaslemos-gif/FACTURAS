"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useQuotationsStore, useClientsStore, useProductsStore, useCompanyStore } from "@/stores";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { requestNotificationPermission } from "@/lib/pipeline/notifications";

interface LineItem {
  id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total: number;
}

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params.id as string;

  const { currentDetail, fetchQuotationDetail, updateQuotation, isLoading } = useQuotationsStore();
  const { clients, fetchClients } = useClientsStore();
  const { products, fetchProducts } = useProductsStore();
  const { fetchCompany } = useCompanyStore();

  const [isSaving, setIsSaving] = useState(false);
  const [headerData, setHeaderData] = useState({
    quotation_number: "",
    client_id: "",
    date: "",
    expiry_date: "",
    notes: "",
    terms: "",
    discount: 0,
    discount_type: "percentage" as "percentage" | "fixed",
    next_action: "",
    next_action_date: "",
    next_action_time: "",
    reminders_enabled: true,
  });

  const [items, setItems] = useState<LineItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchCompany();
    if (quotationId) {
      fetchQuotationDetail(quotationId);
    }
  }, [quotationId, fetchClients, fetchProducts, fetchCompany, fetchQuotationDetail]);

  useEffect(() => {
    if (currentDetail && currentDetail.quotation.id === quotationId && !dataLoaded) {
      const q = currentDetail.quotation;
      setHeaderData({
        quotation_number: q.quotation_number,
        client_id: q.client_id,
        date: q.date,
        expiry_date: q.expiry_date,
        notes: q.notes || "",
        terms: q.terms || "",
        discount: q.discount || 0,
        discount_type: q.discount_type as "percentage" | "fixed" || "percentage",
        next_action: q.next_action || "",
        next_action_date: q.next_action_date || "",
        next_action_time: q.next_action_time || "",
        reminders_enabled: q.reminders_enabled !== false,
      });

      setItems(
        currentDetail.items.map(item => ({
          id: item.id || crypto.randomUUID(),
          product_id: item.product_id || undefined,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          total: item.total,
        }))
      );
      setDataLoaded(true);
    }
  }, [currentDetail, quotationId, dataLoaded]);

  const addLineItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unit_price: 0,
        vat_rate: 16,
        total: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === "product_id" && value) {
            const product = products.find(p => p.id === value);
            if (product) {
              updatedItem.description = product.name + (product.description ? `\n${product.description}` : "");
              updatedItem.unit_price = product.price;
              updatedItem.vat_rate = product.vat;
            }
          }

          const qty = updatedItem.quantity || 0;
          const price = updatedItem.unit_price || 0;
          updatedItem.total = qty * price;
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  
  let discountAmount = 0;
  if (headerData.discount > 0) {
    discountAmount = headerData.discount_type === "percentage" 
      ? subtotal * (headerData.discount / 100)
      : headerData.discount;
  }
  
  const subtotalAfterDiscount = subtotal - discountAmount;

  let vatTotal = 0;
  items.forEach(item => {
    const proportion = subtotal > 0 ? item.total / subtotal : 0;
    const itemTotalAfterDiscount = item.total - (discountAmount * proportion);
    vatTotal += itemTotalAfterDiscount * (item.vat_rate / 100);
  });

  const grandTotal = subtotalAfterDiscount + vatTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerData.client_id) {
      toast.error("Por favor, selecione um cliente.");
      return;
    }
    if (items.length === 0) {
      toast.error("Por favor, adicione pelo menos um item à proforma.");
      return;
    }

    if (headerData.reminders_enabled) {
      setIsSaving(true);
      await requestNotificationPermission();
    }

    setIsSaving(true);
    try {
      await updateQuotation(
        quotationId,
        {
          quotation_number: headerData.quotation_number,
          client_id: headerData.client_id,
          date: headerData.date,
          expiry_date: headerData.expiry_date,
          subtotal,
          discount: headerData.discount,
          discount_type: headerData.discount_type,
          vat_total: vatTotal,
          grand_total: grandTotal,
          notes: headerData.notes,
          terms: headerData.terms,
          next_action: headerData.next_action || null,
          next_action_date: headerData.next_action_date || null,
          next_action_time: headerData.next_action_time || null,
          reminders_enabled: headerData.reminders_enabled,
        } as any,
        items.map(({ id, ...item }, index) => ({ ...item, sort_order: index })) as any
      );
      toast.success("Proforma guardada com sucesso!");
      router.push(`/dashboard/quotations/${quotationId}`);
    } catch (error) {
      console.error(error);
      setIsSaving(false);
      toast.error("Erro ao guardar as alterações.");
    }
  };

  if (isLoading && !dataLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/quotations/${quotationId}`} className="p-2 hover:bg-[var(--color-surface-container)] rounded-full transition-colors text-[var(--color-on-surface-variant)]">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-headline-lg text-[var(--color-on-surface)]">Editar Proforma</h1>
            <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
              Atualizar documento {headerData.quotation_number}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-md text-white font-medium transition-colors elevation-1",
              isSaving ? "bg-[var(--color-primary-fixed-dim)] cursor-not-allowed" : "bg-[var(--color-primary)] hover:bg-[#003ea8]"
            )}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar Alterações
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-label-md mb-2">Cliente *</label>
                <select
                  value={headerData.client_id}
                  onChange={(e) => setHeaderData({ ...headerData, client_id: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
                  required
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-label-md mb-2">Número da Proforma</label>
                <input
                  type="text"
                  value={headerData.quotation_number}
                  onChange={(e) => setHeaderData({ ...headerData, quotation_number: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-label-md mb-2">Data de Emissão</label>
                <input
                  type="date"
                  value={headerData.date}
                  onChange={(e) => setHeaderData({ ...headerData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-label-md mb-2">Válida até</label>
                <input
                  type="date"
                  value={headerData.expiry_date}
                  onChange={(e) => setHeaderData({ ...headerData, expiry_date: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  required
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-outline-variant)]">
              <h3 className="text-label-md font-semibold text-slate-800 mb-4">Ação de Follow-up (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-label-md mb-2">Próxima Ação</label>
                  <input
                    type="text"
                    value={headerData.next_action}
                    onChange={(e) => setHeaderData({ ...headerData, next_action: e.target.value })}
                    placeholder="Ex: Ligar ao cliente"
                    className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-md mb-2">Data Prevista</label>
                  <input
                    type="date"
                    value={headerData.next_action_date}
                    onChange={(e) => setHeaderData({ ...headerData, next_action_date: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-label-md mb-2">Hora (Opcional)</label>
                  <input
                    type="time"
                    value={headerData.next_action_time}
                    onChange={(e) => setHeaderData({ ...headerData, next_action_time: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reminders_enabled"
                  checked={headerData.reminders_enabled}
                  onChange={(e) => setHeaderData({ ...headerData, reminders_enabled: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="reminders_enabled" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Ativar lembretes para esta ação
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-headline-sm">Itens da Proforma</h2>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-4 border border-[var(--color-outline-variant)] rounded-md bg-[var(--color-surface-container-lowest)] relative group">
                  <button 
                    onClick={() => removeLineItem(item.id)}
                    className="absolute -top-3 -right-3 p-1.5 bg-white border border-[var(--color-outline-variant)] rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm"
                    title="Remover linha"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-12 mb-2">
                      <select
                        value={item.product_id || ""}
                        onChange={(e) => updateLineItem(item.id, "product_id", e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-[var(--color-outline-variant)] rounded focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
                      >
                        <option value="">-- Produto Personalizado (Escrever abaixo) --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.code ? `[${p.code}] ` : ''}{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-6">
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Descrição</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-[var(--color-outline-variant)] rounded focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
                        placeholder="Descrição do item..."
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Qtd</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-[var(--color-outline-variant)] rounded focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Preço (MZN)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-[var(--color-outline-variant)] rounded focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">IVA (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.vat_rate}
                        onChange={(e) => updateLineItem(item.id, "vat_rate", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-[var(--color-outline-variant)] rounded focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2 text-right font-medium text-[var(--color-primary)]">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLineItem}
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[var(--color-outline-variant)] rounded-md text-[var(--color-primary)] hover:bg-[var(--color-primary-container)] hover:border-[var(--color-primary)] transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Adicionar Nova Linha
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-label-md mb-2">Notas (Visíveis ao cliente)</label>
                <textarea
                  value={headerData.notes}
                  onChange={(e) => setHeaderData({ ...headerData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
                  placeholder="Informação adicional..."
                />
              </div>
              <div>
                <label className="block text-label-md mb-2">Termos e Condições</label>
                <textarea
                  value={headerData.terms}
                  onChange={(e) => setHeaderData({ ...headerData, terms: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)] sticky top-6">
            <h2 className="text-headline-sm mb-6 pb-4 border-b border-[var(--color-outline-variant)]">Resumo</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-body-md">
                <span className="text-[var(--color-on-surface-variant)]">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Desconto</label>
                  <div className="flex">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={headerData.discount}
                      onChange={(e) => setHeaderData({ ...headerData, discount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-sm border border-r-0 border-[var(--color-outline-variant)] rounded-l focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                    />
                    <select
                      value={headerData.discount_type}
                      onChange={(e) => setHeaderData({ ...headerData, discount_type: e.target.value as "percentage" | "fixed" })}
                      className="px-2 py-1.5 text-sm border border-[var(--color-outline-variant)] rounded-r bg-[var(--color-surface-container-lowest)] outline-none"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">MT</option>
                    </select>
                  </div>
                </div>
                <div className="flex-1 text-right pt-5 text-red-500 font-medium">
                  -{formatCurrency(discountAmount)}
                </div>
              </div>

              <div className="flex justify-between text-body-md pb-4 border-b border-[var(--color-outline-variant)]">
                <span className="text-[var(--color-on-surface-variant)]">Total IVA</span>
                <span className="font-medium">{formatCurrency(vatTotal)}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-headline-sm">Total Final</span>
                <span className="text-headline-md text-[var(--color-primary)]">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
            
            {items.length === 0 && (
              <div className="mt-6 p-3 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-100">
                Adicione itens à proforma para ver o resumo dos valores.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

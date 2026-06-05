"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuotationsStore, useClientsStore, useProductsStore, useCompanyStore } from "@/stores";
import { useLicenseStore } from "@/stores/licenseStore";
import { generateQuotationNumber } from "@/lib/utils";
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
  search_query?: string;
  show_results?: boolean;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const { createQuotation, quotations } = useQuotationsStore();
  const { isLimitReached, showUpgradeModal, fetchLicense } = useLicenseStore();
  const { clients, fetchClients } = useClientsStore();
  const { products, fetchProducts } = useProductsStore();
  const { company, fetchCompany } = useCompanyStore();

  const [isSaving, setIsSaving] = useState(false);
  const [headerData, setHeaderData] = useState(() => {
    const issueDate = new Date();
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const diffDays = Math.round((expiryDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
    return {
      quotation_number: "",
      client_id: "",
      date: issueDate.toISOString().split("T")[0],
      expiry_date: expiryDate.toISOString().split("T")[0],
      notes: "",
      terms: `Condições de Pagamento: 50% na adjudicação, 50% na entrega.\nValidade: ${diffDays} dias.`,
      discount: 0,
      discount_type: "percentage" as "percentage" | "fixed",
      next_action: "",
      next_action_date: "",
      next_action_time: "",
      reminders_enabled: true,
    };
  });

  const [items, setItems] = useState<LineItem[]>([]);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchCompany();
  }, [fetchClients, fetchProducts, fetchCompany]);

  useEffect(() => {
    if (company) {
      // Find latest quotation to generate the next number
      const latestQuotation = quotations.length > 0 ? quotations[0].quotation_number : null;
      setHeaderData(prev => ({
        ...prev,
        quotation_number: generateQuotationNumber(latestQuotation, company.quotation_prefix || "PF")
      }));
    }
  }, [company, quotations]);

  // Recalculate validity in terms when dates change
  useEffect(() => {
    if (headerData.date && headerData.expiry_date) {
      const diffDays = Math.round(
        (new Date(headerData.expiry_date).getTime() - new Date(headerData.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays > 0) {
        setHeaderData(prev => ({
          ...prev,
          terms: prev.terms.replace(/Validade:\s*\d+\s*dias\.?/i, `Validade: ${diffDays} dias.`)
        }));
      }
    }
  }, [headerData.date, headerData.expiry_date]);

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
        search_query: "",
        show_results: false,
      },
    ]);
  };

  const addSpecificProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        product_id: product.id,
        description: product.name + (product.description ? `\n${product.description}` : ""),
        quantity: 1,
        unit_price: product.price,
        vat_rate: product.vat,
        total: product.price,
        search_query: product.name,
        show_results: false,
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
          
          // Auto-fill from product if product is selected
          if (field === "product_id" && value) {
            const product = products.find(p => p.id === value);
            if (product) {
              updatedItem.description = product.name + (product.description ? `\n${product.description}` : "");
              updatedItem.unit_price = product.price;
              updatedItem.vat_rate = product.vat;
            }
          }

          // Recalculate total for this line
          const qty = updatedItem.quantity || 0;
          const price = updatedItem.unit_price || 0;
          updatedItem.total = qty * price;
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  
  let discountAmount = 0;
  if (headerData.discount > 0) {
    discountAmount = headerData.discount_type === "percentage" 
      ? subtotal * (headerData.discount / 100)
      : headerData.discount;
  }
  
  const subtotalAfterDiscount = subtotal - discountAmount;

  // Calculate VAT based on individual item rates weighted by their proportional contribution
  // For MVP, we do exact VAT per line
  let vatTotal = 0;
  items.forEach(item => {
    // Proportion of this item's total relative to the overall subtotal (to apply discount correctly)
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

    if (isLimitReached) {
      showUpgradeModal();
      return;
    }

    if (headerData.reminders_enabled) {
      setIsSaving(true); // show spinner during permission prompt
      await requestNotificationPermission();
    }

    setIsSaving(true);
    try {
      const quotationId = await createQuotation(
        {
          quotation_number: headerData.quotation_number,
          client_id: headerData.client_id,
          date: headerData.date,
          expiry_date: headerData.expiry_date,
          status: "draft",
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
          pdf_url: null,
          pdf_drive_id: null
        } as any, // Cast to any to bypass strict omit since they can be null initially
        items.map(({ id, ...item }, index) => ({ ...item, sort_order: index })) as any // remove temp ID and add sort_order
      );
      // Force license store recount
      fetchLicense(true);
      toast.success("Proforma criada com sucesso!");
      router.push(`/dashboard/quotations/${quotationId}`);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao guardar a proforma.");
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/quotations" className="p-2 hover:bg-[var(--color-surface-container)] rounded-full transition-colors text-[var(--color-on-surface-variant)]">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-headline-lg text-[var(--color-on-surface)]">Nova Proforma</h1>
            <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
              Criar um novo documento
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
            Guardar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
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

          {/* Line Items Card */}
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
                    <div className="md:col-span-12 mb-2 relative">
                      <div className="relative">
                        <input
                          type="text"
                          value={item.search_query !== undefined ? item.search_query : (products.find(p => p.id === item.product_id)?.name || "")}
                          onChange={(e) => {
                            updateLineItem(item.id, "search_query", e.target.value);
                            updateLineItem(item.id, "show_results", true);
                          }}
                          onFocus={() => updateLineItem(item.id, "show_results", true)}
                          onBlur={() => setTimeout(() => updateLineItem(item.id, "show_results", false), 200)}
                          placeholder="Pesquisar produto/serviço ou escreva para item personalizado..."
                          className="w-full px-3 py-1.5 text-sm border border-[var(--color-outline-variant)] rounded focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
                        />
                        {item.show_results && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--color-outline-variant)] rounded-md shadow-lg max-h-48 overflow-y-auto">
                            <div 
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 italic text-gray-500"
                              onClick={() => {
                                updateLineItem(item.id, "product_id", "");
                                updateLineItem(item.id, "show_results", false);
                                updateLineItem(item.id, "description", item.search_query || "");
                              }}
                            >
                              + Usar como item personalizado
                            </div>
                            {products
                              .filter(p => !item.search_query || p.name.toLowerCase().includes(item.search_query.toLowerCase()) || p.code?.toLowerCase().includes(item.search_query.toLowerCase()))
                              .map(p => (
                                <div 
                                  key={p.id} 
                                  className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-t border-gray-100"
                                  onClick={() => {
                                    updateLineItem(item.id, "product_id", p.id);
                                    updateLineItem(item.id, "search_query", p.name);
                                    updateLineItem(item.id, "show_results", false);
                                  }}
                                >
                                  <div className="font-medium">{p.code ? `[${p.code}] ` : ''}{p.name}</div>
                                  <div className="text-xs text-gray-500">{formatCurrency(p.price)}</div>
                                </div>
                            ))}
                          </div>
                        )}
                      </div>
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

            {products.length > 0 && (
              <div className="mt-6 pt-4 border-t border-[var(--color-outline-variant)]">
                <h3 className="text-label-sm text-[var(--color-on-surface-variant)] mb-3">Produtos Adicionados Recentemente</h3>
                <div className="flex flex-wrap gap-2">
                  {products.slice(0, 5).map(product => (
                    <button
                      key={`recent-${product.id}`}
                      type="button"
                      onClick={() => addSpecificProduct(product.id)}
                      className="px-3 py-1.5 bg-[var(--color-surface-container-low)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-xs rounded-full border border-[var(--color-outline-variant)] transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {product.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Notes & Terms */}
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

        {/* Sidebar Summary */}
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

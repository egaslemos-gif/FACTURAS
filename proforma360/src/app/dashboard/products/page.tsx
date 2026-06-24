"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProductsStore } from "@/stores";
import { Search, Plus, Trash2, Edit2, PackageOpen } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { getSemanticProfile } from "@/lib/ui/semanticPresentationRegistry";
import { useAppSettingsStore } from "@/stores/appSettings";
import { EmptyState } from "@/components/EmptyState";

export default function ProductsPage() {
  const router = useRouter();
  const { products, fetchProducts, isLoading, deleteProduct } = useProductsStore();
  const { businessProfile } = useAppSettingsStore();
  const profile = getSemanticProfile(businessProfile);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[var(--spacing-container-max)] mx-auto animate-fade-in pb-12 md:pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <profile.icon className={cn("w-5 h-5", `text-${profile.accentColor}-600`)} />
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider", profile.badgeColor)}>
              {profile.name}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{profile.itemPluralLabel}</h1>
          <p className="text-sm text-slate-500 mt-1 leading-normal">
            Faça a gestão do seu catálogo de ofertas comerciais.
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo {profile.itemLabel}
        </Link>
      </div>

      <div className="dashboard-section p-0 overflow-hidden">
        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, código ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-white text-sm transition-all shadow-sm"
            />
          </div>
          <div className="text-sm text-slate-500 ml-auto font-medium">
            {filteredProducts.length} item(s)
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12">
              <EmptyState 
                icon={profile.icon} 
                title={profile.emptyStateTitle} 
                description={profile.emptyStateDescription}
                action={{
                  label: `Novo ${profile.itemLabel}`,
                  icon: Plus,
                  onClick: () => router.push("/dashboard/products/new")
                }}
              />
            </div>
          ) : (
            <table className="table-unified">
              <thead>
                <tr>
                  <th className="th-unified text-left">{profile.itemLabel}</th>
                  <th className="th-unified text-left hidden md:table-cell">Categoria</th>
                  <th className="th-unified text-right">Preço Unit.</th>
                  <th className="th-unified text-right hidden sm:table-cell">IVA (%)</th>
                  <th className="th-unified text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="tr-unified group">
                    <td className="td-unified min-w-0">
                      <div className="text-sm font-semibold truncate max-w-[150px] sm:max-w-[300px]">{product.name}</div>
                      <div className="text-xs flex items-center gap-2 mt-1 truncate">
                        <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-slate-200">
                          {product.code || "S/ REF"}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-500">{product.unit || profile.unitLabel}</span>
                      </div>
                    </td>
                    <td className="td-unified hidden md:table-cell">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {product.category || "Geral"}
                      </span>
                    </td>
                    <td className="td-unified text-right">
                      <div className="text-sm font-semibold">
                        {formatCurrency(product.price)}
                      </div>
                    </td>
                    <td className="td-unified text-right hidden sm:table-cell">
                      <div className="text-sm font-medium">
                        {product.vat}%
                      </div>
                    </td>
                    <td className="td-unified text-right">
                      <div className="flex justify-end gap-1 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/products/${product.id}/edit`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => {
                          if (confirm('Tem certeza que deseja apagar este produto?')) {
                            deleteProduct(product.id);
                          }
                        }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

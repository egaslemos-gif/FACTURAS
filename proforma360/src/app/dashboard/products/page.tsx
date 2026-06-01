"use client";

import { useEffect, useState } from "react";
import { useProductsStore } from "@/stores";
import { Search, Plus, MoreVertical, PackageOpen } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function ProductsPage() {
  const { products, fetchProducts, isLoading } = useProductsStore();
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
    <div className="max-w-[var(--spacing-container-max)] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-headline-lg text-[var(--color-on-surface)]">Produtos & Serviços</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
            Faça a gestão do seu catálogo de produtos e serviços
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[#003ea8] text-white rounded-lg font-medium transition-colors elevation-1"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </Link>
      </div>

      <div className="bg-white rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)] overflow-hidden">
        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-[var(--color-outline-variant)] flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-outline)]" />
            <input
              type="text"
              placeholder="Pesquisar por nome, código ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
            />
          </div>
          <div className="text-sm text-[var(--color-on-surface-variant)] ml-auto font-medium">
            {filteredProducts.length} item(s)
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center mb-4">
                <PackageOpen className="w-8 h-8 text-[var(--color-outline)]" />
              </div>
              <h3 className="text-headline-sm text-[var(--color-on-surface)] mb-2">Nenhum produto encontrado</h3>
              <p className="text-body-sm text-[var(--color-on-surface-variant)] max-w-md">
                Adicione produtos ou serviços ao seu catálogo para utilizar nas proformas.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] text-label-sm border-b border-[var(--color-outline-variant)]">
                  <th className="px-6 py-4 font-semibold uppercase">Produto / Serviço</th>
                  <th className="px-6 py-4 font-semibold uppercase hidden md:table-cell">Categoria</th>
                  <th className="px-6 py-4 font-semibold uppercase text-right">Preço Unit.</th>
                  <th className="px-6 py-4 font-semibold uppercase text-right hidden sm:table-cell">IVA (%)</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)]">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[var(--color-surface-container-lowest)] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--color-on-surface)]">{product.name}</div>
                      <div className="text-xs text-[var(--color-on-surface-variant)] flex items-center gap-2 mt-1">
                        <span className="font-mono bg-[var(--color-surface-container)] px-1.5 py-0.5 rounded text-[10px]">
                          {product.code || "S/ REF"}
                        </span>
                        <span>•</span>
                        <span>{product.unit || "Unidade"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]">
                        {product.category || "Geral"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-[var(--color-on-surface)]">
                        {formatCurrency(product.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right hidden sm:table-cell">
                      <div className="text-sm text-[var(--color-on-surface-variant)]">
                        {product.vat}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-[var(--color-outline)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container)] rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <MoreVertical className="w-5 h-5" />
                      </button>
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

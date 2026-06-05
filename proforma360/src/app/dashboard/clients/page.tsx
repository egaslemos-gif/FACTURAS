"use client";

import { useEffect, useState } from "react";
import { useClientsStore } from "@/stores";
import { Search, Plus, Trash2, Edit2, Building } from "lucide-react";
import { cn, getInitials, formatDate } from "@/lib/utils";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";

export default function ClientsPage() {
  const { clients, fetchClients, isLoading, deleteClient } = useClientsStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.tax_number?.includes(searchTerm)
  );

  return (
    <div className="max-w-[var(--spacing-container-max)] mx-auto animate-fade-in pb-12 md:pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1 leading-normal">
            Diretório e gestão de contactos.
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </Link>
      </div>

      <div className="dashboard-section p-0 overflow-hidden">
        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, email ou NUIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-white text-sm transition-all shadow-sm"
            />
          </div>
          <div className="text-sm text-slate-500 ml-auto font-medium">
            {filteredClients.length} cliente(s)
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="py-12">
              <EmptyState 
                icon={Building} 
                title="Nenhum cliente encontrado" 
                description="Comece por adicionar o seu primeiro cliente para poder gerar proformas e orçamentos."
                action={{
                  label: "Novo Cliente",
                  icon: Plus,
                  onClick: () => window.location.href = "/dashboard/clients/new"
                }}
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100/60">
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 md:py-4 text-left">Cliente</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 md:py-4 text-left">Contacto</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 md:py-4 text-left hidden md:table-cell">NUIT</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 md:py-4 text-left hidden lg:table-cell">Registado em</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 md:py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 ring-1 ring-teal-100">
                          {getInitials(client.name)}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/dashboard/clients/${client.id}`} className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors truncate block max-w-[120px] sm:max-w-[200px]">
                            {client.name}
                          </Link>
                          <div className="text-xs text-slate-500 hidden md:block truncate">
                            {client.address || "Sem endereço"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="text-sm font-medium text-slate-900 truncate max-w-[120px] sm:max-w-none">{client.email || "—"}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{client.phone || "—"}</div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 hidden md:table-cell">
                      <div className="text-sm text-slate-500 font-mono">{client.tax_number || "—"}</div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 hidden lg:table-cell">
                      <div className="text-sm text-slate-500">{formatDate(client.created_at)}</div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                      <div className="flex justify-end gap-1 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/clients/${client.id}`} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors" title="Ver Detalhes">
                          <Building className="w-4 h-4" />
                        </Link>
                        <Link href={`/dashboard/clients/${client.id}/edit`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => {
                          if (confirm('Tem certeza que deseja apagar este cliente?')) {
                            deleteClient(client.id);
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

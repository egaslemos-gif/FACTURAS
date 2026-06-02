"use client";

import { useEffect, useState } from "react";
import { useClientsStore } from "@/stores";
import { Search, Plus, Trash2, Edit2, Building } from "lucide-react";
import { cn, getInitials, formatDate } from "@/lib/utils";
import Link from "next/link";

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
    <div className="max-w-[var(--spacing-container-max)] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-headline-lg text-[var(--color-on-surface)]">Clientes</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
            Faça a gestão da sua carteira de clientes
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[#003ea8] text-white rounded-lg font-medium transition-colors elevation-1"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </Link>
      </div>

      <div className="bg-white rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)] overflow-hidden">
        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-[var(--color-outline-variant)] flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-outline)]" />
            <input
              type="text"
              placeholder="Pesquisar por nome, email ou NUIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-outline-variant)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
            />
          </div>
          <div className="text-sm text-[var(--color-on-surface-variant)] ml-auto font-medium">
            {filteredClients.length} cliente(s)
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center mb-4">
                <Building className="w-8 h-8 text-[var(--color-outline)]" />
              </div>
              <h3 className="text-headline-sm text-[var(--color-on-surface)] mb-2">Nenhum cliente encontrado</h3>
              <p className="text-body-sm text-[var(--color-on-surface-variant)] max-w-md">
                Comece por adicionar o seu primeiro cliente para poder gerar proformas e orçamentos.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] text-label-sm border-b border-[var(--color-outline-variant)]">
                  <th className="px-6 py-4 font-semibold uppercase">Cliente</th>
                  <th className="px-6 py-4 font-semibold uppercase">Contacto</th>
                  <th className="px-6 py-4 font-semibold uppercase hidden md:table-cell">NUIT</th>
                  <th className="px-6 py-4 font-semibold uppercase hidden lg:table-cell">Registado em</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)]">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-[var(--color-surface-container-lowest)] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center font-bold text-sm shrink-0">
                          {getInitials(client.name)}
                        </div>
                        <div>
                          <Link href={`/dashboard/clients/${client.id}`} className="font-semibold text-[var(--color-primary)] hover:underline">
                            {client.name}
                          </Link>
                          <div className="text-xs text-[var(--color-on-surface-variant)] hidden md:block">
                            {client.address || "Sem endereço"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--color-on-surface)]">{client.email || "—"}</div>
                      <div className="text-xs text-[var(--color-on-surface-variant)]">{client.phone || "—"}</div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-sm font-mono text-[var(--color-on-surface-variant)]">{client.tax_number || "—"}</div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="text-sm text-[var(--color-on-surface-variant)]">{formatDate(client.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/clients/${client.id}`} className="p-2 text-[var(--color-outline)] hover:text-[var(--color-primary)] hover:bg-blue-50 rounded-full transition-colors" title="Ver Detalhes">
                          <Building className="w-5 h-5" />
                        </Link>
                        <Link href={`/dashboard/clients/${client.id}/edit`} className="p-2 text-[var(--color-outline)] hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Editar">
                          <Edit2 className="w-5 h-5" />
                        </Link>
                        <button onClick={() => {
                          if (confirm('Tem certeza que deseja apagar este cliente?')) {
                            deleteClient(client.id);
                          }
                        }} className="p-2 text-[var(--color-outline)] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                          <Trash2 className="w-5 h-5" />
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

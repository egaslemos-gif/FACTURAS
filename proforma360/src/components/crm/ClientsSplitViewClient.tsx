"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useClientsStore } from "@/stores";
import { Search, Plus, Building } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import Link from "next/link";
import { getSemanticProfile } from "@/lib/ui/semanticPresentationRegistry";
import { useAppSettingsStore } from "@/stores/appSettings";

export function ClientsSplitViewClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { clients, fetchClients, isLoading } = useClientsStore();
  const { businessProfile } = useAppSettingsStore();
  const [searchTerm, setSearchTerm] = useState("");
  const profile = getSemanticProfile(businessProfile);

  const isIndexPage = pathname === "/dashboard/clients";
  const isFormPage = pathname === "/dashboard/clients/new" || pathname?.endsWith("/edit");
  
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.tax_number?.includes(searchTerm)
  );

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] md:h-[calc(100vh-theme(spacing.16)-theme(spacing.10))] gap-6">
      {/* Left List Pane (Hidden on mobile if we are on a detail page) */}
      <div className={cn(
        "w-full xl:w-[280px] flex-shrink-0 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-surface-1",
        isIndexPage ? "flex" : "hidden",
        !isIndexPage && !isFormPage && "xl:flex"
      )}>
        {/* List Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-[var(--text-primary)]">Diretório de {profile.clientPluralLabel}</h2>
          <Link href="/dashboard/clients/new" className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
          </Link>
        </div>
        {/* Search */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={`Pesquisar ${profile.clientLabel.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>
        </div>
        {/* List Items */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm font-medium">Nenhum {profile.clientLabel.toLowerCase()} encontrado.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredClients.map(client => {
                const isActive = pathname === `/dashboard/clients/${client.id}` || pathname === `/dashboard/clients/${client.id}/edit`;
                return (
                  <Link 
                    key={client.id}
                    href={`/dashboard/clients/${client.id}`}
                    className={cn(
                      "flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer group",
                      isActive && "bg-teal-50/30 hover:bg-teal-50/50 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-teal-500"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ring-1",
                      isActive ? "bg-teal-100 text-teal-800 ring-teal-200" : "bg-slate-100 text-slate-600 ring-slate-200 group-hover:bg-teal-50 group-hover:text-teal-700"
                    )}>
                      {getInitials(client.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={cn("font-bold text-sm truncate transition-colors", isActive ? "text-teal-900" : "text-[var(--text-primary)] group-hover:text-teal-700")}>{client.name}</div>
                      <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{client.email || client.phone || "Sem contacto registado"}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        isIndexPage && "hidden xl:flex bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 items-center justify-center"
      )}>
        {isIndexPage ? (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
              <Building className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">Central de {profile.clientPluralLabel}</h3>
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              Selecione um {profile.clientLabel.toLowerCase()} no diretório à esquerda para visualizar detalhes, {profile.quotationPluralLabel.toLowerCase()} e o histórico de CRM.
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto pr-2 pb-12 xl:pb-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

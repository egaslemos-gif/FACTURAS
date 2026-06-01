"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { NavItem } from "@/lib/types";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Empresa", href: "/dashboard/company", icon: "Building2" },
  { label: "Clientes", href: "/dashboard/clients", icon: "Users" },
  { label: "Produtos", href: "/dashboard/products", icon: "Package" },
  { label: "Proformas", href: "/dashboard/quotations", icon: "FileText" },
  { label: "Definições", href: "/dashboard/settings", icon: "Settings" },
];

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  FileText,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[var(--spacing-sidebar-width)] h-screen bg-white border-r border-[var(--color-outline-variant)] fixed left-0 top-0 z-40">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--color-outline-variant)]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
            P
          </div>
          <span className="text-xl font-bold text-[var(--color-primary)]">
            Proforma360
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--font-size-body-md)] transition-colors duration-200",
                isActive
                  ? "nav-active font-medium"
                  : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)]"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-outline)]"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-[var(--color-outline-variant)]">
        <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[var(--color-surface-container)] transition-colors text-left">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center font-bold">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">
              Utilizador
            </p>
            <p className="text-xs text-[var(--color-on-surface-variant)] truncate">
              Ver perfil
            </p>
          </div>
          <LogOut className="w-5 h-5 text-[var(--color-outline)]" />
        </button>
      </div>
    </aside>
  );
}

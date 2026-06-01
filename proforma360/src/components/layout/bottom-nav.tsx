"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  Settings,
  Plus,
} from "lucide-react";

const navItems = [
  { label: "Início", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/dashboard/clients", icon: Users },
  { label: "Nova", href: "/dashboard/quotations/new", icon: Plus, isFab: true },
  { label: "Produtos", href: "/dashboard/products", icon: Package },
  { label: "Definições", href: "/dashboard/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-white border-t border-[var(--color-outline-variant)] z-50 safe-bottom pb-env-safe">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          if (item.isFab) {
            return (
              <div key="fab" className="relative -top-5">
                <Link
                  href={item.href}
                  className="flex items-center justify-center w-14 h-14 bg-[var(--color-primary)] rounded-full text-white elevation-2 active:elevation-1 transition-shadow"
                >
                  <Icon className="w-6 h-6" />
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full touch-target gap-1"
            >
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-8 rounded-full transition-colors",
                  isActive
                    ? "bg-[var(--color-secondary-container)]"
                    : "bg-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isActive
                      ? "text-[var(--color-on-secondary-container)]"
                      : "text-[var(--color-on-surface-variant)]"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-[var(--color-on-surface)]"
                    : "text-[var(--color-on-surface-variant)]"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = "Dashboard" }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/80 backdrop-blur-md border-b border-[var(--color-outline-variant)]">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-[var(--color-on-surface)] md:hidden">
          {title}
        </h1>
        {/* Desktop Search */}
        <div className="hidden md:flex relative w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[var(--color-outline)]" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-[var(--color-outline-variant)] rounded-md leading-5 bg-[var(--color-surface-container-lowest)] placeholder-[var(--color-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent sm:text-sm transition-colors"
            placeholder="Pesquisar clientes, proformas..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-error)] rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
}

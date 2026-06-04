"use client";

import { useEffect, useRef } from "react";
import { Search, X, FileText, Users, Package, Zap, ArrowRight } from "lucide-react";
import { useGlobalSearch } from "@/lib/search/useGlobalSearch";
import { SearchItem } from "@/lib/search/searchIndex";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, results, recentItems, isEmpty } = useGlobalSearch();

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't override if inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Open via a global event or context in layout. For now we just focus input if open, 
          // or rely on layout to pass isOpen state.
          // In layout, we should listen to Cmd+K as well to toggle isOpen.
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, setQuery]);

  if (!isOpen) return null;

  const handleItemClick = (item: SearchItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route);
    }
    onClose();
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "quotation": return <FileText className="w-5 h-5 text-teal-600" />;
      case "client": return <Users className="w-5 h-5 text-blue-600" />;
      case "product": return <Package className="w-5 h-5 text-amber-600" />;
      case "action": return <Zap className="w-5 h-5 text-purple-600" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const renderItem = (item: SearchItem) => (
    <button
      key={item.id}
      onClick={() => handleItemClick(item)}
      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left group"
    >
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100",
        item.type === "quotation" && "bg-teal-50",
        item.type === "client" && "bg-blue-50",
        item.type === "product" && "bg-amber-50",
        item.type === "action" && "bg-purple-50"
      )}>
        {renderIcon(item.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
          {item.amount !== undefined && (
            <span className="text-sm font-bold text-slate-900 shrink-0">
              {item.amount.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MTn
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {item.subtitle && <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>}
          {item.status && (
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {item.status}
            </span>
          )}
        </div>
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] sm:pt-[10vh] px-4">
      {/* Premium dark overlay (almost solid, slight opacity, no heavy blur) */}
      <div 
        className="absolute inset-0 bg-slate-900/60 transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header Input */}
        <div className="flex items-center px-4 py-4 border-b border-slate-100">
          <Search className="w-6 h-6 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Pesquisar proformas, clientes, ações..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-lg md:text-xl font-medium text-slate-900 px-4 placeholder:text-slate-400"
          />
          <button 
            onClick={onClose}
            className="p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="py-2">
              {recentItems.length > 0 && (
                <div className="px-4 py-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Comandos e Recentes</h3>
                  <div className="grid gap-1">
                    {recentItems.map(renderItem)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-2">
              {results.length > 0 ? (
                <div className="px-4 py-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resultados</h3>
                  <div className="grid gap-1">
                    {results.map(renderItem)}
                  </div>
                </div>
              ) : (
                <div className="px-8 py-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum resultado</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Não encontrámos nada a corresponder a "{query}".
                  </p>
                  <Link 
                    href="/dashboard/quotations/new"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                  >
                    Criar Nova Proforma <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="hidden md:flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><kbd className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 shadow-sm">↑↓</kbd> Navegar</span>
            <span className="flex items-center gap-1.5"><kbd className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 shadow-sm">Enter</kbd> Selecionar</span>
          </div>
          <span className="flex items-center gap-1.5"><kbd className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 shadow-sm">Esc</kbd> Fechar</span>
        </div>
      </div>
    </div>
  );
}

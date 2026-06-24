"use client";

import { useEffect, useRef, useState } from "react";
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
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayItems = isEmpty ? recentItems : results;

  // Handle Cmd+K / Ctrl+K and Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) && e.key !== 'Escape') {
        // Only allow Escape to override inputs if modal is open
        if (!isOpen) return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, displayItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && displayItems.length > 0) {
        e.preventDefault();
        handleItemClick(displayItems[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, displayItems, selectedIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setSelectedIndex(0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, setQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

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

  const renderItem = (item: SearchItem, index: number) => {
    const isSelected = index === selectedIndex;
    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        onMouseEnter={() => setSelectedIndex(index)}
        className={cn(
          "w-full flex items-center gap-4 px-4 py-3.5 sm:py-3 sm:rounded-xl transition-all duration-200 text-left group relative",
          isSelected ? "bg-teal-50/80 shadow-[inset_4px_0_0_0_#0d9488] sm:scale-[1.01] sm:shadow-md" : "hover:bg-slate-50 border-l-4 border-transparent sm:border-none"
        )}
      >
        <div className={cn(
          "flex-shrink-0 w-12 h-12 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all duration-300",
          isSelected ? "border-teal-200 bg-white shadow-sm scale-110" : "border-slate-100 bg-slate-50 group-hover:bg-white group-hover:border-slate-200",
          item.type === "quotation" && !isSelected && "group-hover:text-teal-600",
          item.type === "client" && !isSelected && "group-hover:text-blue-600",
          item.type === "product" && !isSelected && "group-hover:text-amber-600",
          item.type === "action" && !isSelected && "group-hover:text-purple-600"
        )}>
          {renderIcon(item.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              "text-[15px] sm:text-sm font-semibold truncate transition-colors",
              isSelected ? "text-teal-900" : "text-slate-900 group-hover:text-slate-900"
            )}>{item.title}</p>
            {item.amount !== undefined && (
              <span className={cn(
                "text-[15px] sm:text-sm font-bold shrink-0 transition-colors",
                isSelected ? "text-teal-700" : "text-slate-700 group-hover:text-slate-900"
              )}>
                {item.amount.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MTn
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-0.5">
            {item.subtitle && <p className={cn(
              "text-xs truncate transition-colors",
              isSelected ? "text-teal-600/80" : "text-slate-500 group-hover:text-slate-600"
            )}>{item.subtitle}</p>}
            {item.status && (
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded transition-colors",
                isSelected ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-600"
              )}>
                {item.status}
              </span>
            )}
          </div>
        </div>
        {isSelected && (
          <div className="hidden sm:flex absolute right-4 items-center justify-center w-6 h-6 bg-teal-100 rounded-full animate-in fade-in zoom-in text-teal-700">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:pt-[10vh] sm:px-4">
      {/* Premium glass overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[4px] transition-opacity duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] max-w-2xl bg-white/95 sm:bg-white backdrop-blur-xl sm:shadow-2xl sm:rounded-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 ring-1 ring-slate-900/5">
        {/* Header Input */}
        <div className="flex items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100/50 bg-white/50 relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent pointer-events-none" />
          <Search className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600 shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Pesquise proformas, clientes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-xl sm:text-2xl font-semibold text-slate-900 px-4 placeholder:text-slate-300 outline-none caret-teal-500"
          />
          <button 
            onClick={onClose}
            className="p-2 sm:p-2.5 bg-slate-100/50 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 overscroll-contain">
          {isEmpty ? (
            <div className="py-2">
              {recentItems.length > 0 && (
                <div className="px-2 sm:px-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" />
                    Comandos e Recentes
                  </h3>
                  <div className="grid gap-1">
                    {recentItems.map((item, i) => renderItem(item, i))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-2">
              {results.length > 0 ? (
                <div className="px-2 sm:px-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5" />
                    Resultados
                  </h3>
                  <div className="grid gap-1">
                    {results.map((item, i) => renderItem(item, i))}
                  </div>
                </div>
              ) : (
                <div className="px-8 py-20 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-slate-200/50">
                    <Search className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                    Não encontrámos nada a corresponder a "<span className="font-semibold text-slate-700">{query}</span>". Tente usar termos diferentes.
                  </p>
                  <Link 
                    href="/dashboard/quotations/new"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all hover:scale-105 active:scale-95 shadow-md shadow-teal-600/20"
                  >
                    Criar Nova Proforma <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="hidden sm:flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-500 font-medium shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><kbd className="bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 shadow-sm font-sans font-bold">↑↓</kbd> Navegar</span>
            <span className="flex items-center gap-2"><kbd className="bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 shadow-sm font-sans font-bold">Enter</kbd> Selecionar</span>
          </div>
          <span className="flex items-center gap-2"><kbd className="bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 shadow-sm font-sans font-bold">Esc</kbd> Fechar</span>
        </div>
      </div>
    </div>
  );
}

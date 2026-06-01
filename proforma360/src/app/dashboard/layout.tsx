"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  Home, 
  FileText, 
  Users, 
  PackageOpen, 
  Settings, 
  LogOut, 
  Plus, 
  Menu, 
  X,
  Building2,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  HelpCircle,
  Settings,
  CloudArrowUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Proformas", href: "/dashboard/quotations", icon: FileText },
  { name: "Clientes", href: "/dashboard/clients", icon: Users },
  { name: "Produtos", href: "/dashboard/products", icon: PackageOpen },
  { name: "Empresa", href: "/dashboard/company", icon: Building2 },
  { name: "Definições", href: "/dashboard/settings", icon: Settings },
];

import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-container-lowest)]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const userInitials = session.user?.name
    ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col bg-white border-r border-[var(--color-outline-variant)] fixed h-full z-20 transition-all duration-300",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-outline-variant)] shrink-0">
          {!isSidebarCollapsed && (
            <Link href="/dashboard" className="text-xl font-bold text-[var(--color-primary)] tracking-tight truncate">
              Proforma360
            </Link>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-[var(--color-surface-container)] rounded-lg text-[var(--color-on-surface-variant)] transition-colors mx-auto"
            title="Recolher/Expandir Menu"
          >
            {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>



        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {!isSidebarCollapsed && <div className="text-xs font-semibold text-[var(--color-outline)] uppercase tracking-wider mb-2 px-3 mt-2">Menu Principal</div>}
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isSidebarCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]" 
                    : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)]",
                  isSidebarCollapsed && "justify-center"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[var(--color-primary)]" : "text-[var(--color-outline)]")} />
                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                {item.name === "Definições" && (
                  <span className="absolute right-3 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-outline-variant)] shrink-0 space-y-2">
          {!isSidebarCollapsed && (
            <button className="w-full flex items-center justify-center py-2.5 px-4 mb-4 bg-[var(--color-surface-container)] text-[var(--color-primary)] font-semibold text-sm rounded-lg border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-highest)] transition-colors">
              <CloudArrowUp className="w-4 h-4 mr-2" />
              Upgrade Plan
            </button>
          )}
          
          <button 
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)] rounded-lg transition-colors",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title="Centro de Ajuda"
          >
            <HelpCircle className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Help Center</span>}
          </button>

          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)] rounded-lg transition-colors",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title="Terminar Sessão"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full h-16 bg-white border-b border-[var(--color-outline-variant)] flex items-center justify-between px-4 z-30">
        <div className="text-lg font-bold text-[var(--color-primary)]">Proforma360</div>
        
        <div className="flex items-center gap-2">
           {session.user?.image ? (
              <img src={session.user.image} alt="User" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-[var(--color-outline-variant)]" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center font-bold text-xs">
                {userInitials}
              </div>
            )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 min-h-screen pt-16 md:pt-0 pb-20 md:pb-0 transition-all duration-300",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        
        {/* Desktop Topbar */}
        <header className="hidden md:flex h-20 bg-[var(--color-surface)]/80 backdrop-blur-md items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex-1 flex items-center gap-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-[var(--color-outline-variant)] rounded-xl w-full max-w-md focus-within:ring-2 focus-within:ring-[var(--color-primary)] transition-all shadow-sm">
              <Search className="w-4 h-4 text-[var(--color-outline)]" />
              <input 
                type="text" 
                placeholder="Pesquisar proformas, clientes..." 
                className="bg-transparent border-none outline-none text-sm w-full text-[var(--color-on-surface)]"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-5">
             <Link
               href="/dashboard/quotations/new"
               className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[#003ea8] transition-colors elevation-1 shadow-sm"
             >
               <Plus className="w-4 h-4" />
               Nova Proforma
             </Link>

             <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100" title="Dados sincronizados em tempo real (Local & Cloud)">
               <div className="relative flex items-center justify-center w-4 h-4">
                 <Cloud className="w-4 h-4 text-green-600 absolute" />
                 <div className="w-2 h-2 rounded-full bg-green-500 border border-white absolute bottom-[-2px] right-[-2px]"></div>
               </div>
             </div>

             <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)]">
                <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-full transition-all relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-full transition-all">
                  <HelpCircle className="w-5 h-5" />
                </button>
             </div>

             <div className="h-8 w-px bg-[var(--color-outline-variant)] mx-2"></div>

             <div className="flex items-center cursor-pointer">
               {session.user?.image ? (
                  <img src={session.user.image} alt="User" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full border border-[var(--color-outline-variant)] hover:ring-2 hover:ring-[var(--color-primary)] transition-all object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center font-bold text-sm hover:ring-2 hover:ring-[var(--color-primary)] transition-all">
                    {userInitials}
                  </div>
                )}
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 bg-white border-t border-[var(--color-outline-variant)] flex items-center justify-around px-2 z-30 elevation-2 pb-safe">
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)]"
              )}
            >
              <div className={cn(
                "px-4 py-1 rounded-full transition-colors",
                isActive ? "bg-[var(--color-primary-container)]" : "bg-transparent"
              )}>
                <Icon className={cn("w-5 h-5", isActive ? "text-[var(--color-primary)]" : "text-[var(--color-outline)]")} />
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile FAB (Floating Action Button) */}
      <Link
        href="/dashboard/quotations/new"
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[var(--color-primary)] text-white rounded-[16px] flex items-center justify-center elevation-3 z-30 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </Link>
      
      <PWAInstallPrompt />
    </div>
  );
}

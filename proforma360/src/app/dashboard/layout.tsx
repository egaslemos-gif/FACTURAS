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
  CloudUpload,
  CloudDownload,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSyncStore } from "@/stores";
import { dbClient } from "@/lib/db/client";

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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSyncMenuOpen, setIsSyncMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const { hasUnsyncedChanges, lastSyncDate, setHasUnsyncedChanges, setLastSyncDate } = useSyncStore();

  const handleBackup = async () => {
    try {
      setIsSyncing(true);
      const dbFile = await dbClient.getDatabaseFile();
      if (!dbFile) throw new Error("Base de dados vazia.");
      
      const formData = new FormData();
      formData.append("file", new Blob([dbFile as unknown as BlobPart]), "proforma360.db");
      
      const res = await fetch("/api/drive/backup", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Falha no upload.");
      
      setHasUnsyncedChanges(false);
      setLastSyncDate(new Date().toISOString());
      setIsSyncMenuOpen(false);
      alert("Backup guardado com sucesso na Cloud!");
    } catch (e: any) {
      alert("Erro ao fazer backup: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (hasUnsyncedChanges) {
      if (!confirm("Tem alterações locais não guardadas. Restaurar da Cloud vai apagar estas alterações. Deseja continuar?")) return;
    }
    
    try {
      setIsSyncing(true);
      const res = await fetch("/api/drive/restore");
      if (!res.ok) throw new Error("Nenhum backup encontrado.");
      
      const buffer = await res.arrayBuffer();
      await dbClient.restoreDatabaseFile(new Uint8Array(buffer));
      
      setHasUnsyncedChanges(false);
      const backupDate = res.headers.get("X-Backup-Date");
      if (backupDate) setLastSyncDate(backupDate);
      
      setIsSyncMenuOpen(false);
      alert("Backup restaurado com sucesso! A página será atualizada.");
      window.location.reload();
    } catch (e: any) {
      alert("Erro ao restaurar: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/");
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
              <CloudUpload className="w-4 h-4 mr-2" />
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
            onClick={() => signOut({ callbackUrl: "/" })}
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
        
        <div className="flex items-center gap-2 relative">
           <div className="relative">
             <button 
               onClick={() => setIsSyncMenuOpen(!isSyncMenuOpen)}
               className={cn(
                 "p-2 rounded-full transition-colors relative focus:outline-none",
                 hasUnsyncedChanges 
                   ? "bg-amber-50 text-amber-600 hover:bg-amber-100 ring-2 ring-amber-400 ring-offset-2" 
                   : "bg-blue-50 text-[var(--color-primary)] hover:bg-blue-100"
               )}
               title="Sincronização Cloud"
             >
               <Cloud className="w-5 h-5" />
               {hasUnsyncedChanges && (
                 <span className="absolute top-0 right-0 flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                 </span>
               )}
             </button>

             {isSyncMenuOpen && (
               <>
                 <div 
                   className="fixed inset-0 z-40" 
                   onClick={() => setIsSyncMenuOpen(false)}
                 ></div>
                 <div className="absolute top-12 right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[var(--color-outline-variant)] overflow-hidden z-50 animate-fade-in">
                   <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
                     <p className="text-sm font-semibold text-[var(--color-on-surface)]">Sincronização Google Drive</p>
                     <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                       {lastSyncDate ? `Última sincronização: ${new Date(lastSyncDate).toLocaleString('pt-PT')}` : "Nunca sincronizado"}
                     </p>
                     {hasUnsyncedChanges && (
                       <div className="mt-2 text-xs font-medium text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                         Existem alterações locais que ainda não guardadas na Cloud.
                       </div>
                     )}
                   </div>
                   <div className="p-2 space-y-1">
                     <button 
                       onClick={handleBackup} 
                       disabled={isSyncing}
                       className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] rounded-lg transition-colors disabled:opacity-50"
                     >
                       {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4 text-green-600" />}
                       Fazer Backup
                     </button>
                     <button 
                       onClick={handleRestore} 
                       disabled={isSyncing}
                       className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] rounded-lg transition-colors disabled:opacity-50"
                     >
                       {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4 text-blue-600" />}
                       Restaurar
                     </button>
                   </div>
                 </div>
               </>
             )}
           </div>

           <button 
             onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
             className="focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-full"
           >
             {session.user?.image ? (
                <img src={session.user.image} alt="User" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-[var(--color-outline-variant)] object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center font-bold text-xs">
                  {userInitials}
                </div>
              )}
           </button>

           {isProfileMenuOpen && (
             <>
               <div 
                 className="fixed inset-0 z-40" 
                 onClick={() => setIsProfileMenuOpen(false)}
               ></div>
               <div className="absolute top-10 right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[var(--color-outline-variant)] overflow-hidden z-50 animate-fade-in">
                 <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
                   <p className="text-sm font-semibold text-[var(--color-on-surface)] truncate">{session.user?.name}</p>
                   <p className="text-xs text-[var(--color-on-surface-variant)] truncate">{session.user?.email}</p>
                 </div>
                 <Link href="/dashboard/company" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] transition-colors">
                   <Building2 className="w-4 h-4" /> Perfil da Empresa
                 </Link>
                 <Link href="/dashboard/settings" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] transition-colors">
                   <Settings className="w-4 h-4" /> Definições
                 </Link>
                 <div className="border-t border-[var(--color-outline-variant)]"></div>
                 <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                   <LogOut className="w-4 h-4" /> Terminar Sessão
                 </button>
               </div>
             </>
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

             <div className="relative">
               <button 
                 onClick={() => setIsSyncMenuOpen(!isSyncMenuOpen)}
                 className={cn(
                   "p-2 rounded-full transition-colors relative focus:outline-none",
                   hasUnsyncedChanges 
                     ? "bg-amber-50 text-amber-600 hover:bg-amber-100 ring-2 ring-amber-400 ring-offset-2" 
                     : "bg-blue-50 text-[var(--color-primary)] hover:bg-blue-100"
                 )}
                 title="Sincronização Cloud"
               >
                 <Cloud className="w-5 h-5" />
                 {hasUnsyncedChanges && (
                   <span className="absolute top-0 right-0 flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                   </span>
                 )}
               </button>

               {isSyncMenuOpen && (
                 <>
                   <div 
                     className="fixed inset-0 z-40" 
                     onClick={() => setIsSyncMenuOpen(false)}
                   ></div>
                   <div className="absolute top-12 right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[var(--color-outline-variant)] overflow-hidden z-50 animate-fade-in">
                     <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
                       <p className="text-sm font-semibold text-[var(--color-on-surface)]">Sincronização Google Drive</p>
                       <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                         {lastSyncDate ? `Última sincronização: ${new Date(lastSyncDate).toLocaleString('pt-PT')}` : "Nunca sincronizado"}
                       </p>
                       {hasUnsyncedChanges && (
                         <div className="mt-2 text-xs font-medium text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                           Existem alterações locais que ainda não foram guardadas na Cloud.
                         </div>
                       )}
                     </div>
                     <div className="p-2 space-y-1">
                       <button 
                         onClick={handleBackup} 
                         disabled={isSyncing}
                         className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] rounded-lg transition-colors disabled:opacity-50"
                       >
                         {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4 text-green-600" />}
                         Fazer Backup para Cloud
                       </button>
                       <button 
                         onClick={handleRestore} 
                         disabled={isSyncing}
                         className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] rounded-lg transition-colors disabled:opacity-50"
                       >
                         {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4 text-blue-600" />}
                         Restaurar da Cloud
                       </button>
                     </div>
                   </div>
                 </>
               )}
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

             <div className="flex items-center cursor-pointer relative">
               <button 
                 onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                 className="focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-full"
               >
                 {session.user?.image ? (
                    <img src={session.user.image} alt="User" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full border border-[var(--color-outline-variant)] hover:ring-2 hover:ring-[var(--color-primary)] transition-all object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center font-bold text-sm hover:ring-2 hover:ring-[var(--color-primary)] transition-all">
                      {userInitials}
                    </div>
                  )}
               </button>

               {isProfileMenuOpen && (
                 <>
                   <div 
                     className="fixed inset-0 z-40 hidden md:block" 
                     onClick={() => setIsProfileMenuOpen(false)}
                   ></div>
                   <div className="absolute top-12 right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[var(--color-outline-variant)] overflow-hidden z-50 animate-fade-in hidden md:block">
                     <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
                       <p className="text-sm font-semibold text-[var(--color-on-surface)] truncate">{session.user?.name}</p>
                       <p className="text-xs text-[var(--color-on-surface-variant)] truncate">{session.user?.email}</p>
                     </div>
                     <Link href="/dashboard/company" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] transition-colors">
                       <Building2 className="w-4 h-4" /> Perfil da Empresa
                     </Link>
                     <Link href="/dashboard/settings" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] transition-colors">
                       <Settings className="w-4 h-4" /> Definições
                     </Link>
                     <div className="border-t border-[var(--color-outline-variant)]"></div>
                     <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                       <LogOut className="w-4 h-4" /> Terminar Sessão
                     </button>
                   </div>
                 </>
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

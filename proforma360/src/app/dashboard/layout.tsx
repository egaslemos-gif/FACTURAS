"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { 
  Home, 
  FileText, 
  Users, 
  Package, 
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
  RefreshCw, 
  WifiOff,
  Wifi,
  CloudCog,
  Kanban,
  MoreHorizontal,
  CircleHelp,
  Share2,
  CreditCard
} from "lucide-react";
import ShareAppModal from "@/components/ShareAppModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSyncStore, useClientsStore, useProductsStore, useQuotationsStore } from "@/stores";
import { dbClient } from "@/lib/db/client";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { saveOfflineSession, getOfflineSession, clearOfflineSession } from "@/lib/db/session";
import OnboardingTour from "@/components/OnboardingTour";
import { useLicenseStore } from "@/stores/licenseStore";
import { useAppSettingsStore } from "@/stores/appSettings";
import { getSemanticProfile } from "@/lib/ui/semanticPresentationRegistry";
import UpgradeModal from "@/components/UpgradeModal";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { checkDueFollowUps } from "@/lib/pipeline/notifications";
import { generateTenantHash } from "@/lib/runtime/runtimeNamespace";
import { runtimeOwnership } from "@/lib/runtime/runtimeOwnership";
import { runtimeBootstrapGuard } from "@/lib/runtime/runtimeBootstrapGuard";
import { useRuntimeStateMachine } from "@/lib/runtime/runtimeStateMachine";

// We will compute these dynamically inside the component to support semantic profiles
const BASE_NAV_GROUPS = [
  {
    label: "Comercial",
    items: [
      { id: "dashboard", name: "Dashboard", href: "/dashboard", icon: Home },
      { id: "quotations", name: "Proformas", href: "/dashboard/quotations", icon: FileText },
      { id: "pipeline", name: "Pipeline", href: "/dashboard/pipeline", icon: Kanban },
    ]
  },
  {
    label: "Catálogo",
    items: [
      { id: "clients", name: "Clientes", href: "/dashboard/clients", icon: Users },
      { id: "products", name: "Catálogo Comercial", href: "/dashboard/products", icon: Package },
    ]
  },
  {
    label: "Empresa",
    items: [
      { id: "company", name: "Minha Empresa", href: "/dashboard/company", icon: Building2 },
      { id: "subscription", name: "Subscrição", href: "/dashboard/subscription", icon: CreditCard },
    ]
  },
  {
    label: "Sistema",
    items: [
      { id: "settings", name: "Definições", href: "/dashboard/settings", icon: Settings },
    ]
  }
];

const BASE_MOBILE_NAV = [
  { id: "dashboard", name: "Dashboard", href: "/dashboard", icon: Home },
  { id: "quotations", name: "Proformas", href: "/dashboard/quotations", icon: FileText },
  { id: "clients", name: "Clientes", href: "/dashboard/clients", icon: Users },
  { id: "products", name: "Produtos", href: "/dashboard/products", icon: Package },
];

const BASE_MOBILE_MORE = [
  { id: "pipeline", name: "Pipeline", href: "/dashboard/pipeline", icon: Kanban },
  { id: "company", name: "A Minha Empresa", href: "/dashboard/company", icon: Building2 },
  { id: "subscription", name: "Planos & Subscrição", href: "/dashboard/subscription", icon: CreditCard },
  { id: "settings", name: "Definições", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  // const dispatch = useRuntimeStateMachine(state => state.dispatch); // Temporarily disabled to debug
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSyncMenuOpen, setIsSyncMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const profileMenuContainerRef = useRef<HTMLDivElement>(null);
  const mobileProfileMenuContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideDesktop = profileMenuContainerRef.current && !profileMenuContainerRef.current.contains(target);
      const isOutsideMobile = mobileProfileMenuContainerRef.current && !mobileProfileMenuContainerRef.current.contains(target);
      
      if (isOutsideDesktop && isOutsideMobile) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  const { isOffline, isChecking } = useNetworkStatus();
  const { fetchLicense, isAdmin } = useLicenseStore();
  const [offlineSession, setOfflineSession] = useState<any>(null);

  // --- ALL HOOKS MUST BE CALLED UNCONDITIONALLY (React Rules of Hooks) ---
  const { hasUnsyncedChanges, lastSyncDate, setHasUnsyncedChanges, setLastSyncDate } = useSyncStore();
  const { clients, fetchClients } = useClientsStore();
  const { products, fetchProducts } = useProductsStore();
  const { quotations, fetchQuotations } = useQuotationsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [unsyncedQueueCount, setUnsyncedQueueCount] = useState(0);
  const [isShareAppModalOpen, setIsShareAppModalOpen] = useState(false);
  const [notifiedSet] = useState(new Set<string>());

  useEffect(() => {
    // Attempt to load offline session immediately
    getOfflineSession().then(data => {
      if (data) setOfflineSession(data);
    });
  }, []);

  const { businessProfile, fetchSettings } = useAppSettingsStore();
  const semanticProfile = getSemanticProfile(businessProfile);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Compute dynamic navigation groups based on semantic profile
  const navGroups = BASE_NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.map(item => {
      if (item.id === "products") return { ...item, name: semanticProfile.itemPluralLabel, icon: semanticProfile.icon };
      return item;
    })
  }));

  const mobileNavItems = BASE_MOBILE_NAV.map(item => {
    if (item.id === "products") return { ...item, name: semanticProfile.navLabel, icon: semanticProfile.icon };
    return item;
  });

  const mobileMoreItems = BASE_MOBILE_MORE.map(item => {
    if (item.id === "products") return { ...item, name: semanticProfile.navLabel, icon: semanticProfile.icon };
    return item;
  });

  useEffect(() => {
    if (session?.user?.email) {
      saveOfflineSession(session);
      setOfflineSession(session);
      fetchLicense(true); // Always force check on layout mount to prevent stale admin status
    }
  }, [session, fetchLicense]);

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      if (!isOffline) {
        signOut({ callbackUrl: "/login" });
      }
    }
  }, [session, isOffline]);

  const activeSession = session || offlineSession;
  const [runtimeReady, setRuntimeReady] = useState(false);

  // Runtime Governance Boot Sequence
  useEffect(() => {
    async function resolveRuntime() {
      if (status === "loading" && !isOffline) return;
      if (!activeSession?.user?.email) return;
      
      try {
        // GUARD: If we have both a live session and an offline session,
        // verify they belong to the same user. If not, the offline session
        // is stale from a previous user and must be purged.
        if (session?.user?.email && offlineSession?.user?.email 
            && session.user.email !== offlineSession.user.email) {
          console.warn("[Boot] Offline session belongs to a different user. Purging.");
          await clearOfflineSession();
          setOfflineSession(null);
          // Continue with the live session
        }

        const email = activeSession.user.email;
        // Use providerAccountId (stable Google ID) as primary identifier,
        // fallback to user.id, then email as last resort
        const providerId = (activeSession as any).providerAccountId || activeSession.user.id || email;
        const provider = "google"; // Matches the actual OAuth provider

        const hash = await generateTenantHash(provider, providerId);
        
        // State Machine Transition
        runtimeOwnership.setState('AUTH_RESOLVED');
        runtimeOwnership.emitOwnershipResolved(hash);
        
        // Rehydrate Zustand stores now that storage is namespaced
        await useLicenseStore.persist.rehydrate();
        await useSyncStore.persist.rehydrate();
        
        // Initialize User Scoped DB
        await dbClient.setTenantHash(hash);
        await dbClient.init();
        
        runtimeOwnership.setState('RUNTIME_READY');
        
        setRuntimeReady(true);
        
        // Safe to fetch admin status now
        fetchLicense(true);
      } catch (err) {
        console.error("[Boot] Failed to resolve runtime:", err);
      }
    }
    resolveRuntime();
  }, [activeSession, status, isOffline]);

  useEffect(() => {
    if (!runtimeReady) return;
    async function updateQueueCount() {
      try {
        const { PersistentSyncQueue } = await import("@/lib/sync/persistentSyncQueue");
        const count = await PersistentSyncQueue.getUnsyncedCount();
        setUnsyncedQueueCount(count);
      } catch (err) {
        console.error("Failed to check queue count", err);
      }
    }
    updateQueueCount();
    const interval = setInterval(updateQueueCount, 5000);
    return () => clearInterval(interval);
  }, [runtimeReady]);

  useEffect(() => {
    if (!runtimeReady) return;
    // Fetch data for global search if not already fetched
    if (clients.length === 0) fetchClients();
    if (products.length === 0) fetchProducts();
    if (quotations.length === 0) fetchQuotations();
    // Re-fetch settings now that the database is accessible
    fetchSettings();
  }, [runtimeReady, fetchClients, fetchProducts, fetchQuotations, fetchSettings]);

  // Check for due follow-up notifications
  useEffect(() => {
    if (!runtimeReady) return;
    if (quotations.length === 0) return;
    checkDueFollowUps(quotations, notifiedSet);
    
    const interval = setInterval(() => {
      checkDueFollowUps(quotations, notifiedSet);
    }, 5 * 60 * 1000);

    const onFocus = () => checkDueFollowUps(quotations, notifiedSet);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [runtimeReady, quotations, notifiedSet]);

  // Listen for Cmd+K / Ctrl+K to open search globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't override if inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBackup = async () => {
    try {
      setIsSyncing(true);
      const dbFile = await dbClient.getDatabaseFile();
      if (!dbFile) throw new Error("Base de dados vazia.");
      
      const formData = new FormData();
      formData.append("file", new Blob([dbFile as unknown as BlobPart]), "proforma360.db");
      
      const res = await fetch("/api/drive/backup", { method: "POST", body: formData });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Falha no upload. Verifique a sua ligação e tente novamente.");
      }
      
      setHasUnsyncedChanges(false);
      setLastSyncDate(new Date().toISOString());
      setIsSyncMenuOpen(false);
      toast.success("Backup guardado com sucesso na Cloud!");
    } catch (e: any) {
      toast.error("Erro ao fazer backup: " + e.message);
      if (e.message.includes("Invalid Credentials") || e.message.includes("Não autorizado")) {
        toast.info("A sua sessão Google pode ter expirado. Por favor, faça logout e login novamente.");
      }
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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Nenhum backup encontrado ou falha no download.");
      }
      
      const buffer = await res.arrayBuffer();
      await dbClient.restoreDatabaseFile(new Uint8Array(buffer));
      
      setHasUnsyncedChanges(false);
      const backupDate = res.headers.get("X-Backup-Date");
      if (backupDate) setLastSyncDate(backupDate);
      
      setIsSyncMenuOpen(false);
      toast.success("Dados restaurados com sucesso da Cloud.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro na restauração.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Check if new database and suggest restore
    if (dbClient.isNewDatabase && activeSession && !isOffline && !isChecking) {
      // Small timeout to not bombard user instantly
      const t = setTimeout(() => {
        toast.message("Novo Dispositivo Detetado", {
          description: "Não encontrámos dados locais neste dispositivo. Pretende verificar se existe um backup na nuvem?",
          duration: 10000,
          action: {
            label: "Restaurar Backup",
            onClick: () => handleRestore(),
          },
        });
        dbClient.isNewDatabase = false; // Prevent multiple prompts
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [activeSession, isOffline, isChecking]);

  useEffect(() => {
    if (status === "unauthenticated" && !isChecking) {
      if (isOffline) {
        // Offline: try to use cached session, don't redirect
        getOfflineSession().then(offSession => {
          if (!offSession) {
            // No cached session at all — must go online to login
            router.push("/");
          }
          // If offSession exists, activeSession will be derived from it
        });
      } else {
        router.push("/");
      }
    }
  }, [status, isOffline, isChecking, router]);

  const searchResults = () => {
    if (!searchQuery) return { clients: [], products: [], quotations: [], total: 0 };
    const q = searchQuery.toLowerCase();
    const c = clients.filter(c => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.tax_number?.includes(q)).slice(0, 3);
    const p = products.filter(p => p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)).slice(0, 3);
    const quo = quotations.filter(quo => quo.quotation_number.toLowerCase().includes(q) || quo.client_name?.toLowerCase().includes(q)).slice(0, 3);
    return { clients: c, products: p, quotations: quo, total: c.length + p.length + quo.length };
  };

  const results = searchResults();

  // Enforce Hydration Governance: DO NOT render children before RUNTIME_READY
  if (!runtimeReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-surface-container-lowest)]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-[var(--color-on-surface-variant)] animate-pulse">
          Validando cofre seguro...
        </p>
      </div>
    );
  }





  // Removed legacy loading check since we now use runtimeReady

  const userInitials = activeSession?.user?.name
    ? activeSession.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = async () => {
    try {
      setIsProfileMenuOpen(false);
      setIsSidebarCollapsed(true);
      
      // Immediately block runtime to prevent resolveRuntime from using stale session
      setRuntimeReady(false);
      setOfflineSession(null);

      const performCleanup = async () => {
        try {
          // Destrói a base de dados de forma segura seguindo a Fase 8 de Isolamento
          const { tenantIsolationManager } = await import("@/lib/runtime/tenantIsolation");
          // Change to PERSISTENT_PERSONAL_DEVICE to keep data in IDB across logouts. 
          // New accounts will get their own isolated hash.
          await tenantIsolationManager.teardownTenant("PERSISTENT_PERSONAL_DEVICE");
          
          // Clear offline db first (might hang if idb is blocked)
          await clearOfflineSession();
          
          // Reset memory stores to prevent bleeding on back-navigation or re-login without reload
          useQuotationsStore.setState({ quotations: [], currentDetail: null });
          useClientsStore.setState({ clients: [] });
          useProductsStore.setState({ products: [] });

          // Clear local states and in-memory tenant hash
          await runtimeOwnership.runtimeTeardown(true);
          // Sign out using NextAuth and explicitly return to landing page
          await signOut({ callbackUrl: "/" });
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      };
      
      // Execute cleanup — give enough time for IndexedDB operations
      await Promise.race([
        performCleanup(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      
      // Navigation is handled by signOut callbackUrl
    } catch (error) {
      console.error("Erro no logout:", error);
      // Fallback
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col bg-[var(--color-surface-container-lowest)] border-r border-[var(--color-outline-variant)] fixed h-full z-20 transition-all duration-300",
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
            className="p-2 hover:bg-[var(--color-surface-container)] rounded-md text-[var(--color-on-surface-variant)] transition-colors mx-auto"
            title="Recolher/Expandir Menu"
          >
            {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 py-4 overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={group.label} className={cn(isSidebarCollapsed ? "px-2" : "px-4", idx > 0 && "mt-6")}>
              {!isSidebarCollapsed && (
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
                  {group.label}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname === item.href || pathname?.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        "flex items-center rounded-lg transition-all duration-200 group relative",
                        isSidebarCollapsed ? "justify-center py-3" : "px-3 py-2.5",
                        isActive 
                          ? "bg-slate-900 text-white font-medium shadow-surface-1 ring-1 ring-slate-800" 
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                      title={isSidebarCollapsed ? item.name : undefined}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-1 bg-teal-400 rounded-r-full shadow-[0_0_8px_rgba(45,212,191,0.5)]"></div>
                      )}
                      <Icon className={cn(
                        "w-5 h-5 transition-colors shrink-0", 
                        !isSidebarCollapsed && "mr-3",
                        isActive ? "text-teal-400" : "text-slate-400 group-hover:text-slate-600"
                      )} />
                      {!isSidebarCollapsed && <span className="text-sm tracking-wide">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
      </nav>

        {isAdmin && (
             <Link
               href="/dashboard/admin"
               prefetch={true}
               className={cn(
                 "flex items-center rounded-lg transition-all duration-200 group relative mt-4 mx-4 mb-4 border border-teal-100",
                 isSidebarCollapsed ? "justify-center py-3 px-0" : "px-3 py-2.5",
                 pathname === '/dashboard/admin' 
                   ? "bg-teal-50 text-teal-700 font-medium shadow-sm" 
                   : "text-slate-600 hover:bg-teal-50 hover:text-teal-700"
               )}
               title={isSidebarCollapsed ? "Admin Panel" : undefined}
             >
               {pathname === '/dashboard/admin' && (
                 <div className="absolute left-0 top-2 bottom-2 w-1 bg-teal-500 rounded-r-full"></div>
               )}
               <Settings className={cn(
                 "w-5 h-5 transition-colors shrink-0", 
                 !isSidebarCollapsed && "mr-3",
                 pathname === '/dashboard/admin' ? "text-teal-500" : "text-teal-400 group-hover:text-teal-600"
               )} />
               {!isSidebarCollapsed && <span className="text-sm tracking-wide">Admin Panel</span>}
             </Link>
          )}

        {/* --- Contextual Operational State --- */}
        {!isSidebarCollapsed && (
          <div className="px-4 mt-auto mb-2 shrink-0">
            <div className={cn(
              "p-3 rounded-lg border flex items-center gap-3 transition-colors shadow-surface-1",
              isOffline 
                ? "bg-red-50 border-red-100" 
                : unsyncedQueueCount > 0 
                  ? "bg-amber-50 border-amber-100" 
                  : "bg-emerald-50 border-emerald-100"
            )}>
              {isOffline ? (
                <WifiOff className="w-5 h-5 text-red-600 shrink-0" />
              ) : unsyncedQueueCount > 0 ? (
                <div className="relative shrink-0">
                  <CloudCog className="w-5 h-5 text-amber-600 animate-[spin_3s_linear_infinite]" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse border border-white"></span>
                </div>
              ) : (
                <Wifi className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-wider leading-tight",
                  isOffline ? "text-red-700" : unsyncedQueueCount > 0 ? "text-amber-700" : "text-emerald-700"
                )}>
                  {isOffline ? "Offline" : unsyncedQueueCount > 0 ? "A Sincronizar" : "Online"}
                </p>
                <p className={cn(
                  "text-[11px] font-medium truncate leading-tight",
                  isOffline ? "text-red-600/80" : unsyncedQueueCount > 0 ? "text-amber-600/80" : "text-emerald-600/80"
                )}>
                  {unsyncedQueueCount > 0 ? `${unsyncedQueueCount} pendentes` : isOffline ? "Aguardando rede" : "Sistemas normais"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-[var(--color-outline-variant)] shrink-0 space-y-2">
          <button 
            onClick={() => setIsShareAppModalOpen(true)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title="Partilhar App"
          >
            <Share2 className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Partilhar App</span>}
          </button>
          <button 
            onClick={() => setShowTour(true)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)] rounded-md transition-colors",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title="Ajuda / Tour"
          >
            <CircleHelp className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Ajuda</span>}
          </button>

          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)] rounded-md transition-colors",
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
      <header className={cn(
        "md:hidden fixed top-0 w-full h-16 bg-white/98 backdrop-blur-sm flex items-center justify-between px-4 z-30 transition-shadow duration-200",
        isScrolled ? "shadow-soft border-b border-transparent" : "border-b border-gray-100"
      )}>
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold text-[var(--color-primary)]">Proforma360</div>
          {isOffline && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium" title="A funcionar offline">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
              Offline
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 relative" ref={mobileProfileMenuContainerRef}>
           <button 
             onClick={() => setIsSearchOpen(true)}
             className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
             title="Pesquisar (Cmd+K)"
           >
             <Search className="w-5 h-5" />
           </button>
           <button 
              onClick={() => setIsSyncMenuOpen(!isSyncMenuOpen)}
              className={cn(
                "relative p-1.5 rounded-full transition-colors",
                unsyncedQueueCount > 0 || hasUnsyncedChanges 
                  ? "text-amber-600 bg-amber-50" 
                  : "text-gray-500 hover:text-gray-700"
              )}
              title="Sincronização Cloud"
            >
              <Cloud className="w-5 h-5" />
              {unsyncedQueueCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                  {unsyncedQueueCount}
                </span>
              ) : hasUnsyncedChanges ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              ) : null}
            </button>
           <button 
             onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
             className="focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-full"
           >
             {activeSession?.user?.image && !isOffline ? (
                <img src={activeSession.user.image} alt="User" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-[var(--color-outline-variant)] object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center font-bold text-xs">
                  {userInitials}
                </div>
              )}
           </button>

           {isProfileMenuOpen && (
             <div className="absolute top-12 right-0 mt-2 w-64 md:w-72 bg-[var(--color-surface-elevated)] rounded-xl shadow-elevated border border-gray-100 overflow-hidden z-50">
                 <div className="p-4 border-b border-gray-100 bg-[var(--color-surface-elevated)]">
                   <p className="text-sm font-semibold text-[var(--color-on-surface)] truncate">{activeSession?.user?.name}</p>
                   <p className="text-xs text-[var(--color-on-surface-variant)] truncate mt-0.5">{activeSession?.user?.email}</p>
                 </div>
                 <Link href="/dashboard/pipeline" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] transition-colors">
                   <Kanban className="w-4 h-4" /> Pipeline
                 </Link>
                 <Link href="/dashboard/subscription" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] transition-colors">
                   <CreditCard className="w-4 h-4" /> Planos & Subscrição
                 </Link>
                 <Link href="/dashboard/company" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] transition-colors">
                   <Building2 className="w-4 h-4" /> Perfil da Empresa
                 </Link>
                 <Link href="/dashboard/settings" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] transition-colors">
                   <Settings className="w-4 h-4" /> Definições
                 </Link>
                 <button onClick={() => { setIsShareAppModalOpen(true); setIsProfileMenuOpen(false); }} className="flex items-center w-full text-left gap-3 px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-emerald-600 transition-colors">
                   <Share2 className="w-4 h-4" /> Partilhar Proforma360
                 </button>
                 <div className="border-t border-[var(--color-outline-variant)]"></div>
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Terminar Sessão
                  </button>
               </div>
           )}

           {/* Mobile Sync Menu */}
           {isSyncMenuOpen && (
             <>
               <div 
                 className="fixed inset-0 z-40" 
                 onClick={() => setIsSyncMenuOpen(false)}
               ></div>
               <div className="absolute top-12 right-0 mt-2 w-80 bg-[var(--color-surface-elevated)] rounded-xl shadow-elevated border border-gray-100 overflow-hidden z-50">
                 <div className="p-4 border-b border-gray-100 bg-[var(--color-surface-elevated)]">
                   <p className="text-sm font-semibold text-[var(--color-on-surface)]">Sincronização Google Drive</p>
                   <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                     {lastSyncDate ? `Última sincronização: ${new Date(lastSyncDate).toLocaleDateString('pt-PT')} às ${new Date(lastSyncDate).toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'})}` : "Nunca sincronizado"}
                   </p>
                   
                   {lastSyncDate && Date.now() - new Date(lastSyncDate).getTime() > 7 * 24 * 60 * 60 * 1000 && (
                     <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ Último backup há mais de 7 dias!</p>
                   )}

                    {unsyncedQueueCount > 0 ? (
                      <div className="mt-2 text-xs font-semibold text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                        {unsyncedQueueCount} ações de sincronização pendentes.
                      </div>
                    ) : hasUnsyncedChanges ? (
                      <div className="mt-2 text-xs font-medium text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                        Existem alterações locais pendentes.
                      </div>
                    ) : null}
                 </div>
                 <div className="p-2 space-y-1">
                   <button 
                     onClick={handleBackup} 
                     disabled={isSyncing || isOffline}
                     title={isOffline ? "Internet necessária para sincronização" : "Guardar dados na cloud"}
                     className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4 text-green-600" />}
                     Fazer Backup
                   </button>
                   <button 
                     onClick={handleRestore} 
                     disabled={isSyncing || isOffline}
                     title={isOffline ? "Internet necessária para restaurar" : "Restaurar dados da cloud"}
                     className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4 text-blue-600" />}
                     Restaurar Backup
                   </button>
                 </div>
               </div>
             </>
           )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 min-w-0 min-h-screen pt-16 md:pt-0 pb-20 md:pb-0 transition-all duration-300",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        
        {/* Desktop Topbar */}
        <header className={cn(
          "hidden md:flex h-16 bg-white/98 backdrop-blur-sm items-center justify-between px-8 sticky top-0 z-30 transition-shadow duration-200",
          isScrolled ? "shadow-soft border-b border-transparent" : "border-b border-gray-100"
        )}>
          <div className="flex-1 flex items-center gap-4">
            <div className="flex items-center gap-3">

              
              {isOffline && (
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200" title="A funcionar offline">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                  Offline
                </div>
              )}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-md text-sm font-medium transition-colors border border-slate-200"
                title="Pesquisar Global"
              >
                <Search className="w-4 h-4" />
                <span className="opacity-80 hidden lg:inline">Pesquisar...</span>
                <kbd className="ml-2 bg-white px-1.5 py-0.5 rounded shadow-sm text-[10px] font-bold tracking-wider opacity-60">⌘K</kbd>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
             <Link
               href="/dashboard/quotations/new"
               prefetch={true}
               className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-md font-medium hover:bg-[#003ea8] transition-colors elevation-1 shadow-sm"
             >
               <Plus className="w-4 h-4" />
               Nova Proforma
             </Link>

             <div className="hidden md:block relative">
                <button 
                  onClick={() => setIsSyncMenuOpen(!isSyncMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md transition-colors border",
                    unsyncedQueueCount > 0 || hasUnsyncedChanges 
                      ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" 
                      : "bg-white border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
                  )}
                  title="Sincronização Cloud"
                >
                  <Cloud className="w-4 h-4" />
                  <span className="text-sm font-medium">Sync</span>
                  {unsyncedQueueCount > 0 ? (
                    <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                      {unsyncedQueueCount}
                    </span>
                  ) : hasUnsyncedChanges ? (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  ) : null}
                </button>

                {isSyncMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSyncMenuOpen(false)}
                    ></div>
                    <div className="absolute top-12 right-0 mt-2 w-80 bg-[var(--color-surface-elevated)] rounded-xl shadow-elevated border border-gray-100 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-100 bg-[var(--color-surface-elevated)]">
                        <p className="text-sm font-semibold text-[var(--color-on-surface)]">Sincronização Google Drive</p>
                        <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                          {lastSyncDate ? `Última sincronização: ${new Date(lastSyncDate).toLocaleDateString('pt-PT')} às ${new Date(lastSyncDate).toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'})}` : "Nunca sincronizado"}
                        </p>
                        
                        {lastSyncDate && Date.now() - new Date(lastSyncDate).getTime() > 7 * 24 * 60 * 60 * 1000 && (
                          <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ Último backup há mais de 7 dias!</p>
                        )}

                        {unsyncedQueueCount > 0 ? (
                          <div className="mt-2 text-xs font-semibold text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                            {unsyncedQueueCount} ações de sincronização pendentes.
                          </div>
                        ) : hasUnsyncedChanges ? (
                          <div className="mt-2 text-xs font-medium text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                            Existem alterações locais pendentes.
                          </div>
                        ) : null}

                        <div className="mt-3 text-[11px] text-gray-500 bg-gray-50 p-2 rounded leading-tight">
                          <strong>Dica de Uso:</strong> Utilize preferencialmente um dispositivo principal. O sistema foi desenhado para funcionar offline-first e evita conflitos de dados.
                        </div>
                      </div>
                      <div className="p-2 space-y-1">
                        <button 
                          onClick={handleBackup} 
                          disabled={isSyncing || isOffline}
                          title={isOffline ? "Internet necessária para sincronização" : "Guardar dados na cloud"}
                          className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4 text-green-600" />}
                          Fazer Backup
                        </button>
                        <button 
                          onClick={handleRestore} 
                          disabled={isSyncing || isOffline}
                          title={isOffline ? "Internet necessária para restaurar" : "Restaurar dados da cloud"}
                          className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4 text-blue-600" />}
                          Restaurar Backup
                        </button>
                      </div>
                    </div>
                  </>
                )}
             </div>

             <div className="hidden md:block relative" ref={profileMenuContainerRef}>
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-full transition-transform hover:scale-105"
                >
                  {activeSession?.user?.image && !isOffline ? (
                    <img src={activeSession.user.image} alt="User" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full border border-[var(--color-outline-variant)] object-cover shadow-sm" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center font-bold text-sm shadow-sm">
                      {userInitials}
                    </div>
                  )}
                </button>

                {isProfileMenuOpen && (
                    <div className="absolute top-12 right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-[var(--color-outline-variant)] overflow-hidden z-50 animate-fade-in">
                      <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
                        <p className="text-sm font-semibold text-[var(--color-on-surface)] truncate">{activeSession?.user?.name}</p>
                        <p className="text-xs text-[var(--color-on-surface-variant)] truncate mt-0.5">{activeSession?.user?.email}</p>
                      </div>
                      <Link href="/dashboard/company" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] transition-colors">
                        <Building2 className="w-4 h-4" /> Perfil da Empresa
                      </Link>
                      <button onClick={() => { setIsShareAppModalOpen(true); setIsProfileMenuOpen(false); }} className="flex items-center w-full text-left gap-3 px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-emerald-600 transition-colors">
                        <Share2 className="w-4 h-4" /> Partilhar Proforma360
                      </button>
                      <Link href="/dashboard/settings" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] transition-colors">
                        <Settings className="w-4 h-4" /> Definições
                      </Link>
                      <div className="border-t border-[var(--color-outline-variant)]"></div>
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" /> Terminar Sessão
                      </button>
                    </div>
                )}
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-3 py-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/98 backdrop-blur-md border-t border-gray-100 shadow-surface-2 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-full px-2">
          {mobileNavItems.slice(0, 2).map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className="flex flex-col items-center justify-center w-[20%] h-full relative group touch-target"
              >
                <div className={cn(
                  "flex flex-col items-center transition-all duration-200",
                  isActive ? "text-teal-600 scale-105" : "text-gray-400 group-active:scale-95"
                )}>
                  <Icon className={cn("w-5 h-5 mb-1", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                  <span className={cn("text-[10px] tracking-wide", isActive ? "font-bold" : "font-medium")}>{item.name}</span>
                </div>
              </Link>
            );
          })}
          
          {/* Center FAB Slot */}
          <div className="w-[20%] flex justify-center items-center h-full relative pointer-events-none">
            <div className="pointer-events-auto absolute -top-10">
              <button
                onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                className={cn(
                  "w-[60px] h-[60px] bg-[#0f172a] text-white rounded-full flex items-center justify-center shadow-lg border-[4px] border-white transition-all duration-300 active:scale-95",
                  isQuickActionsOpen ? "rotate-45 shadow-none bg-gray-800" : ""
                )}
              >
                <Plus className="w-6 h-6 stroke-[2.5px]" />
              </button>
            </div>
          </div>

          {mobileNavItems.slice(2, 4).map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className="flex flex-col items-center justify-center w-[20%] h-full relative group touch-target"
              >
                <div className={cn(
                  "flex flex-col items-center transition-all duration-200",
                  isActive ? "text-teal-600 scale-105" : "text-gray-400 group-active:scale-95"
                )}>
                  <Icon className={cn("w-5 h-5 mb-1", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                  <span className={cn("text-[10px] tracking-wide", isActive ? "font-bold" : "font-medium")}>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Quick Actions Menu (Mobile) */}
      {isQuickActionsOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-30 transition-opacity duration-300" 
            onClick={() => setIsQuickActionsOpen(false)} 
          />
          <div className="md:hidden fixed bottom-[85px] left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 z-40 animate-in fade-in slide-in-from-bottom-6 duration-200 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            <div className="grid gap-1">
              <Link 
                href="/dashboard/quotations/new" 
                onClick={() => setIsQuickActionsOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Nova Proforma</div>
                  <div className="text-[11px] text-gray-500">Criar orçamento ou fatura proforma</div>
                </div>
              </Link>
              
              <Link 
                href="/dashboard/clients" 
                onClick={() => setIsQuickActionsOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Novo Cliente</div>
                  <div className="text-[11px] text-gray-500">Adicionar entidade à base de dados</div>
                </div>
              </Link>
              
              <Link 
                href="/dashboard/products" 
                onClick={() => setIsQuickActionsOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Novo Produto/Serviço</div>
                  <div className="text-[11px] text-gray-500">Registar item no catálogo</div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
      
      <PWAInstallPrompt />
      <OnboardingTour isOpen={showTour} onClose={() => setShowTour(false)} />
      <UpgradeModal />
      <ShareAppModal isOpen={isShareAppModalOpen} onClose={() => setIsShareAppModalOpen(false)} />
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

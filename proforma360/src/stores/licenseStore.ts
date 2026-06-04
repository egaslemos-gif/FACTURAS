import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dbClient } from '@/lib/db/client';

export interface License {
  user_id: string;
  email: string;
  company_name: string;
  plan: string;
  monthly_limit: number;
  used_this_month: number;
  unlimited: boolean;
  can_export_pdf: boolean;
  can_share: boolean;
  remove_branding: boolean;
  is_active: boolean;
  expires_at: string;
  notes: string;
  updated_at: string;
}

interface LicenseState {
  license: License | null;
  isAdmin: boolean;
  lastChecked: number | null; // timestamp
  isLimitReached: boolean;
  
  // Actions
  fetchLicense: (force?: boolean) => Promise<void>;
  incrementUsage: () => Promise<boolean>;
  showUpgradeModal: () => void;
  hideUpgradeModal: () => void;
  showModal: boolean;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache for checking
const OFFLINE_GRACE_PERIOD_MS = 6 * 60 * 60 * 1000; // 6 hours offline grace

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set, get) => ({
      license: null,
      isAdmin: false,
      lastChecked: null,
      isLimitReached: false,
      showModal: false,

      fetchLicense: async (force = false) => {
        const { lastChecked } = get();
        const now = Date.now();
        
        // Cache: Don't hit API if within TTL, unless forced
        if (!force && lastChecked && (now - lastChecked < CACHE_TTL_MS)) {
          return;
        }

        try {
          const res = await fetch('/api/licensing/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!res.ok) throw new Error('Failed to fetch license');
          
          const data = await res.json();
          let used_this_month = data.license?.used_this_month || 0;
          
          try {
            const localQuotes = await dbClient.query("SELECT created_at FROM quotations");
            const now = new Date();
            const localThisMonth = localQuotes.filter(q => {
               if (!q.created_at) return false;
               const date = new Date(q.created_at);
               return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length;
            used_this_month = Math.max(used_this_month, localThisMonth);
          } catch(e) {
            console.warn("Failed to check local usage", e);
          }

          if (data.license) {
            data.license.used_this_month = used_this_month;
            set({ 
              license: data.license, 
              isAdmin: data.isAdmin || false, 
              lastChecked: now,
              // Check if limit is reached during fetch
              isLimitReached: !data.license.unlimited && data.license.used_this_month >= data.license.monthly_limit
            });
          }
        } catch (error) {
          console.error('Offline or error checking license:', error);
          // Prevent UI from hanging forever if Google Script is failing or offline
          if (!get().license) {
            
            let localThisMonth = 0;
            try {
              const localQuotes = await dbClient.query("SELECT created_at FROM quotations");
              const now = new Date();
              localThisMonth = localQuotes.filter(q => {
                 if (!q.created_at) return false;
                 const date = new Date(q.created_at);
                 return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length;
            } catch(e) {}
            
            set({ 
              license: {
                user_id: 'local-fallback',
                email: 'local-fallback',
                company_name: '',
                plan: 'free',
                monthly_limit: 3,
                used_this_month: localThisMonth,
                unlimited: false,
                can_export_pdf: true,
                can_share: true,
                remove_branding: false,
                is_active: true
              } as any,
              isAdmin: false,
              lastChecked: now,
              isLimitReached: localThisMonth >= 3
            });
          }
        }
      },

      incrementUsage: async () => {
        const { license } = get();
        
        // Optimistic strict block if we already know they are over limit
        if (license && !license.unlimited && license.used_this_month >= license.monthly_limit) {
          set({ showModal: true, isLimitReached: true });
          return false;
        }

        try {
          const res = await fetch('/api/licensing/increment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          const data = await res.json();
          
          if (res.status === 403 || data.error === 'LIMIT_REACHED') {
            set({ showModal: true, isLimitReached: true });
            return false;
          }
          
          if (res.ok && data.license) {
            set({ 
              license: data.license, 
              lastChecked: Date.now(),
              isLimitReached: !data.license.unlimited && data.license.used_this_month >= data.license.monthly_limit
            });
            return true;
          }
          
          throw new Error('Unknown error during increment');
        } catch (error) {
          console.error('Failed to increment usage remotely', error);
          // If offline, we let it pass for UX, but log it locally if we want.
          // Because of the offline-first philosophy, if fetch fails (network error), we return true to allow offline PDF generation.
          // If it returns a 403 from the server, we return false.
          return true; 
        }
      },

      showUpgradeModal: () => set({ showModal: true }),
      hideUpgradeModal: () => set({ showModal: false })
    }),
    {
      name: 'proforma360-license-storage',
      partialize: (state) => ({ 
        license: state.license, 
        isAdmin: state.isAdmin, 
        lastChecked: state.lastChecked,
        isLimitReached: state.isLimitReached
      })
    }
  )
);

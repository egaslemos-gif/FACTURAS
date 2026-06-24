import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { namespaceStorage } from '@/lib/runtime/namespaceStorage';
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
          let localThisMonth = 0;
          try {
            const localQuotes = await dbClient.query("SELECT created_at FROM quotations");
            const d = new Date();
            localThisMonth = localQuotes.filter(q => {
               if (!q.created_at) return false;
               const date = new Date(q.created_at);
               return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
            }).length;
          } catch(e) {
            console.warn("Failed to check local usage", e);
          }

          // To maintain compatibility with old UI without rewriting every component,
          // we mock the License response using local data and the new Governance baseline.
          set({ 
            license: {
              user_id: 'local',
              email: 'local',
              company_name: '',
              plan: 'free',
              monthly_limit: 1,
              used_this_month: localThisMonth,
              unlimited: false,
              can_export_pdf: true,
              can_share: true,
              remove_branding: false,
              is_active: true
            } as any,
            isAdmin: false,
            lastChecked: now,
            isLimitReached: localThisMonth >= 1
          });
        } catch (error) {
          console.error('Offline or error checking license:', error);
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
          if (license) {
            const newUsage = license.used_this_month + 1;
            set({ 
              license: { ...license, used_this_month: newUsage }, 
              lastChecked: Date.now(),
              isLimitReached: !license.unlimited && newUsage >= license.monthly_limit
            });
          }
          return true;
        } catch (error) {
          console.error('Failed to increment usage locally', error);
          return true; 
        }
      },

      showUpgradeModal: () => set({ showModal: true }),
      hideUpgradeModal: () => set({ showModal: false })
    }),
    {
      name: 'proforma360-license-storage',
      storage: createJSONStorage(() => namespaceStorage),
      partialize: (state) => ({ 
        license: state.license, 
        isAdmin: state.isAdmin, 
        lastChecked: state.lastChecked,
        isLimitReached: state.isLimitReached
      })
    }
  )
);

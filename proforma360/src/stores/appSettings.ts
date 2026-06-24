import { create } from "zustand";
import { settingsRepo } from "../lib/db/repositories/settings";

interface AppSettingsState {
  businessProfile: string;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateBusinessProfile: (profile: string) => Promise<void>;
  reset: () => void;
}

export const useAppSettingsStore = create<AppSettingsState>((set) => ({
  businessProfile: "GENERAL",
  isLoading: true,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const profile = await settingsRepo.get("businessProfile");
      set({ businessProfile: profile || "GENERAL", isLoading: false });
    } catch (error) {
      console.error("Failed to fetch app settings", error);
      set({ isLoading: false });
    }
  },

  updateBusinessProfile: async (profile: string) => {
    set({ isLoading: true });
    try {
      await settingsRepo.set("businessProfile", profile);
      set({ businessProfile: profile, isLoading: false });
    } catch (error) {
      console.error("Failed to update business profile", error);
      set({ isLoading: false });
      throw error;
    }
  },

  reset: () => {
    set({ businessProfile: "GENERAL", isLoading: false });
  },
}));

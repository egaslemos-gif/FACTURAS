import { create } from "zustand";
import { Company } from "../lib/types";
import { companyRepo } from "../lib/db";

interface CompanyState {
  company: Company | null;
  isLoading: boolean;
  error: string | null;
  fetchCompany: () => Promise<void>;
  updateCompany: (data: Partial<Company>) => Promise<void>;
  reset: () => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  company: null,
  isLoading: false,
  error: null,

  fetchCompany: async () => {
    set({ isLoading: true, error: null });
    try {
      const company = await companyRepo.get();
      set({ company, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateCompany: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await companyRepo.upsert(data);
      set({ company: updated, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  reset: () => {
    set({ company: null, error: null, isLoading: false });
  },
}));

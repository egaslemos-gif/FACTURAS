import { create } from "zustand";
import { Quotation, QuotationItem, QuotationHistory, QuotationStatus } from "../lib/types";
import { quotationsRepo } from "../lib/db";

interface QuotationDetail {
  quotation: Quotation;
  items: QuotationItem[];
  history: QuotationHistory[];
}

interface QuotationsState {
  quotations: Quotation[];
  currentDetail: QuotationDetail | null;
  isLoading: boolean;
  error: string | null;
  fetchQuotations: () => Promise<void>;
  fetchQuotationDetail: (id: string) => Promise<void>;
  createQuotation: (
    data: Omit<Quotation, "id" | "created_at" | "updated_at" | "client_name">,
    items: Omit<QuotationItem, "id" | "quotation_id">[]
  ) => Promise<string>;
  updateQuotation: (
    id: string,
    data: Partial<Quotation>,
    items?: Omit<QuotationItem, "id" | "quotation_id">[]
  ) => Promise<void>;
  updateStatus: (id: string, status: string, details: string) => Promise<void>;
  setNextActionFull: (id: string, action: string | null, date: string | null, time: string | null, reminders: boolean) => Promise<void>;
  markAsSent: (id: string) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  
  // Commercial Proposals
  fetchCommercialProposal: (quotationId: string) => Promise<any>;
  saveCommercialProposal: (quotationId: string, title: string, content: string, status: string) => Promise<void>;
}

export const useQuotationsStore = create<QuotationsState>((set, get) => ({
  quotations: [],
  currentDetail: null,
  isLoading: false,
  error: null,

  fetchQuotations: async () => {
    set({ isLoading: true, error: null });
    try {
      const quotations = await quotationsRepo.getAll();
      const today = new Date().toISOString().split("T")[0];
      
      const updatedQuotations = await Promise.all(quotations.map(async (q) => {
        if ((q.status === 'sent' || q.status === 'draft') && q.expiry_date < today) {
          await quotationsRepo.updateStatus(q.id, 'expired', 'Expirada automaticamente pela data de validade');
          return { ...q, status: 'expired' as QuotationStatus };
        }
        return q;
      }));
      
      set({ quotations: updatedQuotations, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchQuotationDetail: async (id) => {
    set({ isLoading: true, error: null });
    try {
      let detail = await quotationsRepo.getById(id);
      const today = new Date().toISOString().split("T")[0];
      
      if (detail && (detail.quotation.status === 'sent' || detail.quotation.status === 'draft') && detail.quotation.expiry_date < today) {
        await quotationsRepo.updateStatus(detail.quotation.id, 'expired', 'Expirada automaticamente pela data de validade');
        detail.quotation.status = 'expired';
      }
      
      set({ currentDetail: detail, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createQuotation: async (data, items) => {
    set({ isLoading: true, error: null });
    try {
      const newId = await quotationsRepo.create(data, items);
      await get().fetchQuotations();
      return newId;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateQuotation: async (id, data, items) => {
    set({ isLoading: true, error: null });
    try {
      await quotationsRepo.update(id, data, items);
      await get().fetchQuotationDetail(id);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateStatus: async (id, status, details) => {
    set({ isLoading: true, error: null });
    try {
      await quotationsRepo.updateStatus(id, status, details);
      
      // Automations
      const currentQ = get().quotations.find(q => q.id === id);
      if (currentQ) {
        if (status === 'approved') {
          await quotationsRepo.updatePipelineStage(id, 'won');
        } else if (status === 'rejected' || status === 'expired') {
          await quotationsRepo.updatePipelineStage(id, 'lost');
        }
      }

      if (get().currentDetail?.quotation.id === id) {
        await get().fetchQuotationDetail(id);
      }
      await get().fetchQuotations();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  setNextActionFull: async (id, action, date, time, reminders) => {
    set({ isLoading: true, error: null });
    try {
      await quotationsRepo.setNextActionFull(id, action, date, time, reminders);
      
      if (get().currentDetail?.quotation.id === id) {
        await get().fetchQuotationDetail(id);
      }
      await get().fetchQuotations();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  markAsSent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await quotationsRepo.markAsSent(id);
      
      // Automations
      const currentQ = get().quotations.find(q => q.id === id);
      if (currentQ) {
        if (currentQ.pipeline_stage === 'lead' || currentQ.pipeline_stage === 'contacted') {
          await quotationsRepo.updatePipelineStage(id, 'proposal');
        }
      }

      if (get().currentDetail?.quotation.id === id) {
        await get().fetchQuotationDetail(id);
      }
      await get().fetchQuotations();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteQuotation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await quotationsRepo.delete(id);
      set({
        quotations: get().quotations.filter((q) => q.id !== id),
        currentDetail: null,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  fetchCommercialProposal: async (quotationId: string) => {
    try {
      const proposal = await quotationsRepo.getCommercialProposal(quotationId);
      return proposal;
    } catch (error: any) {
      console.error(error);
      return null;
    }
  },

  saveCommercialProposal: async (quotationId: string, title: string, content: string, status: string) => {
    try {
      set({ isLoading: true });
      await quotationsRepo.saveCommercialProposal(quotationId, title, content, status);
    } catch (error: any) {
      console.error(error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  }

}));

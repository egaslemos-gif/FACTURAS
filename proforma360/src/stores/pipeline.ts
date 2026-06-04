import { create } from "zustand";
import { Quotation, PipelineStage, PIPELINE_STAGES } from "../lib/types";
import { quotationsRepo } from "../lib/db";
import { useQuotationsStore } from "./quotations";

interface PipelineState {
  isLoading: boolean;
  error: string | null;

  moveDeal: (id: string, newStage: PipelineStage) => Promise<void>;
  setNextAction: (id: string, action: string | null, date: string | null) => Promise<void>;
  setPriority: (id: string, priority: "low" | "medium" | "high") => Promise<void>;

  // Helpers
  getDealsByStage: (quotations: Quotation[], stage: PipelineStage) => Quotation[];
  getPipelineMetrics: (quotations: Quotation[]) => {
    totalPipeline: number;
    inNegotiation: number;
    won: number;
    lost: number;
    conversionRate: number;
  };
}

export const usePipelineStore = create<PipelineState>((set) => ({
  isLoading: false,
  error: null,

  moveDeal: async (id, newStage) => {
    set({ isLoading: true, error: null });
    try {
      const quotations = useQuotationsStore.getState().quotations;
      const deal = quotations.find((q) => q.id === id);
      
      if (!deal) throw new Error("Quotation not found");

      // Validation Rules
      if (newStage === "won" && deal.status !== "approved") {
        throw new Error("Apenas proformas aprovadas podem ser movidas para Ganho (Won).");
      }
      if (newStage === "lost" && deal.status !== "rejected" && deal.status !== "expired") {
        throw new Error("Apenas proformas rejeitadas ou expiradas podem ser movidas para Perdido (Lost).");
      }

      await quotationsRepo.updatePipelineStage(id, newStage);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  setNextAction: async (id, action, date) => {
    set({ isLoading: true, error: null });
    try {
      await quotationsRepo.setNextAction(id, action, date);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  setPriority: async (id, priority) => {
    set({ isLoading: true, error: null });
    try {
      await quotationsRepo.setPriority(id, priority);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  getDealsByStage: (quotations, stage) => {
    return quotations.filter((q) => (q.pipeline_stage || "lead") === stage);
  },

  getPipelineMetrics: (quotations) => {
    const activePipeline = quotations.filter(
      (q) => q.pipeline_stage && !["won", "lost"].includes(q.pipeline_stage)
    );
    const won = quotations.filter((q) => q.pipeline_stage === "won");
    const lost = quotations.filter((q) => q.pipeline_stage === "lost");
    const negotiation = quotations.filter((q) => q.pipeline_stage === "negotiation");

    const totalPipeline = activePipeline.reduce((sum, q) => sum + (q.grand_total || 0), 0);
    const inNegotiation = negotiation.reduce((sum, q) => sum + (q.grand_total || 0), 0);
    const wonTotal = won.reduce((sum, q) => sum + (q.grand_total || 0), 0);
    const lostTotal = lost.reduce((sum, q) => sum + (q.grand_total || 0), 0);

    const totalClosed = won.length + lost.length;
    const conversionRate = totalClosed > 0 ? (won.length / totalClosed) * 100 : 0;

    return {
      totalPipeline,
      inNegotiation,
      won: wonTotal,
      lost: lostTotal,
      conversionRate,
    };
  },
}));

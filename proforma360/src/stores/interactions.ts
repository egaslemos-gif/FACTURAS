import { create } from "zustand";
import { ClientInteraction, InteractionType } from "../lib/types";
import { interactionsRepo } from "../lib/db";

interface InteractionsState {
  interactions: ClientInteraction[];
  recentActivities: (ClientInteraction & { client_name?: string })[];
  isLoading: boolean;
  error: string | null;

  fetchByClient: (clientId: string) => Promise<void>;
  fetchRecent: (limit?: number) => Promise<void>;
  addInteraction: (
    clientId: string,
    type: InteractionType,
    title: string,
    description: string | null
  ) => Promise<string>;
  deleteInteraction: (id: string, clientId: string) => Promise<void>;
}

export const useInteractionsStore = create<InteractionsState>((set, get) => ({
  interactions: [],
  recentActivities: [],
  isLoading: false,
  error: null,

  fetchByClient: async (clientId) => {
    set({ isLoading: true, error: null });
    try {
      const interactions = await interactionsRepo.getByClientId(clientId);
      set({ interactions, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchRecent: async (limit = 5) => {
    try {
      const recentActivities = await interactionsRepo.getRecent(limit);
      set({ recentActivities });
    } catch (error) {
      console.error("Failed to fetch recent activities:", error);
    }
  },

  addInteraction: async (clientId, type, title, description) => {
    set({ isLoading: true, error: null });
    try {
      const id = await interactionsRepo.create(clientId, type, title, description);
      // Refresh the list for this client
      await get().fetchByClient(clientId);
      return id;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteInteraction: async (id, clientId) => {
    set({ isLoading: true, error: null });
    try {
      await interactionsRepo.delete(id);
      await get().fetchByClient(clientId);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));

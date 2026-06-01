import { create } from "zustand";
import { Client } from "../lib/types";
import { clientsRepo } from "../lib/db";

interface ClientsState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  addClient: (data: Omit<Client, "id" | "created_at" | "updated_at">) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  isLoading: false,
  error: null,

  fetchClients: async () => {
    set({ isLoading: true, error: null });
    try {
      const clients = await clientsRepo.getAll();
      set({ clients, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addClient: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newClient = await clientsRepo.create(data);
      set({ clients: [...get().clients, newClient], isLoading: false });
      return newClient;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateClient: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await clientsRepo.update(id, data);
      await get().fetchClients();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteClient: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await clientsRepo.delete(id);
      set({
        clients: get().clients.filter((c) => c.id !== id),
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));

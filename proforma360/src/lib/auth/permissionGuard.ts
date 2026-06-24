import { create } from "zustand";
import { UserRole } from "./roles";
import { SubscriptionPlan, PLAN_DEFINITIONS, SaaSFeature } from "../subscriptions/planDefinitions";

export interface GovernanceState {
  role: UserRole;
  plan: SubscriptionPlan;
  
  // Actions to update state
  setGovernance: (role: UserRole, plan: SubscriptionPlan) => void;
}

/**
 * Global reactive store for Governance Context.
 * The Subscription Engine will update this store when a valid License is loaded.
 */
export const useGovernance = create<GovernanceState>((set) => ({
  role: "USER", // Default safe fallback
  plan: "FREE", // Default safe fallback

  setGovernance: (role, plan) => set({ role, plan }),
}));

/**
 * Synchronous Feature Guards using Capability Contracts
 */
export const assertCapability = (feature: SaaSFeature): boolean => {
  const { plan } = useGovernance.getState();
  const caps = PLAN_DEFINITIONS[plan];
  
  return caps.features.includes(feature);
};

export const getQuotaLimit = (quotaType: "maxProformas" | "maxClients"): number | "UNLIMITED" => {
  const { plan } = useGovernance.getState();
  const caps = PLAN_DEFINITIONS[plan];
  return caps.quotas[quotaType];
}

// Admin / System specific guards
export const canManageSubscriptions = (): boolean => {
  return useGovernance.getState().role === "ADMIN";
};

export const canApproveUpgrade = (): boolean => {
  return useGovernance.getState().role === "ADMIN";
};

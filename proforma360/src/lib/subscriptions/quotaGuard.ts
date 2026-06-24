import { getCurrentUsage } from "./usageMetering";
import { getQuotaLimit } from "../auth/permissionGuard";
import { runtimeEventLedger } from "../runtime/runtimeEventLedger";

export interface QuotaGuardResult {
  allowed: boolean;
  isSoftLimit: boolean;
  isHardLimit: boolean;
  message?: string;
  currentUsage: number;
  maxLimit: number | "UNLIMITED";
}

/**
 * Evaluates the quota policy for a given resource.
 * This is PURE governance logic, separated from UI.
 */
export function evaluateQuotaPolicy(type: "PROFORMA" | "CLIENT"): QuotaGuardResult {
  const currentUsage = getCurrentUsage(type);
  const maxLimit = type === "PROFORMA" ? getQuotaLimit("maxProformas") : getQuotaLimit("maxClients");

  if (maxLimit === "UNLIMITED") {
    return { allowed: true, isSoftLimit: false, isHardLimit: false, currentUsage, maxLimit };
  }

  const usageRatio = currentUsage / maxLimit;

  if (usageRatio >= 1) {
    // Audit Event for Hard Limit Hit
    runtimeEventLedger.recordEvent({
      type: "QUOTA_LIMIT_REACHED",
      limitType: "HARD",
      feature: type,
    }, { mode: "NORMAL" } as any, { mode: "NORMAL" } as any); // Mock state passing for ledger

    return {
      allowed: false,
      isSoftLimit: false,
      isHardLimit: true,
      currentUsage,
      maxLimit,
      message: `Atingiu o limite de ${maxLimit} ${type === "PROFORMA" ? "proformas" : "clientes"}. Por favor, faça upgrade do seu plano.`
    };
  }

  if (usageRatio >= 0.9) {
    // Audit Event for Soft Limit Hit
    runtimeEventLedger.recordEvent({
      type: "QUOTA_LIMIT_REACHED",
      limitType: "SOFT",
      feature: type,
    }, { mode: "NORMAL" } as any, { mode: "NORMAL" } as any);

    return {
      allowed: true,
      isSoftLimit: true,
      isHardLimit: false,
      currentUsage,
      maxLimit,
      message: `Atenção: Está quase a atingir o limite de ${maxLimit} ${type === "PROFORMA" ? "proformas" : "clientes"}.`
    };
  }

  return { allowed: true, isSoftLimit: false, isHardLimit: false, currentUsage, maxLimit };
}

/**
 * Throws a Runtime Error if the Quota is exceeded.
 * Should be called directly inside Database Hooks or Queue Handlers to enforce
 * strict policy rejection before any write happens.
 */
export function assertQuotaEnforcement(type: "PROFORMA" | "CLIENT"): void {
  const policy = evaluateQuotaPolicy(type);
  if (!policy.allowed) {
    throw new Error(`QUOTA_EXCEEDED:${type}`);
  }
}

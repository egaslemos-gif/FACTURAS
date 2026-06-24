/**
 * Event Contracts & Governance for Proforma360 Distributed Operational Consistency.
 * Defines standard types, schema versions, priority levels, and payload validations.
 */

export type QueuePriority = "HIGH" | "MEDIUM" | "LOW";

export interface EventContract<T = any> {
  eventType: string;
  version: number;
  priority: QueuePriority;
  retentionDays: number;
  validate: (payload: T) => boolean;
}

export const EVENT_CONTRACTS: Record<string, EventContract> = {
  PROPOSAL_CREATED: {
    eventType: "PROPOSAL_CREATED",
    version: 1,
    priority: "MEDIUM",
    retentionDays: 90,
    validate: (p: any) => !!p.quotationId && typeof p.quotationId === "string",
  },
  STAGE_CHANGED: {
    eventType: "STAGE_CHANGED",
    version: 1,
    priority: "MEDIUM",
    retentionDays: 90,
    validate: (p: any) =>
      !!p.quotationId &&
      typeof p.quotationId === "string" &&
      !!p.oldStage &&
      !!p.newStage,
  },
  CALENDAR_SYNC: {
    eventType: "CALENDAR_SYNC",
    version: 1,
    priority: "MEDIUM",
    retentionDays: 30,
    validate: (p: any) =>
      !!p.quotationId &&
      typeof p.quotationId === "string" &&
      !!p.actionTitle &&
      !!p.actionDate,
  },
  TELEMETRY_TRACK: {
    eventType: "TELEMETRY_TRACK",
    version: 1,
    priority: "LOW",
    retentionDays: 15,
    validate: (p: any) =>
      !!p.quotationId &&
      typeof p.quotationId === "string" &&
      (p.type === "view" || p.type === "download"),
  },
  LICENSE_UPDATE: {
    eventType: "LICENSE_UPDATE",
    version: 1,
    priority: "HIGH",
    retentionDays: 180,
    validate: (p: any) => !!p.licenseId && typeof p.status === "string",
  },
};

/**
 * Validates an event payload against the defined event contract.
 */
export function validateEventPayload(eventType: string, payload: any): boolean {
  const contract = EVENT_CONTRACTS[eventType];
  if (!contract) {
    console.warn(`[Event Contracts] Unknown event type: ${eventType}`);
    return false;
  }
  try {
    return contract.validate(payload);
  } catch (e) {
    console.error(`[Event Contracts] Error validating ${eventType}:`, e);
    return false;
  }
}

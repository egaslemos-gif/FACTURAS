export type UserRole = "ADMIN" | "USER";

export interface GovernanceProfile {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * For this phase, we hardcode Admin roles based on a known list of emails
 * or a specific domain. Later, this should be fetched from the DB/Control-Plane.
 */
export function resolveUserRole(email?: string | null): UserRole {
  if (!email) return "USER";
  
  // Example admin determination
  if (email.endsWith("@proforma360.com") || email === "admin@example.com") {
    return "ADMIN";
  }
  
  return "USER";
}

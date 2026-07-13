export interface ProposalCompany {
  name?: string;
  logoUrl?: string;
  logo_url?: string | null;
  address?: string;
  phone?: string;
  email?: string;
  tax_number?: string;
}

export interface ProposalClient {
  name?: string;
  email?: string;
  phone?: string;
  tax_number?: string;
}

export interface ProposalQuotation {
  number?: string;
  quotation_number?: string;
  grand_total?: number;
  tax_total?: number;
  subtotal?: number;
  expiry_date?: string;
}

export interface ProposalItem {
  description?: string;
  quantity?: number;
  unit_price?: number;
  tax_rate?: number;
  total?: number;
}

export interface ProposalSections {
  executiveSummary?: string;
  proposedSolution?: string;
  scope?: string;
  timeline?: string;
  conditions?: string;
}

export interface PrintableProposalProps {
  company: ProposalCompany | null;
  client: ProposalClient | null | undefined;
  quotation: ProposalQuotation | null;
  items: ProposalItem[];
  sections: ProposalSections;
  version?: string;
}

export type ProposalTemplate = "executivo" | "minimal" | "corporate";

export function safeNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

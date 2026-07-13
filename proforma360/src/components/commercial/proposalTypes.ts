export interface ProposalCompany {
  name?: string;
  logoUrl?: string;
  logo_url?: string | null;
  address?: string;
  phone?: string;
  email?: string;
  tax_number?: string;
  signature_url?: string | null;
  stamp_url?: string | null;
  footer_text?: string | null;
  business_profile?: string | null;
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

export interface CustomProposalSection {
  id: string;
  title: string;
  content: string;
  visible: boolean;
}

export interface SectionVisibility {
  executiveSummary: boolean;
  proposedSolution: boolean;
  scope: boolean;
  timeline: boolean;
  conditions: boolean;
  financialTable: boolean;
  signatures: boolean;
  toc: boolean;
}

export const DEFAULT_VISIBILITY: SectionVisibility = {
  executiveSummary: true,
  proposedSolution: true,
  scope: true,
  timeline: true,
  conditions: true,
  financialTable: true,
  signatures: true,
  toc: true,
};

export interface PrintableProposalProps {
  company: ProposalCompany | null;
  client: ProposalClient | null | undefined;
  quotation: ProposalQuotation | null;
  items: ProposalItem[];
  sections: ProposalSections;
  customSections?: CustomProposalSection[];
  visibility?: SectionVisibility;
  version?: string;
}

export type ProposalTemplate = "executivo" | "minimal" | "corporate";

export interface SavedProposalData {
  sections: ProposalSections;
  customSections?: CustomProposalSection[];
  visibility?: SectionVisibility;
  template?: ProposalTemplate;
}

export function normalizeCustomSections(
  raw?: CustomProposalSection[] | null
): CustomProposalSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s.id === "string")
    .map((s) => ({
      id: s.id,
      title: typeof s.title === "string" ? s.title : "Secção",
      content: typeof s.content === "string" ? s.content : "",
      visible: s.visible !== false,
    }));
}

export function resolveVisibility(vis?: Partial<SectionVisibility>): SectionVisibility {
  const merged = { ...DEFAULT_VISIBILITY, ...vis };
  const bool = (val: unknown, fallback: boolean) => {
    if (val === true || val === false) return val;
    if (val === "true") return true;
    if (val === "false") return false;
    return fallback;
  };
  return {
    executiveSummary: bool(merged.executiveSummary, DEFAULT_VISIBILITY.executiveSummary),
    proposedSolution: bool(merged.proposedSolution, DEFAULT_VISIBILITY.proposedSolution),
    scope: bool(merged.scope, DEFAULT_VISIBILITY.scope),
    timeline: bool(merged.timeline, DEFAULT_VISIBILITY.timeline),
    conditions: bool(merged.conditions, DEFAULT_VISIBILITY.conditions),
    financialTable: bool(merged.financialTable, DEFAULT_VISIBILITY.financialTable),
    signatures: bool(merged.signatures, DEFAULT_VISIBILITY.signatures),
    toc: bool(merged.toc, DEFAULT_VISIBILITY.toc),
  };
}

export function serializeVisibility(vis: SectionVisibility): SectionVisibility {
  return { ...vis };
}

export function parseSavedProposal(content: string): SavedProposalData {
  const parsed = JSON.parse(content);
  if (parsed && typeof parsed === "object" && parsed.sections) {
    return {
      sections: parsed.sections,
      customSections: normalizeCustomSections(parsed.customSections),
      visibility: resolveVisibility(parsed.visibility),
      template: parsed.template,
    };
  }
  return {
    sections: parsed as ProposalSections,
    visibility: DEFAULT_VISIBILITY,
  };
}

export function serializeProposal(data: SavedProposalData): string {
  return JSON.stringify(data);
}

export function safeNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

import type {
  CustomProposalSection,
  ProposalSections,
  SectionVisibility,
} from "./proposalTypes";
import { resolveVisibility, normalizeCustomSections } from "./proposalTypes";

export interface ProposalContentSection {
  key: string;
  title: string;
  content: string;
  custom?: boolean;
}

export const BUILTIN_SECTION_DEFS: Array<{
  key: keyof ProposalSections;
  visKey: keyof SectionVisibility;
  title: string;
}> = [
  { key: "executiveSummary", visKey: "executiveSummary", title: "Resumo Executivo" },
  { key: "proposedSolution", visKey: "proposedSolution", title: "Solução Proposta" },
  { key: "scope", visKey: "scope", title: "Escopo do Serviço" },
  { key: "timeline", visKey: "timeline", title: "Cronograma Estimado" },
];

export function createCustomSection(title = "Nova Secção"): CustomProposalSection {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    content: "",
    visible: true,
  };
}

export function buildProposalContentSections(
  sections: ProposalSections,
  customSections: CustomProposalSection[] | undefined,
  visibility?: SectionVisibility
): ProposalContentSection[] {
  const v = resolveVisibility(visibility);
  const result: ProposalContentSection[] = [];

  for (const def of BUILTIN_SECTION_DEFS) {
    const content = sections[def.key];
    if (v[def.visKey] && content?.trim()) {
      result.push({ key: def.key, title: def.title, content });
    }
  }

  for (const custom of normalizeCustomSections(customSections)) {
    if (custom.visible && custom.content.trim()) {
      result.push({
        key: custom.id,
        title: custom.title.trim() || "Secção Personalizada",
        content: custom.content,
        custom: true,
      });
    }
  }

  return result;
}

export function proposalHasContent(
  sections: ProposalSections,
  customSections?: CustomProposalSection[]
): boolean {
  const hasBuiltin = Object.values(sections).some(
    (v) => typeof v === "string" && v.trim().length > 0
  );
  const hasCustom = normalizeCustomSections(customSections).some((s) =>
    s.content.trim()
  );
  return hasBuiltin || hasCustom;
}

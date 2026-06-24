export type BusinessProfile =
  | "GENERAL"
  | "LOGISTICS"
  | "TRANSPORT"
  | "WAREHOUSE"
  | "CONSULTING"
  | "SERVICES"
  | "SAAS"
  | "CONSTRUCTION";

export type SchemaComplexityLevel = "BASIC" | "ADVANCED" | "ENTERPRISE";

export interface BusinessProfileConfig {
  id: BusinessProfile;
  label: string;
  description: string;
  defaultComplexity: SchemaComplexityLevel;
}

export const BUSINESS_PROFILES: Record<BusinessProfile, BusinessProfileConfig> = {
  GENERAL: {
    id: "GENERAL",
    label: "Geral",
    description: "Venda genérica de produtos e serviços básicos.",
    defaultComplexity: "BASIC",
  },
  LOGISTICS: {
    id: "LOGISTICS",
    label: "Logística & Transitário",
    description: "Operações de importação, exportação e despachos.",
    defaultComplexity: "ADVANCED",
  },
  TRANSPORT: {
    id: "TRANSPORT",
    label: "Transporte Terrestre",
    description: "Fretes rodoviários, gestão de frota e combustível.",
    defaultComplexity: "ADVANCED",
  },
  WAREHOUSE: {
    id: "WAREHOUSE",
    label: "Armazenagem",
    description: "Gestão de espaço, paletes e taxas diárias de ocupação.",
    defaultComplexity: "ADVANCED",
  },
  CONSULTING: {
    id: "CONSULTING",
    label: "Consultoria",
    description: "Serviços profissionais faturados por hora ou projeto.",
    defaultComplexity: "BASIC",
  },
  SERVICES: {
    id: "SERVICES",
    label: "Serviços Gerais",
    description: "Serviços técnicos, manutenção e reparações.",
    defaultComplexity: "BASIC",
  },
  SAAS: {
    id: "SAAS",
    label: "Software (SaaS)",
    description: "Licenciamento, subscrições e faturamento recorrente.",
    defaultComplexity: "ADVANCED",
  },
  CONSTRUCTION: {
    id: "CONSTRUCTION",
    label: "Construção Civil",
    description: "Obras, autos de medição e empreitadas complexas.",
    defaultComplexity: "ENTERPRISE",
  },
};

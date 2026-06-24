import { Briefcase, Box, Truck, Laptop, Wrench, FileText, ShoppingCart } from "lucide-react";
import { LucideIcon } from "lucide-react";

export type BusinessProfile = "GENERAL" | "CONSULTING" | "SAAS" | "LOGISTICS" | "WAREHOUSE" | "CONSTRUCTION" | "AGENCY";

export interface SemanticProfile {
  id: BusinessProfile;
  name: string;
  itemLabel: string;
  itemPluralLabel: string;
  navLabel: string;
  clientLabel: string;
  clientPluralLabel: string;
  quotationLabel: string;
  quotationPluralLabel: string;
  pipelineLabel: string;
  unitLabel: string;
  priceLabel: string;
  icon: LucideIcon;
  badgeColor: string;
  accentColor: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  placeholders: {
    itemName: string;
    itemDescription: string;
    itemSKU: string;
  };
}

export const SEMANTIC_PROFILES: Record<BusinessProfile, SemanticProfile> = {
  GENERAL: {
    id: "GENERAL",
    name: "Comércio Geral",
    itemLabel: "Artigo",
    itemPluralLabel: "Catálogo Comercial",
    navLabel: "Catálogo",
    clientLabel: "Cliente",
    clientPluralLabel: "Clientes",
    quotationLabel: "Proforma",
    quotationPluralLabel: "Proformas",
    pipelineLabel: "Pipeline de Vendas",
    unitLabel: "Unidade",
    priceLabel: "Preço Unitário",
    icon: Box,
    badgeColor: "bg-slate-100 text-slate-800",
    accentColor: "teal",
    emptyStateTitle: "Nenhum artigo no catálogo",
    emptyStateDescription: "Crie o seu primeiro artigo ou serviço para adicionar às proformas.",
    placeholders: {
      itemName: "Ex: Cadeira de Escritório",
      itemDescription: "Detalhes sobre o produto ou serviço...",
      itemSKU: "REF-001"
    }
  },
  CONSULTING: {
    id: "CONSULTING",
    name: "Consultoria & Serviços",
    itemLabel: "Serviço",
    itemPluralLabel: "Catálogo de Serviços",
    navLabel: "Serviços",
    clientLabel: "Cliente",
    clientPluralLabel: "Clientes",
    quotationLabel: "Proposta de Honorários",
    quotationPluralLabel: "Propostas de Honorários",
    pipelineLabel: "Pipeline de Consultoria",
    unitLabel: "Horas / Dia",
    priceLabel: "Taxa",
    icon: Briefcase,
    badgeColor: "bg-indigo-100 text-indigo-800",
    accentColor: "indigo",
    emptyStateTitle: "Nenhum serviço registado",
    emptyStateDescription: "Crie o seu primeiro serviço de consultoria para as suas propostas.",
    placeholders: {
      itemName: "Ex: Consultoria Estratégica",
      itemDescription: "Descrição do serviço e entregáveis...",
      itemSKU: "SRV-CONS-01"
    }
  },
  SAAS: {
    id: "SAAS",
    name: "Software & SaaS",
    itemLabel: "Subscrição / Licença",
    itemPluralLabel: "Planos & Licenças",
    navLabel: "Planos",
    clientLabel: "Subscritor",
    clientPluralLabel: "Subscritores",
    quotationLabel: "Proposta Comercial",
    quotationPluralLabel: "Propostas Comerciais",
    pipelineLabel: "Pipeline de Receita",
    unitLabel: "Mês / Ano",
    priceLabel: "Valor da Subscrição",
    icon: Laptop,
    badgeColor: "bg-blue-100 text-blue-800",
    accentColor: "blue",
    emptyStateTitle: "Nenhum plano configurado",
    emptyStateDescription: "Crie os seus planos de subscrição ou módulos de software.",
    placeholders: {
      itemName: "Ex: Plano Enterprise Anual",
      itemDescription: "Inclui suporte 24/7 e utilizadores ilimitados...",
      itemSKU: "PLAN-ENT-YR"
    }
  },
  LOGISTICS: {
    id: "LOGISTICS",
    name: "Logística & Transportes",
    itemLabel: "Serviço de Transporte",
    itemPluralLabel: "Serviços Logísticos",
    navLabel: "Serviços",
    clientLabel: "Carregador / Destinatário",
    clientPluralLabel: "Carregadores",
    quotationLabel: "Cotação de Frete",
    quotationPluralLabel: "Cotações de Frete",
    pipelineLabel: "Pipeline Logístico",
    unitLabel: "Km / Viagem",
    priceLabel: "Custo por Rota",
    icon: Truck,
    badgeColor: "bg-amber-100 text-amber-800",
    accentColor: "amber",
    emptyStateTitle: "Nenhum serviço logístico",
    emptyStateDescription: "Registe as suas rotas, fretes ou serviços de transporte.",
    placeholders: {
      itemName: "Ex: Frete Nacional (Carga Completa)",
      itemDescription: "Detalhes da rota, seguro de carga e condições...",
      itemSKU: "FRT-NAC-CC"
    }
  },
  WAREHOUSE: {
    id: "WAREHOUSE",
    name: "Armazém & Distribuição",
    itemLabel: "Produto",
    itemPluralLabel: "Inventário Comercial",
    navLabel: "Inventário",
    clientLabel: "Comprador",
    clientPluralLabel: "Compradores",
    quotationLabel: "Cotação",
    quotationPluralLabel: "Cotações",
    pipelineLabel: "Pipeline de Vendas",
    unitLabel: "Palete / Caixa",
    priceLabel: "Preço de Revenda",
    icon: ShoppingCart,
    badgeColor: "bg-emerald-100 text-emerald-800",
    accentColor: "emerald",
    emptyStateTitle: "Catálogo de produtos vazio",
    emptyStateDescription: "Adicione o primeiro produto ao seu inventário.",
    placeholders: {
      itemName: "Ex: Palete de Papel A4",
      itemDescription: "Especificações, dimensões e dados do lote...",
      itemSKU: "WH-PAP-A4"
    }
  },
  CONSTRUCTION: {
    id: "CONSTRUCTION",
    name: "Construção Civil",
    itemLabel: "Material / Empreitada",
    itemPluralLabel: "Catálogo de Empreitadas",
    navLabel: "Materiais",
    clientLabel: "Dono de Obra",
    clientPluralLabel: "Donos de Obra",
    quotationLabel: "Orçamento de Obra",
    quotationPluralLabel: "Orçamentos",
    pipelineLabel: "Pipeline de Obras",
    unitLabel: "M2 / Hora / Global",
    priceLabel: "Custo Unitário",
    icon: Wrench,
    badgeColor: "bg-orange-100 text-orange-800",
    accentColor: "orange",
    emptyStateTitle: "Nenhum material registado",
    emptyStateDescription: "Registe materiais, equipamentos ou horas de empreitada.",
    placeholders: {
      itemName: "Ex: Aplicação de Piso Flutuante",
      itemDescription: "Inclui materiais e mão de obra...",
      itemSKU: "OBRA-PISO-01"
    }
  },
  AGENCY: {
    id: "AGENCY",
    name: "Agência Criativa / Marketing",
    itemLabel: "Projeto / Avença",
    itemPluralLabel: "Serviços Criativos",
    navLabel: "Serviços",
    clientLabel: "Cliente",
    clientPluralLabel: "Clientes",
    quotationLabel: "Proposta Criativa",
    quotationPluralLabel: "Propostas Criativas",
    pipelineLabel: "Pipeline Criativo",
    unitLabel: "Projeto / Mês",
    priceLabel: "Fee / Honorários",
    icon: FileText,
    badgeColor: "bg-pink-100 text-pink-800",
    accentColor: "pink",
    emptyStateTitle: "Nenhum serviço criativo",
    emptyStateDescription: "Crie serviços de design, marketing ou avenças mensais.",
    placeholders: {
      itemName: "Ex: Gestão de Redes Sociais",
      itemDescription: "Gestão mensal, 3 posts semanais, relatórios...",
      itemSKU: "MKT-SOCIAL-M"
    }
  }
};

/**
 * Returns the semantic profile based on the company's business profile.
 * Defaults to "GENERAL" if none is provided or found.
 */
export function getSemanticProfile(profileId?: string | null): SemanticProfile {
  if (!profileId) return SEMANTIC_PROFILES.GENERAL;
  const profile = SEMANTIC_PROFILES[profileId as BusinessProfile];
  return profile || SEMANTIC_PROFILES.GENERAL;
}

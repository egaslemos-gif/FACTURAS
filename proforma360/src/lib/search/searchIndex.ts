import { Quotation, Client, Product, PipelineStage } from "@/lib/types";

export type SearchItemType = "quotation" | "client" | "product" | "action";

export interface SearchItem {
  id: string;
  type: SearchItemType;
  title: string;
  subtitle?: string;
  amount?: number;
  status?: string;
  route?: string;
  action?: () => void;
  // Metadata for intelligent ranking & filtering
  dateMs: number;
  isActivePipeline: boolean;
  searchTokens: string[];
}

export function buildSearchIndex(
  quotations: Quotation[],
  clients: Client[],
  products: Product[],
  onAction?: (actionId: string) => void
): SearchItem[] {
  const items: SearchItem[] = [];

  // 1. Index Quotations
  quotations.forEach((q) => {
    const isActive = q.pipeline_stage && !["won", "lost"].includes(q.pipeline_stage);
    
    items.push({
      id: `quotation-${q.id}`,
      type: "quotation",
      title: q.client_name || "Sem Nome",
      subtitle: q.quotation_number,
      amount: q.grand_total,
      status: q.pipeline_stage,
      route: `/dashboard/quotations/${q.id}`,
      dateMs: new Date(q.updated_at || q.created_at).getTime(),
      isActivePipeline: !!isActive,
      searchTokens: [
        q.quotation_number, 
        q.client_name || "", 
        `status:${q.status}`, 
        `pipeline:${q.pipeline_stage}`
      ]
    });
  });

  // 2. Index Clients
  clients.forEach((c) => {
    items.push({
      id: `client-${c.id}`,
      type: "client",
      title: c.name,
      subtitle: c.tax_number || c.email,
      route: `/dashboard/clients/${c.id}`,
      dateMs: new Date(c.updated_at || c.created_at).getTime(),
      isActivePipeline: false,
      searchTokens: [c.name, c.tax_number, c.email]
    });
  });

  // 3. Index Products
  products.forEach((p) => {
    items.push({
      id: `product-${p.id}`,
      type: "product",
      title: p.name,
      subtitle: p.code,
      amount: p.price,
      route: `/dashboard/products`, // Maybe open a product modal in the future
      dateMs: new Date(p.updated_at || p.created_at).getTime(),
      isActivePipeline: false,
      searchTokens: [p.name, p.code, p.category]
    });
  });

  // 4. Quick Actions
  const actions = [
    { id: "action-new-quotation", title: "Nova Proforma", subtitle: "Criar novo orçamento" },
    { id: "action-new-client", title: "Novo Cliente", subtitle: "Adicionar entidade à base de dados" },
    { id: "action-new-product", title: "Novo Produto/Serviço", subtitle: "Registar item no catálogo" },
    { id: "action-pipeline", title: "Abrir Pipeline", subtitle: "Ver todas as negociações" },
    { id: "action-settings", title: "Definições", subtitle: "Configurar empresa e licença" }
  ];

  actions.forEach((a) => {
    items.push({
      id: a.id,
      type: "action",
      title: a.title,
      subtitle: a.subtitle,
      action: () => onAction?.(a.id),
      dateMs: Date.now(), // Always "recent" so it floats to the top if needed
      isActivePipeline: false,
      searchTokens: ["action", "nova", "novo", "criar"]
    });
  });

  return items;
}

export function rankRecentItems(items: SearchItem[]): SearchItem[] {
  // Sort by active pipeline items first, then by recency
  return [...items].sort((a, b) => {
    // Actions are usually not considered "recent items" unless explicitly matched, 
    // but we can filter them out or keep them at the top.
    // Let's return recent items (Quotations, Clients) prioritized by recency.
    if (a.isActivePipeline && !b.isActivePipeline) return -1;
    if (!a.isActivePipeline && b.isActivePipeline) return 1;
    return b.dateMs - a.dateMs;
  });
}

import { Company, Client, Quotation, QuotationItem } from "@/lib/types";
import { DocumentContext } from "./documentTypes";

export class DocumentContextResolver {
  /**
   * Resolves the full context for a commercial document on the client side.
   * This takes data already present in Zustand stores and shapes it into the standard DocumentContext.
   */
  static resolve(params: {
    company: Company | null;
    client: Client | null;
    quotation: Quotation | null;
    items: QuotationItem[];
    aiInstructions: string;
    objective: string;
    audience: string;
    tone: string;
  }): DocumentContext {
    
    // MVP Fallbacks
    const safeCompany = params.company || {} as Company;
    const safeClient = params.client || {} as Client;
    const safeQuotation = params.quotation || {} as Quotation;

    return {
      company: {
        name: safeCompany.name || "Nossa Empresa",
        businessProfile: safeCompany.business_profile || "Geral",
      },
      client: {
        name: safeClient.name || "Cliente",
        industry: safeClient.tags?.join(", ") || "",
      },
      contacts: [],
      quotation: {
        id: safeQuotation.id,
        number: safeQuotation.quotation_number,
        date: safeQuotation.date,
        subtotal: safeQuotation.subtotal,
        vat_total: safeQuotation.vat_total,
        grand_total: safeQuotation.grand_total,
        notes: safeQuotation.notes || "",
        terms: safeQuotation.terms || ""
      },
      items: params.items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        total: i.total
      })),
      businessProfile: safeCompany.business_profile || "DEFAULT",
      pipeline: null,
      negotiationStage: null,
      previousProposals: [],
      capabilities: [],
      language: "pt-PT",
      branding: {},
      currency: "MTn",
      taxes: [],
      paymentTerms: safeQuotation.terms || "Pronto Pagamento",
      validity: safeQuotation.expiry_date || "30 Dias",
      attachments: [],
      customNotes: `Objetivo: ${params.objective}\nPúblico-alvo: ${params.audience}\nTom: ${params.tone}\nInstruções extras: ${params.aiInstructions}`,
      aiInstructions: params.aiInstructions || "",
    };
  }
}

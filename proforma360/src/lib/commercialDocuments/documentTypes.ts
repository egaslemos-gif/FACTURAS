export enum CommercialDocumentType {
  TECHNICAL_PROPOSAL = "TECHNICAL_PROPOSAL",
  COMMERCIAL_PROPOSAL = "COMMERCIAL_PROPOSAL",
  SERVICE_PROPOSAL = "SERVICE_PROPOSAL",
  EXECUTIVE_PROPOSAL = "EXECUTIVE_PROPOSAL",
  PROJECT_PROPOSAL = "PROJECT_PROPOSAL",
  CONSULTING_PROPOSAL = "CONSULTING_PROPOSAL",
  IMPLEMENTATION_PLAN = "IMPLEMENTATION_PLAN",
  STATEMENT_OF_WORK = "STATEMENT_OF_WORK",
  SLA = "SLA",
  MAINTENANCE_PLAN = "MAINTENANCE_PLAN",
  TRAINING_PLAN = "TRAINING_PLAN",
  CONTRACT = "CONTRACT",
  PURCHASE_PROPOSAL = "PURCHASE_PROPOSAL",
  BID_DOCUMENT = "BID_DOCUMENT",
  LETTER = "LETTER",
  FOLLOW_UP = "FOLLOW_UP",
  EMAIL = "EMAIL",
  PROJECT_CHARTER = "PROJECT_CHARTER",
  TECHNICAL_REPORT = "TECHNICAL_REPORT",
  BUSINESS_CASE = "BUSINESS_CASE",
}

export type VersionStatus = "Draft" | "AIGenerated" | "HumanEdited" | "Approved" | "Published";

export interface DocumentContext {
  company: Record<string, any>;
  client: Record<string, any>;
  contacts: any[];
  quotation: Record<string, any> | null;
  items: any[];
  businessProfile: string;
  pipeline: Record<string, any> | null;
  negotiationStage: string | null;
  previousProposals: any[];
  capabilities: string[];
  language: string;
  branding: Record<string, any>;
  currency: string;
  taxes: any[];
  paymentTerms: string;
  validity: string;
  attachments: any[];
  customNotes: string;
  aiInstructions: string;
}

export interface DocumentBlock {
  id: string;
  type: "Paragraph" | "Table" | "Callout" | "Image" | "BulletList" | string;
  content: string | any;
  order: number;
}

export interface DocumentSection {
  id: string;
  key: string;
  title: string;
  blocks: DocumentBlock[];
  generatedByAi: boolean;
  promptVersion?: string;
  model?: string;
  edited: boolean;
  order: number;
}

export interface DocumentTree {
  id: string;
  type: CommercialDocumentType;
  title: string;
  sections: DocumentSection[];
}

export interface AIProvider {
  generateSection(context: DocumentContext, sectionDef: any, prompt: string): Promise<string>;
  generateDocument(context: DocumentContext, prompt: string): Promise<string>;
  estimateTokens(prompt: string): Promise<number>;
}

export interface PromptComponents {
  identity: string;
  businessRules: string;
  writingStyle: string;
  context: string;
  section: string;
  instructions: string;
  outputSchema: string;
}

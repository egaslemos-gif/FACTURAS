/* ========================================
   PROFORMA360 TYPE DEFINITIONS
   ======================================== */

// --- Company ---
export interface Company {
  id: string;
  name: string;
  tax_number: string;
  address: string;
  email: string;
  phone: string;
  logo_url: string | null;
  signature_url: string | null;
  stamp_url: string | null;
  footer_text: string | null;
  quotation_prefix: string;
  pdf_template: "minimal" | "modern" | "corporate";
  bank_name?: string | null;
  account_holder?: string | null;
  account_number?: string | null;
  nib_iban?: string | null;
  mpesa?: string | null;
  emola?: string | null;
  show_branding: boolean;
  business_profile?: "SAAS" | "CONSULTING" | "LOGISTICS" | "DEFAULT";
  created_at: string;
  updated_at: string;
}

// --- Client ---
export interface Client {
  id: string;
  name: string;
  tax_number: string;
  email: string;
  phone: string;
  address: string;
  notes: string | null;
  origin?: string | null;
  tags?: string[] | null;
  status: "active" | "idle" | "new";
  created_at: string;
  updated_at: string;
}

// --- Product ---
export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  price: number;
  vat: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

// --- Quotation ---
export type QuotationStatus = "draft" | "sent" | "approved" | "rejected" | "expired";

export interface Quotation {
  id: string;
  quotation_number: string;
  client_id: string;
  client_name?: string;
  document_context: string;
  schema_version: string;
  semantic_schema_signature?: string | null;
  execution_plan_signature?: string | null;
  totals_ast_signature?: string | null;
  dynamic_fields?: Record<string, any>;
  date: string;
  expiry_date: string;
  status: QuotationStatus;
  pipeline_stage: PipelineStage;
  priority?: "low" | "medium" | "high" | "urgent";
  next_action: string | null;
  next_action_date: string | null;
  next_action_time: string | null;
  last_activity_at: string | null;
  last_contact_at: string | null;
  reminders_enabled: boolean;
  assigned_user?: string | null;
  followup_status?: "pending" | "scheduled" | "completed" | "overdue" | null;
  reminder_offset?: "5m" | "15m" | "30m" | "1h" | "1d" | null;
  completed_at?: string | null;
  calendar_sync_enabled?: boolean;
  external_calendar_provider?: "google" | "outlook" | null;
  calendar_sync_status?: "synced" | "pending" | "failed" | null;
  calendar_sync_date?: string | null;
  external_calendar_event_id?: string | null;
  calendar_sync_error?: string | null;
  subtotal: number;
  discount: number;
  discount_type: "percentage" | "fixed";
  vat_total: number;
  grand_total: number;
  notes: string;
  terms: string;
  pdf_url: string | null;
  pdf_drive_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Quotation Item ---
export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total: number;
  sort_order: number;
  dynamic_fields?: Record<string, any>;
}

// --- Quotation History ---
export interface QuotationHistory {
  id: string;
  quotation_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  details: string | null;
  created_at: string;
}

// --- Pipeline Stage (independent from quotation_status) ---
export type PipelineStage = "lead" | "contacted" | "proposal" | "negotiation" | "won" | "lost";

export const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: "lead", label: "Lead", color: "#6366f1" },
  { key: "contacted", label: "Contactado", color: "#0ea5e9" },
  { key: "proposal", label: "Proposta", color: "#f59e0b" },
  { key: "negotiation", label: "Negociação", color: "#8b5cf6" },
  { key: "won", label: "Ganho", color: "#22c55e" },
  { key: "lost", label: "Perdido", color: "#ef4444" },
];

// --- Client Interaction (CRM) ---
export type InteractionType = "note" | "call" | "meeting" | "email" | "whatsapp";

export const INTERACTION_TYPES: { key: InteractionType; label: string; icon: string; color: string }[] = [
  { key: "note", label: "Nota", icon: "📝", color: "#6b7280" },
  { key: "call", label: "Chamada", icon: "📞", color: "#3b82f6" },
  { key: "meeting", label: "Reunião", icon: "🤝", color: "#8b5cf6" },
  { key: "email", label: "Email", icon: "📧", color: "#f59e0b" },
  { key: "whatsapp", label: "WhatsApp", icon: "💬", color: "#25d366" },
];

export interface ClientInteraction {
  id: string;
  client_id: string;
  type: InteractionType;
  title: string;
  description: string | null;
  created_at: string;
}

// --- Backup ---
export interface BackupInfo {
  id: string;
  drive_file_id: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

// --- Settings ---
export interface AppSettings {
  company_id: string | null;
  drive_folder_id: string | null;
  pdfs_folder_id: string | null;
  backups_folder_id: string | null;
  last_backup_at: string | null;
  last_backup_drive_id: string | null;
  pdf_template: "minimal" | "modern" | "corporate";
  quotation_prefix: string;
  auto_backup: boolean;
  setup_completed: boolean;
}

// --- Navigation ---
export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

// --- PDF Template ---
export type PDFTemplate = "minimal" | "modern" | "corporate";

// --- Form State ---
export interface FormState {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}

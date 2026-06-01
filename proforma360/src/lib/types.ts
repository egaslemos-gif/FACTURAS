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
export type QuotationStatus = "draft" | "sent" | "approved" | "rejected";

export interface Quotation {
  id: string;
  quotation_number: string;
  client_id: string;
  client_name?: string;
  date: string;
  expiry_date: string;
  status: QuotationStatus;
  subtotal: number;
  discount: number;
  discount_type: "percentage" | "fixed";
  vat_total: number;
  grand_total: number;
  notes: string;
  terms: string;
  pdf_url: string | null;
  pdf_drive_id: string | null;
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
  pdf_template: "classic" | "modern" | "corporate";
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
export type PDFTemplate = "classic" | "modern" | "corporate";

// --- Form State ---
export interface FormState {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}

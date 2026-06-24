export type DocumentSectionType =
  | "HEADER"
  | "CLIENT_BLOCK"
  | "OPERATIONAL_METADATA"
  | "ITEM_TABLE"
  | "TOTALS"
  | "TERMS_AND_NOTES"
  | "SIGNATURES";

export interface DocumentSection {
  /** The type of section to render */
  type: DocumentSectionType;
  
  /** Sort order for rendering (Top to Bottom) */
  order: number;
  
  /** 
   * Specific configurations for this block.
   * e.g., if ITEM_TABLE, which columns to display?
   */
  config?: Record<string, any>;
}

/**
 * Resolves the final list of sections based on the active schema.
 * Allows the Runtime Semantic engine to reorder, add, or hide blocks.
 */
export function resolveDocumentSections(sections: DocumentSection[]): DocumentSection[] {
  // Sort by order ascending
  return [...sections].sort((a, b) => a.order - b.order);
}

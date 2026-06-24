import { DocumentSchemaDefinition } from "./documentSchemaRegistry";

export interface SearchProjection {
  documentId: string;
  /** Concatenated string of searchable dynamic field values to avoid SQLite JSON queries */
  searchVector: string;
  /** Pre-calculated key-value tags for dashboard grouping (e.g. ['zone:A1', 'milestone:Phase2']) */
  semanticTags: string[];
}

/**
 * Ensures SQLite doesn't become an ad-hoc search engine.
 * Projects JSON payloads into flat, fast, indexed search vectors.
 */
export class DocumentSearchProjection {
  static generateProjection(
    schema: DocumentSchemaDefinition, 
    documentId: string, 
    dynamicFields: Record<string, any>
  ): SearchProjection {
    
    const searchTerms: string[] = [];
    const tags: string[] = [];

    // Only project fields explicitly marked as text or select in the schema
    for (const field of [...schema.headerFields, ...schema.itemFields]) {
      const val = dynamicFields[field.key];
      if (val !== undefined && val !== null) {
        if (field.type === "TEXT") {
          searchTerms.push(String(val).toLowerCase());
        } else if (field.type === "SELECT") {
          tags.push(`${field.key}:${val}`);
          searchTerms.push(String(val).toLowerCase());
        }
      }
    }

    return {
      documentId,
      searchVector: searchTerms.join(" | "),
      semanticTags: tags
    };
  }
}

import { BusinessProfile, SchemaComplexityLevel } from "./businessProfiles";
import { DynamicFieldDefinition } from "./documentFieldDefinitions";
import { ASTNode } from "./documentTotals"; // Will create this next
import { DocumentSection } from "./documentSectionResolver"; // Will create this

export interface TotalComponentDefinition {
  id: string;
  label: string;
  /** AST Formula representing the calculation */
  formula: ASTNode;
}

export interface DocumentSchemaDefinition {
  /** The business context this schema belongs to (e.g., WAREHOUSE) */
  context: BusinessProfile;
  
  /** Schema Version (e.g., 'v1') */
  version: string;
  
  /** Strict complexity level negotiated with SaaS Subscription */
  complexity: SchemaComplexityLevel;
  
  /** Fields expected at the Document (Header) level */
  headerFields: DynamicFieldDefinition[];
  
  /** Fields expected at the Item level */
  itemFields: DynamicFieldDefinition[];
  
  /** The ordered sections to render for this document */
  sections: DocumentSection[];
  
  /** Declarative engine for calculating document totals */
  totals: TotalComponentDefinition[];
  
  /** 
   * A cryptographic signature or checksum to ensure the schema has not 
   * been tampered with or corrupted locally. 
   */
  schemaChecksum: string;
}

/**
 * The Central Registry for all Document Schemas.
 */
class SchemaRegistry {
  private schemas: Map<string, DocumentSchemaDefinition> = new Map();

  /**
   * Registers a schema. In a real environment, this might validate 
   * the schemaSignature to ensure Immutability Policy before accepting.
   */
  register(schema: DocumentSchemaDefinition) {
    const key = `${schema.context}_${schema.version}`;
    if (this.schemas.has(key)) {
      throw new Error(`Schema Registry Error: Schema ${key} is already registered. Immutability violation.`);
    }
    this.schemas.set(key, schema);
  }

  get(context: BusinessProfile, version: string = "v1"): DocumentSchemaDefinition {
    const key = `${context}_${version}`;
    const schema = this.schemas.get(key);
    if (!schema) {
      throw new Error(`Schema Registry Error: Schema ${key} not found.`);
    }
    return schema;
  }
}

export const documentSchemaRegistry = new SchemaRegistry();

import { GENERAL_SCHEMA_V1, LOGISTICS_SCHEMA_V1 } from "./defaultSchemas";

// Pre-register defaults
documentSchemaRegistry.register(GENERAL_SCHEMA_V1);
documentSchemaRegistry.register(LOGISTICS_SCHEMA_V1);


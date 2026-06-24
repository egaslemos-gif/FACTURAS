import { Quotation } from "../types";
import { documentSchemaRegistry } from "./documentSchemaRegistry";

export class DocumentSignature {
  static async generateSignatures(quotation: Quotation): Promise<{
    semantic_schema_signature: string;
    execution_plan_signature: string;
    totals_ast_signature: string;
  }> {
    // In a real implementation, this would use SubtleCrypto to generate SHA-256 hashes
    // For this prototype, we'll use a fast deterministic string hashing function
    
    // Fallback to GENERAL if document_context is missing or invalid
    const context = (quotation.document_context as any) || "GENERAL";
    let schema;
    try {
      schema = documentSchemaRegistry.get(context);
    } catch {
      schema = documentSchemaRegistry.get("GENERAL" as any);
    }

    const schemaString = JSON.stringify(schema);
    const semanticSig = this.hashString("schema_v1_" + schemaString);

    const execPlanString = JSON.stringify({
      version: quotation.schema_version,
      fields: quotation.dynamic_fields,
      items: (quotation as any).items?.length || 0
    });
    const execSig = this.hashString("exec_v1_" + execPlanString);

    const astString = JSON.stringify(schema.totals || []);
    const astSig = this.hashString("ast_v1_" + astString);

    return {
      semantic_schema_signature: semanticSig,
      execution_plan_signature: execSig,
      totals_ast_signature: astSig
    };
  }

  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Return positive hex string
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

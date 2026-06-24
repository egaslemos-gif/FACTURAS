import { Quotation } from "../types";
import { DocumentSignature } from "../documents/documentSignature";

/**
 * Runtime Consistency Checkpoint
 * 
 * Enforces execution safety by verifying that the document semantics
 * in memory exactly match what is about to be saved or synchronized.
 */
export class RuntimeConsistencyCheckpoint {
  /**
   * Validates that the signatures on the quotation match the mathematically calculated
   * signatures of the current schema, execution plan, and AST.
   * If there is a divergence, the runtime has been corrupted or the schema has drifted.
   */
  static async validateBeforeSave(quotation: Quotation): Promise<void> {
    const calculated = await DocumentSignature.generateSignatures(quotation);
    
    const isSemanticMatch = quotation.semantic_schema_signature === calculated.semantic_schema_signature;
    const isExecutionMatch = quotation.execution_plan_signature === calculated.execution_plan_signature;
    const isAstMatch = quotation.totals_ast_signature === calculated.totals_ast_signature;

    if (!isSemanticMatch || !isExecutionMatch || !isAstMatch) {
      console.error("[RuntimeConsistency] Signature Divergence Detected:", {
        stored: {
          semantic: quotation.semantic_schema_signature,
          execution: quotation.execution_plan_signature,
          ast: quotation.totals_ast_signature
        },
        calculated
      });

      // We emit an event so the UI can force a reload or block the user
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("RUNTIME_CONSISTENCY_FAILURE", {
          detail: { message: "Critical schema divergence detected. Document cannot be saved safely." }
        }));
      }

      throw new Error("RUNTIME_CONSISTENCY_FAILURE: Document signatures do not match memory. Save blocked to prevent corruption.");
    }
  }
}

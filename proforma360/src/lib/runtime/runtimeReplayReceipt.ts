import { dbClient } from "../db/client";
import { generateId } from "../utils";

export type ReplayDeterminismResult = "MATCHED" | "SEMANTICALLY_EQUIVALENT" | "DIVERGED" | "INVALID";

export class RuntimeReplayReceipt {
  /**
   * Logs an execution receipt. This proves exactly how a calculation was originally generated.
   */
  public static async logExecutionReceipt(
    quotationId: string,
    signatures: {
      semantic_schema_signature: string;
      execution_plan_signature: string;
      totals_ast_signature: string;
    }
  ): Promise<void> {
    const id = generateId();
    const timestamp = new Date().toISOString();
    
    await dbClient.executeWrite(`
      INSERT INTO document_execution_receipts 
      (id, quotation_id, semantic_schema_signature, execution_plan_signature, totals_ast_signature, runtime_kernel_version, timestamp) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id, quotationId, 
      signatures.semantic_schema_signature, 
      signatures.execution_plan_signature, 
      signatures.totals_ast_signature, 
      "v1.0.0", 
      timestamp
    ]);
  }

  /**
   * Logs a replay receipt. This proves how the runtime reproduced a calculation later on
   * (e.g. after a reconnect, queue replay, or recovery import).
   */
  public static async logReplayReceipt(
    quotationId: string,
    replayContext: string,
    result: ReplayDeterminismResult,
    signatures: {
      semantic_schema_signature: string;
      execution_plan_signature: string;
      totals_ast_signature: string;
    }
  ): Promise<void> {
    const id = generateId();
    const timestamp = new Date().toISOString();

    await dbClient.executeWrite(`
      INSERT INTO runtime_replay_receipts 
      (id, quotation_id, replay_context, determinism_result, semantic_schema_signature, execution_plan_signature, totals_ast_signature, timestamp) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, quotationId, replayContext, result,
      signatures.semantic_schema_signature, 
      signatures.execution_plan_signature, 
      signatures.totals_ast_signature, 
      timestamp
    ]);
  }
}

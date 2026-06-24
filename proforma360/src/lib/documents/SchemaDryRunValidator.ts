import { DocumentSchemaDefinition } from "./documentSchemaRegistry";
import { analyzeSchemaComplexity } from "./schemaAnalysisReport";
import { validateASTGovernance } from "./documentTotals";

/**
 * Sandboxes the compilation and validation of a new schema before 
 * allowing it to enter the main SchemaRegistry.
 */
export class SchemaDryRunValidator {
  static validate(schema: DocumentSchemaDefinition): void {
    // 1. Static Complexity Analysis
    const report = analyzeSchemaComplexity(schema);
    if (report.complexityScore > 100) {
      throw new Error("DryRun Error: Schema complexity exceeds safety limits. This looks like an app, not a document.");
    }

    // 2. AST Governance Validation
    // Checks for recursion, deep nodes, loops.
    for (const total of schema.totals) {
      try {
        validateASTGovernance(total.formula);
      } catch (e: any) {
        throw new Error(`DryRun AST Error in total '${total.id}': ${e.message}`);
      }
    }

    // 3. Topology Validation
    // TODO: Invoke DocumentDependencyGraph to detect cycles in AST variables

    // If we reach here, the schema is safe to be registered.
  }
}

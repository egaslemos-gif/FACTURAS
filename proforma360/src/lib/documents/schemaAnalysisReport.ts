import { DocumentSchemaDefinition } from "./documentSchemaRegistry";

export interface SchemaAnalysisResult {
  complexityScore: number;
  astDepth: number;
  estimatedRenderCost: number; // Rough heuristic of pagination cost
  lifecycleComplexity: number; // Placeholder for lifecycle states
  isValidForSubscription: boolean;
  warnings: string[];
}

/**
 * Calculates a complexity score to govern system abuse.
 * Rejects schemas that cross the line between "Document" and "Application".
 */
export function analyzeSchemaComplexity(schema: DocumentSchemaDefinition): SchemaAnalysisResult {
  let score = 0;
  let maxAstDepth = 0;
  const warnings: string[] = [];

  // Calculate Field Complexity
  score += schema.headerFields.length * 2;
  score += schema.itemFields.length * 3;

  if (schema.headerFields.length > 20) {
    warnings.push("High number of header fields may clutter the UI.");
  }
  if (schema.itemFields.length > 10) {
    warnings.push("High number of item fields may cause horizontal overflow in PDF rendering.");
  }

  // Totals Complexity
  score += schema.totals.length * 5;

  // Render Cost Heuristic
  // Every column adds cost, every section adds cost.
  const estimatedRenderCost = schema.sections.length * 10 + schema.itemFields.length * 5;

  return {
    complexityScore: score,
    astDepth: maxAstDepth, // To be implemented deeply when parsing AST tree
    estimatedRenderCost,
    lifecycleComplexity: 0, // Placeholder
    isValidForSubscription: true, // Will depend on the user's plan
    warnings
  };
}

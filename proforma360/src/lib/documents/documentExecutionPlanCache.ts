import { DocumentSchemaDefinition } from "./documentSchemaRegistry";
import { DocumentDependencyGraph } from "./documentDependencyGraph";
import { validateASTGovernance } from "./documentTotals";

export interface ExecutionPlan {
  orderedTotals: string[];
  schemaChecksum: string;
}

/**
 * Caches the expensive topological sorting and AST validation.
 * Prevents battery drain and slow rendering on mobile.
 */
export class DocumentExecutionPlanCache {
  private static cache = new Map<string, ExecutionPlan>();

  static getPlan(schema: DocumentSchemaDefinition): ExecutionPlan {
    const cacheKey = `${schema.context}_${schema.version}_${schema.schemaChecksum}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 1. Build Graph
    const graph = new Map<string, string[]>();
    for (const total of schema.totals) {
      validateASTGovernance(total.formula); // Re-validate AST safety
      const deps = DocumentDependencyGraph.extractDependencies(total.formula);
      graph.set(total.id, deps);
    }

    // 2. Topological Sort (Throws if cycle detected)
    const orderedTotals = DocumentDependencyGraph.topologicalSort(graph);

    const plan: ExecutionPlan = {
      orderedTotals,
      schemaChecksum: schema.schemaChecksum
    };

    this.cache.set(cacheKey, plan);
    return plan;
  }

  static invalidate(schemaKey: string) {
    // Allows memory cleanup if needed
    for (const key of this.cache.keys()) {
      if (key.startsWith(schemaKey)) {
        this.cache.delete(key);
      }
    }
  }
}

import { ASTNode } from "./documentTotals";

/**
 * Validates the dependency graph of an AST array to detect cyclic references.
 * Ensures that Total B cannot depend on Total A if Total A depends on Total B.
 */
export class DocumentDependencyGraph {
  
  /**
   * Extracts all FIELD dependencies from an AST node.
   */
  static extractDependencies(node: ASTNode): string[] {
    const deps = new Set<string>();
    
    function traverse(n: ASTNode) {
      switch (n.type) {
        case "FIELD":
          deps.add(n.field);
          break;
        case "ADD":
        case "MULTIPLY":
          n.nodes.forEach(traverse);
          break;
        case "SUBTRACT":
        case "DIVIDE":
          traverse(n.left);
          traverse(n.right);
          break;
        case "CONDITION_IF":
          deps.add(n.conditionField);
          traverse(n.isTruthy);
          traverse(n.isFalsy);
          break;
      }
    }
    
    traverse(node);
    return Array.from(deps);
  }

  /**
   * Performs topological sort and cycle detection on a set of nodes.
   * If a cycle is detected, throws a Fatal Execution Error.
   * 
   * @param graph Map of Node ID to list of dependent Node IDs.
   */
  static topologicalSort(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const result: string[] = [];

    function dfs(node: string) {
      if (recStack.has(node)) {
        throw new Error(`Dependency Graph Error: Circular dependency detected involving node '${node}'.`);
      }
      if (visited.has(node)) return;

      visited.add(node);
      recStack.add(node);

      const deps = graph.get(node) || [];
      for (const dep of deps) {
        // If the dependency exists in the graph, we must traverse it.
        // If it's a base dynamic_field (not in the graph keys), we ignore it as a leaf.
        if (graph.has(dep)) {
          dfs(dep);
        }
      }

      recStack.delete(node);
      result.push(node); // Post-order
    }

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return result;
  }
}

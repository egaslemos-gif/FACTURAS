import { FinanceMath } from "./deterministicFinancialMath";

// ==========================================
// AST GOVERNANCE LIMITS
// ==========================================
export const MAX_DEPENDENCY_GRAPH_DEPTH = 5;
export const MAX_DEPENDENCY_GRAPH_WIDTH = 10;
export const MAX_TOTAL_DEPENDENCIES = 50;
export const MAX_CUMULATIVE_FORMULA_COST = 200;

// ==========================================
// PURE AST FORMULA ENGINE
// ==========================================
export type ASTNodeType = 
  | "FIELD" 
  | "CONSTANT"
  | "ADD" 
  | "SUBTRACT" 
  | "MULTIPLY" 
  | "DIVIDE" 
  | "CONDITION_IF";

export type ASTNode =
  | { type: "FIELD"; field: string }
  | { type: "CONSTANT"; value: number }
  | { type: "ADD"; nodes: ASTNode[] }
  | { type: "SUBTRACT"; left: ASTNode; right: ASTNode }
  | { type: "MULTIPLY"; nodes: ASTNode[] }
  | { type: "DIVIDE"; left: ASTNode; right: ASTNode }
  | { type: "CONDITION_IF"; conditionField: string; isTruthy: ASTNode; isFalsy: ASTNode };

/**
 * Validates Graph Depth, Width, and Total Dependencies to prevent semantic explosion.
 */
export function validateASTGovernance(node: ASTNode, currentDepth: number = 0, graphStats: { totalDependencies: number } = { totalDependencies: 0 }): void {
  if (currentDepth > MAX_DEPENDENCY_GRAPH_DEPTH) {
    throw new Error(`AST Governance Error: Maximum dependency depth of ${MAX_DEPENDENCY_GRAPH_DEPTH} exceeded.`);
  }
  
  graphStats.totalDependencies++;
  if (graphStats.totalDependencies > MAX_TOTAL_DEPENDENCIES) {
    throw new Error(`AST Governance Error: Maximum total dependencies of ${MAX_TOTAL_DEPENDENCIES} exceeded.`);
  }

  switch (node.type) {
    case "ADD":
    case "MULTIPLY":
      if (node.nodes.length > MAX_DEPENDENCY_GRAPH_WIDTH) {
        throw new Error(`AST Governance Error: Maximum dependency width of ${MAX_DEPENDENCY_GRAPH_WIDTH} exceeded.`);
      }
      node.nodes.forEach(n => validateASTGovernance(n, currentDepth + 1, graphStats));
      break;
    case "SUBTRACT":
    case "DIVIDE":
      validateASTGovernance(node.left, currentDepth + 1, graphStats);
      validateASTGovernance(node.right, currentDepth + 1, graphStats);
      break;
    case "CONDITION_IF":
      validateASTGovernance(node.isTruthy, currentDepth + 1, graphStats);
      validateASTGovernance(node.isFalsy, currentDepth + 1, graphStats);
      break;
    case "FIELD":
    case "CONSTANT":
      break; // Leaves
  }
}

export const WEIGHTED_FORMULA_COST: Record<ASTNodeType, number> = {
  FIELD: 1,
  CONSTANT: 1,
  ADD: 1,
  SUBTRACT: 1,
  MULTIPLY: 2,
  DIVIDE: 4,
  CONDITION_IF: 5,
};

/**
 * Pure evaluator for the AST. Operates strictly on a closed context (data map).
 * Uses a safe deterministic financial math utility to avoid JS float issues.
 * Important: Returns values in integer minor-units (cents). The constants/fields
 * are assumed to be in cents already OR the caller must convert inputs/outputs.
 */
export function evaluateAST(node: ASTNode, context: Record<string, any>, operations: { count: number }, depth: number = 0): number {
  // Calculate effective cost based on node type and nesting depth (for branches)
  let effectiveCost = WEIGHTED_FORMULA_COST[node.type] || 1;
  if (node.type === "CONDITION_IF") {
    // Exponential cost multiplier based on depth to penalize deep branching
    const nestingMultiplier = Math.pow(2, depth);
    effectiveCost = effectiveCost * nestingMultiplier;
  }

  operations.count += effectiveCost;

  if (operations.count > MAX_CUMULATIVE_FORMULA_COST) {
    throw new Error(`AST Governance Error: Maximum cumulative formula cost (${MAX_CUMULATIVE_FORMULA_COST}) exceeded.`);
  }

  switch (node.type) {
    case "CONSTANT":
      return node.value; // Already in cents
    
    case "FIELD":
      const val = context[node.field];
      if (typeof val !== "number") {
        throw new Error(`AST Evaluation Error: Field '${node.field}' is not a number.`);
      }
      return val; // Already in cents
    
    case "ADD":
      return node.nodes.reduce((sum, n) => FinanceMath.add(sum, evaluateAST(n, context, operations, depth + 1)), 0);
    
    case "MULTIPLY":
      return node.nodes.reduce((prod, n) => FinanceMath.multiply(prod, evaluateAST(n, context, operations, depth + 1)), 100); // Start with 1.0 (100 cents)
    
    case "SUBTRACT":
      return FinanceMath.subtract(evaluateAST(node.left, context, operations, depth + 1), evaluateAST(node.right, context, operations, depth + 1));
    
    case "DIVIDE":
      const divisor = evaluateAST(node.right, context, operations, depth + 1);
      return FinanceMath.divide(evaluateAST(node.left, context, operations, depth + 1), divisor);
    
    case "CONDITION_IF":
      const condVal = context[node.conditionField];
      return condVal ? evaluateAST(node.isTruthy, context, operations, depth + 1) : evaluateAST(node.isFalsy, context, operations, depth + 1);
  }
}

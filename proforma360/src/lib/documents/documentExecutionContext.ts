/**
 * Execution Environment settings that can change the math and formatting 
 * regardless of the document's schema.
 */
export interface DocumentExecutionContext {
  locale: string;
  currency: string;
  timezone: string;
  taxRegime: "MOZAMBIQUE" | "PORTUGAL" | "ANGOLA" | "GENERIC";
  precisionRules: {
    decimals: number;
    roundingStrategy: "BANKERS" | "UP" | "DOWN" | "TRUNCATE";
  };
}

export const DEFAULT_EXECUTION_CONTEXT: DocumentExecutionContext = {
  locale: "pt-MZ",
  currency: "MZN",
  timezone: "Africa/Maputo",
  taxRegime: "MOZAMBIQUE",
  precisionRules: {
    decimals: 2,
    roundingStrategy: "BANKERS"
  }
};

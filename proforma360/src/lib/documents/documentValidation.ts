import { DocumentSchemaDefinition } from "./documentSchemaRegistry";

/**
 * Validates a runtime payload against the declared Schema Context.
 * Ensures the document contains exactly the semantic structure defined.
 */
export function validateDocumentPayload(
  schema: DocumentSchemaDefinition, 
  headerPayload: Record<string, any>, 
  itemsPayload: Array<Record<string, any>>
): void {
  // 1. Validate Header Fields
  for (const field of schema.headerFields) {
    const value = headerPayload[field.key];
    if (field.required && (value === undefined || value === null || value === "")) {
      throw new Error(`Validation Error: Missing required header field '${field.key}' for context '${schema.context}'.`);
    }
    // Strict typing validation could be added here (e.g. is 'value' a Number if field.type === 'NUMBER'?)
    if (value !== undefined && value !== null) {
       validateFieldType(field, value);
    }
  }

  // 2. Validate Items Payload
  for (const item of itemsPayload) {
    for (const field of schema.itemFields) {
      const value = item[field.key];
      if (field.required && (value === undefined || value === null || value === "")) {
        throw new Error(`Validation Error: Missing required item field '${field.key}' in context '${schema.context}'.`);
      }
      if (value !== undefined && value !== null) {
        validateFieldType(field, value);
      }
    }
  }
}

function validateFieldType(field: import("./documentFieldDefinitions").DynamicFieldDefinition, value: any) {
  switch (field.type) {
    case "NUMBER":
    case "CURRENCY":
      if (typeof value !== "number") throw new Error(`Type Error: Field '${field.key}' must be a number.`);
      break;
    case "BOOLEAN":
      if (typeof value !== "boolean") throw new Error(`Type Error: Field '${field.key}' must be a boolean.`);
      break;
    case "TEXT":
    case "SELECT":
    case "DATE":
      if (typeof value !== "string") throw new Error(`Type Error: Field '${field.key}' must be a string.`);
      break;
  }
}

import { DocumentExecutionContext, DEFAULT_EXECUTION_CONTEXT } from "./documentExecutionContext";
import { DynamicFieldDefinition } from "./documentFieldDefinitions";

/**
 * Maps raw JSON values to safe, localized presentation strings.
 * Enforces the Golden Triad: The Renderer only paints strings. It does not compute math or localization.
 */
export class DocumentFieldMapper {
  static mapValue(
    value: any, 
    fieldDef: DynamicFieldDefinition, 
    context: DocumentExecutionContext = DEFAULT_EXECUTION_CONTEXT
  ): string {
    if (value === undefined || value === null) {
      return "-";
    }

    switch (fieldDef.type) {
      case "CURRENCY":
        if (typeof value !== "number") return "-";
        return new Intl.NumberFormat(context.locale, {
          style: "currency",
          currency: context.currency,
          minimumFractionDigits: context.precisionRules.decimals,
          maximumFractionDigits: context.precisionRules.decimals
        }).format(value);

      case "NUMBER":
        if (typeof value !== "number") return "-";
        const formattedNum = new Intl.NumberFormat(context.locale, {
          minimumFractionDigits: 0,
          maximumFractionDigits: context.precisionRules.decimals
        }).format(value);
        return fieldDef.unit ? `${formattedNum} ${fieldDef.unit}` : formattedNum;

      case "DATE":
        try {
          const date = new Date(value);
          return new Intl.DateTimeFormat(context.locale, {
            timeZone: context.timezone,
            year: "numeric",
            month: "short",
            day: "2-digit"
          }).format(date);
        } catch {
          return String(value);
        }

      case "BOOLEAN":
        return value ? "Sim" : "Não";

      case "SELECT":
        const option = fieldDef.options?.find(o => o.value === String(value));
        return option ? option.label : String(value);

      case "TEXT":
      default:
        return String(value);
    }
  }
}

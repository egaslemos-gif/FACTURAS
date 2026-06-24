export type FieldDataType = 
  | "TEXT" 
  | "NUMBER" 
  | "DATE" 
  | "BOOLEAN" 
  | "CURRENCY" 
  | "SELECT";

export interface DynamicFieldDefinition {
  /** Uniquely identifies the field in the dynamic_fields JSON payload (e.g. 'storageDays') */
  key: string;
  
  /** Strict data type to enforce parsing and semantic safety */
  type: FieldDataType;
  
  /** Human-readable label for UI and presentation (e.g. 'Dias de Armazenamento') */
  label: string;
  
  /** Is this field mandatory for this document context? */
  required: boolean;
  
  /** Optional unit string for presentation (e.g. 'kg', 'dias', 'm³') */
  unit?: string;
  
  /** Optional options if type === 'SELECT' */
  options?: Array<{ value: string; label: string }>;
  
  /** Default value if omitted */
  defaultValue?: any;
}

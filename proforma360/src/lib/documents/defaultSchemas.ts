import { DocumentSchemaDefinition } from "./documentSchemaRegistry";

/**
 * Standard General Business Schema (v1)
 */
export const GENERAL_SCHEMA_V1: DocumentSchemaDefinition = {
  context: "GENERAL",
  version: "v1",
  complexity: "BASIC",
  schemaChecksum: "base-general-v1",
  headerFields: [],
  itemFields: [
    { key: "description", type: "TEXT", label: "Descrição", required: true },
    { key: "quantity", type: "NUMBER", label: "Qtd", required: true },
    { key: "unit_price", type: "CURRENCY", label: "Preço Unitário", required: true },
    { key: "vat_rate", type: "NUMBER", label: "IVA %", required: true }
  ],
  sections: [
    { type: "HEADER", order: 1 },
    { type: "CLIENT_BLOCK", order: 2 },
    { type: "ITEM_TABLE", order: 3 },
    { type: "TOTALS", order: 4 },
    { type: "TERMS_AND_NOTES", order: 5 },
    { type: "SIGNATURES", order: 6 }
  ],
  totals: [
    {
      id: "subtotal",
      label: "Subtotal",
      formula: { type: "FIELD", field: "subtotal" } // Computed externally or by mapping items
    },
    {
      id: "vat_total",
      label: "Total IVA",
      formula: { type: "FIELD", field: "vat_total" }
    },
    {
      id: "grand_total",
      label: "Total a Pagar",
      formula: { type: "FIELD", field: "grand_total" }
    }
  ]
};

/**
 * Advanced Logistics Business Schema (v1)
 */
export const LOGISTICS_SCHEMA_V1: DocumentSchemaDefinition = {
  context: "LOGISTICS",
  version: "v1",
  complexity: "ADVANCED",
  schemaChecksum: "base-logistics-v1",
  headerFields: [
    { key: "vessel_name", type: "TEXT", label: "Navio", required: false },
    { key: "port_of_loading", type: "TEXT", label: "Porto de Carga", required: false },
    { key: "port_of_discharge", type: "TEXT", label: "Porto de Descarga", required: false },
    { key: "container_number", type: "TEXT", label: "Nº Contentor", required: false },
    { key: "awb_bl", type: "TEXT", label: "AWB / BL", required: false }
  ],
  itemFields: [
    { key: "description", type: "TEXT", label: "Descrição do Serviço", required: true },
    { key: "weight_kg", type: "NUMBER", label: "Peso (Kg)", required: false, unit: "kg" },
    { key: "quantity", type: "NUMBER", label: "Qtd", required: true },
    { key: "unit_price", type: "CURRENCY", label: "Preço", required: true },
    { key: "vat_rate", type: "NUMBER", label: "IVA %", required: true }
  ],
  sections: [
    { type: "HEADER", order: 1 },
    { type: "CLIENT_BLOCK", order: 2 },
    { type: "OPERATIONAL_METADATA", order: 3 }, // Specific block for Logistics
    { type: "ITEM_TABLE", order: 4 },
    { type: "TOTALS", order: 5 },
    { type: "TERMS_AND_NOTES", order: 6 },
    { type: "SIGNATURES", order: 7 }
  ],
  totals: [
    { id: "subtotal", label: "Subtotal", formula: { type: "FIELD", field: "subtotal" } },
    { id: "vat_total", label: "Total IVA", formula: { type: "FIELD", field: "vat_total" } },
    { id: "grand_total", label: "Total a Pagar", formula: { type: "FIELD", field: "grand_total" } }
  ]
};

import { DocumentSchemaDefinition } from "./documentSchemaRegistry";

/**
 * Ensures a schema cannot be modified once it is considered "Published" or "Active".
 * Schema evolution must happen via migration to a new version (e.g. v1 -> v2).
 */
export function validateSchemaImmutability(
  incomingSchema: DocumentSchemaDefinition, 
  existingSchema?: DocumentSchemaDefinition
): void {
  if (!existingSchema) return;

  // If a schema has the same context and version, it must have the identical checksum.
  // We forbid "hot edits" to a schema version that already exists in the registry.
  if (
    incomingSchema.context === existingSchema.context &&
    incomingSchema.version === existingSchema.version &&
    incomingSchema.schemaChecksum !== existingSchema.schemaChecksum
  ) {
    throw new Error(
      `Schema Immutability Error: Cannot hot-edit ${incomingSchema.context} v${incomingSchema.version}. ` +
      `Create a new version (e.g. v${parseInt(incomingSchema.version.replace('v', '')) + 1}) to evolve the schema.`
    );
  }
}

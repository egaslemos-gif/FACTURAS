/**
 * Defines the shallow merge resolution strategy for dynamic fields when two
 * offline clients mutate different keys in the same document.
 */
export class OfflineConflictSemantics {
  
  /**
   * Shallow merge based on granular field timestamps.
   * Prevents standard JSON Last-Write-Wins (LWW) from destroying non-overlapping field updates.
   * 
   * Expected structure: 
   * serverState: { "storageDays": 5, "fuelSurcharge": 100 }
   * localState: { "storageDays": 8 } (modified locally)
   * incomingSyncState: { "fuelSurcharge": 200 } (modified by another device)
   */
  static mergeDynamicFields(
    serverFields: Record<string, any>,
    localFields: Record<string, any>,
    incomingFields: Record<string, any>,
    localTimestamps: Record<string, number>,
    incomingTimestamps: Record<string, number>
  ): Record<string, any> {
    const merged = { ...serverFields };

    // Set of all keys involved in the conflict
    const allKeys = new Set([...Object.keys(localFields), ...Object.keys(incomingFields)]);

    for (const key of allKeys) {
      const localVal = localFields[key];
      const incomingVal = incomingFields[key];
      const localTs = localTimestamps[key] || 0;
      const incomingTs = incomingTimestamps[key] || 0;

      if (localVal !== undefined && incomingVal !== undefined) {
        // True collision on the same field
        merged[key] = localTs >= incomingTs ? localVal : incomingVal;
      } else if (localVal !== undefined) {
        // Only modified locally
        merged[key] = localVal;
      } else if (incomingVal !== undefined) {
        // Only modified remotely
        merged[key] = incomingVal;
      }
    }

    return merged;
  }
}

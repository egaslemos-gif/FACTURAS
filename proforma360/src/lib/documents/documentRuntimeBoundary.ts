/**
 * The Runtime Boundary catches any failures from the Semantic or Operational Engines
 * before they leak into the UI or PDF generation logic.
 * It provides graceful degradation instead of crashing the React tree or PDF renderer.
 */
export class DocumentRuntimeBoundary {
  static executeSafe<T>(operationName: string, fn: () => T, fallback: T): T {
    try {
      return fn();
    } catch (error) {
      console.error(`[DocumentRuntimeBoundary] Execution Governor intervened on '${operationName}':`, error);
      // In a real environment, report to telemetry (Sentry/Datadog)
      return fallback;
    }
  }

  static async executeSafeAsync<T>(operationName: string, fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error(`[DocumentRuntimeBoundary] Async Governor intervened on '${operationName}':`, error);
      return fallback;
    }
  }
}

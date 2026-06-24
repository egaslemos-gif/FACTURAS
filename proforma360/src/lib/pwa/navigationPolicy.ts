/**
 * Offline Routing & Navigation Policy Manager for Proforma360 PWA.
 * Intercepts routing failures and provides clean client-side fallbacks.
 */

export class NavigationPolicy {
  /**
   * Evaluates if a given URL is a dynamic client/quotation path that should fail gracefully.
   */
  static isDynamicOperationalRoute(path: string): boolean {
    return (
      path.startsWith("/dashboard/quotations/") ||
      path.startsWith("/dashboard/clients/") ||
      path.startsWith("/view/")
    );
  }

  /**
   * Fallback routing redirection logic during offline navigation issues.
   */
  static handleNavigationFailure(router: any, path: string): void {
    console.warn(`[Navigation Policy] Network load failed for route: ${path}. Handling redirect...`);
    
    // Redirect to main offline-safe dashboard shell
    if (this.isDynamicOperationalRoute(path)) {
      router.push("/dashboard?offline_fallback=true");
    } else {
      router.push("/dashboard");
    }
  }
}

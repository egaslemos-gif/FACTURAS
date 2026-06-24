/**
 * Hardware constraints for rendering.
 * Prevents mobile devices and PWA environments from crashing during huge PDF generations.
 */
export const RENDER_BUDGET_LIMITS = {
  MAX_PAGES: 100, // Never allow a PDF to exceed 100 pages
  MAX_ROWS_PER_DOCUMENT: 2000,
  MAX_COLUMNS_PER_TABLE: 12, // Prevents horizontal overflow corruption
  MAX_RENDER_DURATION_MS: 5000 // 5 seconds max blocking time for a worker
};

export class DocumentRenderBudget {
  private startTime: number;
  private pagesRendered: number = 0;
  private rowsRendered: number = 0;
  private columnsRendered: number = 0;

  constructor(columns: number) {
    this.startTime = Date.now();
    this.columnsRendered = columns;

    if (this.columnsRendered > RENDER_BUDGET_LIMITS.MAX_COLUMNS_PER_TABLE) {
      throw new Error(`Render Budget Error: Schema requests ${this.columnsRendered} columns, but max is ${RENDER_BUDGET_LIMITS.MAX_COLUMNS_PER_TABLE}.`);
    }
  }

  recordRow() {
    this.rowsRendered++;
    if (this.rowsRendered > RENDER_BUDGET_LIMITS.MAX_ROWS_PER_DOCUMENT) {
      throw new Error(`Render Budget Error: Exceeded max allowed rows (${RENDER_BUDGET_LIMITS.MAX_ROWS_PER_DOCUMENT}).`);
    }
  }

  recordPage() {
    this.pagesRendered++;
    if (this.pagesRendered > RENDER_BUDGET_LIMITS.MAX_PAGES) {
      throw new Error(`Render Budget Error: Exceeded max allowed pages (${RENDER_BUDGET_LIMITS.MAX_PAGES}).`);
    }
  }

  checkDuration() {
    const elapsed = Date.now() - this.startTime;
    if (elapsed > RENDER_BUDGET_LIMITS.MAX_RENDER_DURATION_MS) {
      throw new Error(`Render Budget Error: Max render duration of ${RENDER_BUDGET_LIMITS.MAX_RENDER_DURATION_MS}ms exceeded. Process aborted to save memory.`);
    }
  }
}

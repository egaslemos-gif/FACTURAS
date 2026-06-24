/**
 * Deterministic Financial Math Engine
 *
 * Implements strict integer minor-units math (e.g., cents) for all currency calculations
 * to avoid floating-point errors common in JavaScript (e.g. 0.1 + 0.2 = 0.30000000000000004).
 *
 * This guarantees determinism when computing document totals across different environments
 * (React render, PDF generator, Background Sync Workers).
 * 
 * Internally operates on integers representing minor units (cents).
 */

export class FinanceMath {
  /**
   * Converts a float (e.g., 100.50) into integer cents (10050)
   */
  static toCents(floatValue: number): number {
    return Math.round(floatValue * 100);
  }

  /**
   * Converts integer cents (10050) back to a float (100.50)
   */
  static toFloat(cents: number): number {
    return cents / 100;
  }

  static add(a: number, b: number): number {
    return Math.round(a + b);
  }

  static subtract(a: number, b: number): number {
    return Math.round(a - b);
  }

  /**
   * Multiplies two cent values and returns cents.
   * Since both are cents (scale 100), their product has scale 10000.
   * Divide by 100 to return to cents.
   */
  static multiply(a: number, b: number): number {
    return Math.round((a * b) / 100);
  }

  /**
   * Multiplies a cent value by a raw float (e.g. quantity 2.5)
   */
  static multiplyByFloat(a: number, multiplier: number): number {
    return Math.round(a * multiplier);
  }

  /**
   * Divides two cent values and returns cents.
   */
  static divide(a: number, b: number): number {
    if (b === 0) throw new Error("Division by zero in financial math");
    return Math.round((a * 100) / b);
  }

  /**
   * Calculates percentage mathematically safely on cents.
   * e.g., 17.5% of 10000 cents -> 1750 cents
   */
  static applyPercentage(cents: number, percentage: number): number {
    return Math.round((cents * percentage) / 100);
  }
}

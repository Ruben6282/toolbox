/**
 * safe-math.ts
 * Unified arbitrary-precision math system using decimal.js
 * Prevents overflow, underflow, and precision loss in calculations
 */

import Decimal from "decimal.js";

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 50, // High precision for intermediate calculations
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -12, // Don't use exponential notation below 1e-12
  toExpPos: 12, // Don't use exponential notation above 1e12
});

export const MAX_SAFE_VALUE = 1e12;
export const MIN_SAFE_VALUE = -1e12;

/**
 * Safe calculation wrapper using decimal.js
 * Catches errors and returns null instead of NaN/Infinity
 * 
 * @param fn - Function that performs calculation using Decimal
 * @returns Result as number or null if calculation fails
 * 
 * @example
 * const result = safeCalc(D => D(100).mul(1.5).div(2));
 * // Returns: 75
 * 
 * @example
 * const interest = safeCalc(D => D(principal).mul(rate).div(100).mul(years));
 */
export function safeCalc(
  fn: (D: typeof Decimal) => Decimal | number
): number | null {
  try {
    const result = fn(Decimal);
    
    // Handle if function returns a number directly
    if (typeof result === "number") {
      if (!Number.isFinite(result)) {
        return null;
      }
      return result;
    }
    
    // Convert Decimal to number
    const num = result.toNumber();
    
    // Validate result is finite
    if (!Number.isFinite(num)) {
      return null;
    }
    
    // Check if result is within safe range
    if (num > MAX_SAFE_VALUE || num < MIN_SAFE_VALUE) {
      return null;
    }
    
    return num;
  } catch (error) {
    // Calculation failed (division by zero, overflow, etc.)
    console.warn("safeCalc error:", error);
    return null;
  }
}

/**
 * Safe addition
 */
export function safeAdd(a: number, b: number): number | null {
  return safeCalc(D => D(a).plus(b));
}

/**
 * Safe subtraction
 */
export function safeSubtract(a: number, b: number): number | null {
  return safeCalc(D => D(a).minus(b));
}

/**
 * Safe multiplication
 */
export function safeMultiply(a: number, b: number): number | null {
  return safeCalc(D => D(a).mul(b));
}

/**
 * Safe division
 */
export function safeDivide(a: number, b: number): number | null {
  if (b === 0) {
    return null;
  }
  return safeCalc(D => D(a).div(b));
}

/**
 * Safe power/exponentiation
 */
export function safePower(base: number, exponent: number): number | null {
  return safeCalc(D => D(base).pow(exponent));
}

/**
 * Safe percentage calculation
 * @param value - The value to calculate percentage of
 * @param percentage - The percentage (e.g., 15 for 15%)
 */
export function safePercentage(value: number, percentage: number): number | null {
  return safeCalc(D => D(value).mul(percentage).div(100));
}

/**
 * Format number for display with locale support
 * @param value - Number to format
 * @param options - Intl.NumberFormatOptions
 */
export function formatNumber(
  value: number | null,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null) {
    return "—";
  }
  
  if (!Number.isFinite(value)) {
    return "—";
  }
  
  try {
    return new Intl.NumberFormat(undefined, options).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Format as currency
 */
export function formatCurrency(value: number | null): string {
  return formatNumber(value, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format as percentage
 */
export function formatPercentage(value: number | null, decimals = 2): string {
  if (value === null) {
    return "—";
  }
  return formatNumber(value, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + "%";
}

/**
 * Round to specified decimal places using banker's rounding
 */
export function safeRound(value: number, decimals = 2): number | null {
  return safeCalc(D => D(value).toDecimalPlaces(decimals));
}

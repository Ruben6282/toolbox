/**
 * validators.ts
 * Centralized validation logic for all calculator tools
 */

/**
 * Check if a value is a safe finite number
 */
export function isSafeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Validate that a number is within a specified range
 * @param num - Number to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns true if valid, false otherwise
 */
export function validateRange(
  num: number | null,
  min: number,
  max: number
): boolean {
  if (num === null || !isSafeNumber(num)) {
    return false;
  }
  return num >= min && num <= max;
}

/**
 * Validate count/iteration limits to prevent UI freezes
 * @param num - Count to validate
 * @param max - Maximum allowed count (default: 1000)
 * @returns true if valid, false otherwise
 */
export function validateCount(num: number | null, max = 1000): boolean {
  if (num === null || !isSafeNumber(num)) {
    return false;
  }
  // Must be positive integer
  if (num < 1 || !Number.isInteger(num)) {
    return false;
  }
  return num <= max;
}

/**
 * Validate that a number is positive
 */
export function validatePositive(num: number | null): boolean {
  if (num === null || !isSafeNumber(num)) {
    return false;
  }
  return num > 0;
}

/**
 * Validate that a number is non-negative (zero or positive)
 */
export function validateNonNegative(num: number | null): boolean {
  if (num === null || !isSafeNumber(num)) {
    return false;
  }
  return num >= 0;
}

/**
 * Validate percentage (0-100)
 */
export function validatePercentage(num: number | null): boolean {
  return validateRange(num, 0, 100);
}

/**
 * Validate that a result is displayable (within safe range and finite)
 * @param num - Result to validate
 * @returns true if safe to display, false if "Result too large" should be shown
 */
export function validateResult(num: number | null): boolean {
  if (num === null || !isSafeNumber(num)) {
    return false;
  }
  
  const MAX_DISPLAY = 1e12;
  const MIN_DISPLAY = -1e12;
  
  // Check if within displayable range
  if (num > MAX_DISPLAY || num < MIN_DISPLAY) {
    return false;
  }
  
  // Check if has too many digits
  const numStr = Math.abs(num).toString();
  const digits = numStr.replace(".", "").replace(/^0+/, "").length;
  if (digits > 15) {
    return false;
  }
  
  return true;
}

/**
 * Error messages for common validation failures
 */
export const ValidationErrors = {
  REQUIRED: "This field is required",
  INVALID_NUMBER: "Please enter a valid number",
  OUT_OF_RANGE: "Value is out of allowed range",
  MUST_BE_POSITIVE: "Value must be positive",
  MUST_BE_NON_NEGATIVE: "Value must be zero or positive",
  RESULT_TOO_LARGE: "Result too large to display. Try using smaller inputs.",
  INVALID_PERCENTAGE: "Percentage must be between 0 and 100",
  EXCEEDS_MAX_COUNT: "Count exceeds maximum allowed value",
} as const;

/**
 * safe-number.ts
 * Unified numeric sanitization and validation system
 * Used across all calculator tools to ensure consistent behavior
 */

export interface SafeNumberOptions {
  /** Maximum allowed value (default: 1e12) */
  max?: number;
  /** Minimum allowed value (default: -1e12) */
  min?: number;
  /** Maximum string length (default: 15) */
  maxLength?: number;
  /** Allow negative numbers (default: true) */
  allowNegative?: boolean;
  /** Allow decimal points (default: true) */
  allowDecimal?: boolean;
}

const DEFAULT_OPTIONS: Required<SafeNumberOptions> = {
  max: 1e12,
  min: -1e12,
  maxLength: 15,
  allowNegative: true,
  allowDecimal: true,
};

/**
 * Sanitizes and validates numeric input string
 * Returns a valid number or null if invalid
 * 
 * Features:
 * - Strips scientific notation (e, E, +)
 * - Enforces maxLength (default 15 chars)
 * - Clamps to ±1e12 range
 * - Normalizes edge cases: "-0", "000012", "--12", "12.", ".5"
 * - Prevents NaN, Infinity, and invalid input
 * 
 * @param input - Raw input string from user
 * @param options - Optional configuration
 * @returns Valid number or null if invalid
 */
export function safeNumber(
  input: string | number | null | undefined,
  options?: SafeNumberOptions
): number | null {
  // Handle null/undefined
  if (input === null || input === undefined) {
    return null;
  }

  // If already a number, validate it
  if (typeof input === "number") {
    if (!Number.isFinite(input)) {
      return null;
    }
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const clamped = Math.max(opts.min, Math.min(opts.max, input));
    return clamped;
  }

  // Convert to string and trim
  const str = String(input).trim();
  
  // Empty string returns null
  if (str === "" || str === "-" || str === ".") {
    return null;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check length before processing
  if (str.length > opts.maxLength) {
    return null;
  }

  // Strip unsafe characters and scientific notation
  // Remove all non-numeric except first minus and first dot
  let result = "";
  let hasDecimal = false;
  let hasNegative = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    // Handle negative sign
    if (char === "-") {
      if (i === 0 && opts.allowNegative && !hasNegative) {
        result += char;
        hasNegative = true;
      }
      // Ignore other minuses
      continue;
    }
    
    // Handle decimal point
    if (char === ".") {
      if (opts.allowDecimal && !hasDecimal) {
        result += char;
        hasDecimal = true;
      }
      // Ignore other dots
      continue;
    }
    
    // Handle digits
    if (char >= "0" && char <= "9") {
      result += char;
      continue;
    }
    
    // Block scientific notation and other characters
    if (char === "e" || char === "E" || char === "+") {
      return null;
    }
  }

  // Handle edge cases
  if (result === "" || result === "-" || result === ".") {
    return null;
  }

  // Strip leading zeros but preserve "0" and "0.x"
  if (result.includes(".")) {
    // Has decimal: strip leading zeros from integer part
    const [intPart, decPart] = result.split(".");
    const strippedInt = intPart.replace(/^(-?)0+/, "$1") || "0";
    result = `${strippedInt}.${decPart}`;
  } else {
    // No decimal: strip leading zeros entirely
    result = result.replace(/^(-?)0+/, "$1") || "0";
  }

  // Handle trailing decimal point "12." -> "12"
  if (result.endsWith(".")) {
    result = result.slice(0, -1);
  }

  // Handle leading decimal point ".5" -> "0.5"
  if (result.startsWith(".")) {
    result = "0" + result;
  }
  if (result.startsWith("-.")) {
    result = "-0" + result.slice(1);
  }

  // Parse to number
  const num = parseFloat(result);

  // Validate result
  if (!Number.isFinite(num)) {
    return null;
  }

  // Normalize -0 to 0
  if (Object.is(num, -0)) {
    return 0;
  }

  // Clamp to range
  const clamped = Math.max(opts.min, Math.min(opts.max, num));

  return clamped;
}

/**
 * Sanitizes input string for display in input field
 * Returns cleaned string (not parsed to number)
 * Used by SafeNumberInput component
 * 
 * @param input - Raw input string
 * @param options - Optional configuration
 * @returns Sanitized string safe for display
 */
export function sanitizeNumberString(
  input: string,
  options?: SafeNumberOptions
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  let result = "";
  let hasDecimal = false;
  let hasNegative = false;

  for (let i = 0; i < input.length && result.length < opts.maxLength; i++) {
    const char = input[i];
    
    // Allow negative sign at start
    if (char === "-" && i === 0 && opts.allowNegative && !hasNegative) {
      result += char;
      hasNegative = true;
      continue;
    }
    
    // Allow one decimal point
    if (char === "." && opts.allowDecimal && !hasDecimal) {
      result += char;
      hasDecimal = true;
      continue;
    }
    
    // Allow digits
    if (char >= "0" && char <= "9") {
      result += char;
      continue;
    }
    
    // Block everything else (e, E, +, spaces, etc.)
  }

  return result;
}

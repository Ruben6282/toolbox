/**
 * SafeNumberInput Component
 * Unified numeric input with automatic sanitization
 * Replaces all manual numeric input handling across calculator tools
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { sanitizeNumberString, SafeNumberOptions } from "@/lib/safe-number";

export interface SafeNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  /** Callback with sanitized string value */
  onChange?: (value: string) => void;
  /** Sanitization options */
  sanitizeOptions?: SafeNumberOptions;
  /** Input mode for mobile keyboards (default: "decimal") */
  inputMode?: "numeric" | "decimal";
}

/**
 * Safe numeric input component
 * Automatically sanitizes input to prevent:
 * - Scientific notation (e, E, +)
 * - Invalid characters
 * - Values outside safe range
 * - Excessive length
 * 
 * @example
 * <SafeNumberInput
 *   value={amount}
 *   onChange={setAmount}
 *   placeholder="Enter amount"
 * />
 */
export const SafeNumberInput = React.forwardRef<
  HTMLInputElement,
  SafeNumberInputProps
>(({ onChange, sanitizeOptions, inputMode = "decimal", ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitized = sanitizeNumberString(rawValue, sanitizeOptions);
    
    if (onChange) {
      onChange(sanitized);
    }
  };

  return (
    <Input
      ref={ref}
      type="text"
      inputMode={inputMode}
      {...props}
      onChange={handleChange}
    />
  );
});

SafeNumberInput.displayName = "SafeNumberInput";

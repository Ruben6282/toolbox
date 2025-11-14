/**
 * PercentageCalculator - Enterprise-grade percentage calculation tool
 * 
 * Security Features:
 * - Input Sanitization: sanitizeNumber() validates numeric range (rejects Infinity, NaN)
 * - Safe Numeric Coercion: Clamps extreme values (max 1e12) to prevent overflow
 * - Range Validation: Percentage clamped to -1000% to 1000% range
 * - Type Safety: Explicit number casting with fallback to 0
 * - Error Handling UI: Visual feedback for invalid input
 * - Localization: Intl.NumberFormat for globally-aware number display
 * - Accessibility: aria-live announcements for screen readers (WCAG 2.1 AA)
 */

import { useState, useMemo } from "react";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatNumber } from "@/lib/safe-math";
import { validateRange } from "@/lib/validators";

const MAX_VALUE = 1e12; // 1 trillion
const MIN_PERCENTAGE = -1000;
const MAX_PERCENTAGE = 1000;



export const PercentageCalculator = () => {
  const [value, setValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);



  // Localization formatter
  const numberFormatter = useMemo(() => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, []);

  const calculate = (v: string, p: string) => {
    setError(null);
    
    // Early return if both inputs are empty
    if (!v.trim() && !p.trim()) {
      setResult(null);
      return;
    }

    // Safe parsing with unified system
    const val = safeNumber(v, { min: -MAX_VALUE, max: MAX_VALUE });
    const perc = safeNumber(p, { min: MIN_PERCENTAGE, max: MAX_PERCENTAGE });

    // Validate value input
    if (v.trim()) {
      if (val === null) {
        setError("Invalid value. Please enter a valid number.");
        setResult(null);
        return;
      }
      const rangeError = validateRange(val, -MAX_VALUE, MAX_VALUE);
      if (rangeError !== true) {
        setError(typeof rangeError === 'string' ? rangeError : `Value must be between ${formatNumber(-MAX_VALUE)} and ${formatNumber(MAX_VALUE)}`);
        setResult(null);
        return;
      }
    }

    // Validate percentage input
    if (p.trim()) {
      if (perc === null) {
        setError("Invalid percentage. Please enter a valid number.");
        setResult(null);
        return;
      }
      const rangeError = validateRange(perc, MIN_PERCENTAGE, MAX_PERCENTAGE);
      if (rangeError !== true) {
        setError(typeof rangeError === 'string' ? rangeError : `Percentage must be between ${MIN_PERCENTAGE}% and ${MAX_PERCENTAGE}%`);
        setResult(null);
        return;
      }
    }

    // Both inputs valid - calculate using safeCalc
    if (v.trim() && p.trim() && val !== null && perc !== null) {
      const calculatedResult = safeCalc(D => D(val).mul(perc).div(100));
      
      if (calculatedResult === null) {
        setError("Calculation resulted in invalid number");
        setResult(null);
        return;
      }
      
      setResult(calculatedResult);
    } else {
      setResult(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Calculate Percentage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="value-input">Value</Label>
            <SafeNumberInput
              id="value-input"
              placeholder="Enter value..."
              value={value}
              onChange={(sanitized) => {
                setValue(sanitized);
                calculate(sanitized, percentage);
              }}
              sanitizeOptions={{ min: -MAX_VALUE, max: MAX_VALUE }}
              inputMode="decimal"
              aria-label="Value to calculate percentage of"
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "error-message" : undefined}
              className={error && value.trim() ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Max: {numberFormatter.format(MAX_VALUE)}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="percentage-input">Percentage</Label>
            <SafeNumberInput
              id="percentage-input"
              placeholder="Enter percentage..."
              value={percentage}
              onChange={(sanitized) => {
                setPercentage(sanitized);
                calculate(value, sanitized);
              }}
              sanitizeOptions={{ min: MIN_PERCENTAGE, max: MAX_PERCENTAGE }}
              inputMode="decimal"
              aria-label="Percentage to calculate"
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "error-message" : undefined}
              className={error && percentage.trim() ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Range: {MIN_PERCENTAGE}% to {MAX_PERCENTAGE}%
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div 
              id="error-message"
              className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {result !== null && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="text-center"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="text-3xl sm:text-4xl font-bold text-primary break-words px-2">
                {formatNumber(result, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </div>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground break-words px-2">
                {formatNumber(safeNumber(percentage, { min: MIN_PERCENTAGE, max: MAX_PERCENTAGE }) || 0, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}% of {formatNumber(safeNumber(value, { min: -MAX_VALUE, max: MAX_VALUE }) || 0, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} = {formatNumber(result, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Common Calculations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {value && percentage && !error && (() => {
              const val = safeNumber(value, { min: -MAX_VALUE, max: MAX_VALUE });
              const perc = safeNumber(percentage, { min: MIN_PERCENTAGE, max: MAX_PERCENTAGE });
              
              if (val === null || perc === null) return null;
              
              const addResult = safeCalc(D => D(val).mul(D(1).plus(D(perc).div(100))));
              const subtractResult = safeCalc(D => D(val).mul(D(1).minus(D(perc).div(100))));
              
              if (addResult === null || subtractResult === null) return null;
              
              return (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Add {formatNumber(perc, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%:</span>
                    <span className="font-medium">{formatNumber(addResult, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Subtract {formatNumber(perc, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%:</span>
                    <span className="font-medium">{formatNumber(subtractResult, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

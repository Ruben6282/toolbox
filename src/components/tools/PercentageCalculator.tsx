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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { sanitizeNumber } from "@/lib/security";

const MAX_VALUE = 1e12; // 1 trillion
const MIN_PERCENTAGE = -1000;
const MAX_PERCENTAGE = 1000;

/**
 * Safe numeric parser with validation and clamping
 */
function safeParseNumber(input: string, min: number = -MAX_VALUE, max: number = MAX_VALUE): number {
  if (!input || input.trim() === "") return 0;
  
  const raw = parseFloat(input);
  
  // Validate using security utility
  const sanitized = sanitizeNumber(raw, min, max);
  
  // sanitizeNumber returns null for invalid values
  if (sanitized === null) return 0;
  
  return sanitized;
}

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

    // Safe parsing with validation
    const val = safeParseNumber(v, -MAX_VALUE, MAX_VALUE);
    const perc = safeParseNumber(p, MIN_PERCENTAGE, MAX_PERCENTAGE);

    // Check for invalid input
    const rawVal = parseFloat(v);
    const rawPerc = parseFloat(p);

    if (v.trim() && (isNaN(rawVal) || !isFinite(rawVal))) {
      setError("Invalid value. Please enter a valid number.");
      setResult(null);
      return;
    }

    if (p.trim() && (isNaN(rawPerc) || !isFinite(rawPerc))) {
      setError("Invalid percentage. Please enter a valid number.");
      setResult(null);
      return;
    }

    // Check range violations
    if (v.trim() && (rawVal < -MAX_VALUE || rawVal > MAX_VALUE)) {
      setError(`Value must be between ${numberFormatter.format(-MAX_VALUE)} and ${numberFormatter.format(MAX_VALUE)}`);
      setResult(null);
      return;
    }

    if (p.trim() && (rawPerc < MIN_PERCENTAGE || rawPerc > MAX_PERCENTAGE)) {
      setError(`Percentage must be between ${MIN_PERCENTAGE}% and ${MAX_PERCENTAGE}%`);
      setResult(null);
      return;
    }

    // Both inputs valid - calculate
    if (v.trim() && p.trim()) {
      const calculatedResult = (val * perc) / 100;
      
      // Final sanity check on result
      if (!isFinite(calculatedResult)) {
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
            <Input
              id="value-input"
              type="number"
              placeholder="Enter value..."
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                calculate(e.target.value, percentage);
              }}
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
            <Input
              id="percentage-input"
              type="number"
              placeholder="Enter percentage..."
              value={percentage}
              onChange={(e) => {
                setPercentage(e.target.value);
                calculate(value, e.target.value);
              }}
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
                {numberFormatter.format(result)}
              </div>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground break-words px-2">
                {numberFormatter.format(safeParseNumber(percentage, MIN_PERCENTAGE, MAX_PERCENTAGE))}% of {numberFormatter.format(safeParseNumber(value, -MAX_VALUE, MAX_VALUE))} = {numberFormatter.format(result)}
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
              const val = safeParseNumber(value, -MAX_VALUE, MAX_VALUE);
              const perc = safeParseNumber(percentage, MIN_PERCENTAGE, MAX_PERCENTAGE);
              const addResult = val * (1 + perc / 100);
              const subtractResult = val * (1 - perc / 100);
              
              return (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Add {numberFormatter.format(perc)}%:</span>
                    <span className="font-medium">{numberFormatter.format(addResult)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Subtract {numberFormatter.format(perc)}%:</span>
                    <span className="font-medium">{numberFormatter.format(subtractResult)}</span>
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

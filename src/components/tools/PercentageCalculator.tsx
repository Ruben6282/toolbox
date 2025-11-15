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
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatNumber } from "@/lib/safe-math";
import { validateRange } from "@/lib/validators";
import { notify } from "@/lib/notify";

const MAX_VALUE = 1e12; // 1 trillion
const MIN_PERCENTAGE = -100;
const MAX_PERCENTAGE = 100;



export const PercentageCalculator = () => {
  const [value, setValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [calculated, setCalculated] = useState(false);
  const [errors, setErrors] = useState<{ value?: string; percentage?: string } | null>(null);
  const [snapshot, setSnapshot] = useState<{ val: number; perc: number } | null>(null);
  const [autoClamped, setAutoClamped] = useState<null | { field: "value" | "percentage"; clampedTo: string }>(null);



  // Localization formatter
  const numberFormatter = useMemo(() => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, []);

  const VALUE_MAX_LENGTH = String(MAX_VALUE).length; // characters allowed in value input
  const PERCENTAGE_MAX_LENGTH = Math.max(String(MIN_PERCENTAGE).length, String(MAX_PERCENTAGE).length);

  const validateAll = (v: string, p: string) => {
    const fieldErrors: { value?: string; percentage?: string } = {};

    // Require both fields
    if (!v.trim()) {
      fieldErrors.value = "Value is required.";
    }
    if (!p.trim()) {
      fieldErrors.percentage = "Percentage is required.";
    }

    const val = v.trim() ? safeNumber(v, { min: -MAX_VALUE, max: MAX_VALUE }) : null;
    const perc = p.trim() ? safeNumber(p, { min: MIN_PERCENTAGE, max: MAX_PERCENTAGE }) : null;

    if (v.trim()) {
      if (val === null) {
        fieldErrors.value = "Value must be a valid number without symbols or scientific notation.";
      } else {
        const rangeError = validateRange(val, -MAX_VALUE, MAX_VALUE);
        if (rangeError !== true) {
          fieldErrors.value = typeof rangeError === "string" ? rangeError : `Value must be between ${formatNumber(-MAX_VALUE)} and ${formatNumber(MAX_VALUE)}`;
        }
      }
    }

    if (p.trim()) {
      if (perc === null) {
        fieldErrors.percentage = "Percentage must be a valid number without symbols or scientific notation.";
      } else {
        const rangeError = validateRange(perc, MIN_PERCENTAGE, MAX_PERCENTAGE);
        if (rangeError !== true) {
          fieldErrors.percentage = typeof rangeError === "string" ? rangeError : `Percentage must be between ${MIN_PERCENTAGE}% and ${MAX_PERCENTAGE}%`;
        }
      }
    }

    return { ok: Object.keys(fieldErrors).length === 0, fieldErrors, val, perc } as const;
  };

  const onCalculate = () => {
    setErrors(null);
    setResult(null);
    setCalculated(false);

    const { ok, fieldErrors, val, perc } = validateAll(value, percentage);
    if (!ok) {
      setErrors(fieldErrors);
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    // val and perc are guaranteed non-null here
    if (val === null || perc === null) {
      setErrors({ value: "Value parsing error.", percentage: "Percentage parsing error." });
      notify.error("Parsing error. Please check inputs.");
      return;
    }

    const calculatedResult = safeCalc(D => D(val).mul(perc).div(100));
    if (calculatedResult === null || !isFinite(calculatedResult)) {
      setErrors({ value: "Calculation produced an invalid number." });
      notify.error("Calculation failed: invalid numeric result.");
      return;
    }

    setResult(calculatedResult);
    setCalculated(true);
    setSnapshot({ val, perc });
    notify.success("Calculation successful");
  };

  const onClear = () => {
    setValue("");
    setPercentage("");
    setResult(null);
    setCalculated(false);
    setErrors(null);
    setSnapshot(null);
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
                // Prevent extremely long input at the UI level
                const raw = sanitized.trim();
                // Try to parse raw numeric value (if possible)
                const n = raw === "" ? null : Number(raw);
                // If this onChange is the echo of our programmatic clamp, keep the error visible
                if (autoClamped?.field === "value" && sanitized === autoClamped.clampedTo) {
                  // do nothing: preserve clamped value and error until user edits
                  return;
                }

                if (n !== null && !Number.isNaN(n)) {
                  if (n > MAX_VALUE) {
                    const clamped = String(MAX_VALUE);
                    setErrors({ value: `Value exceeds maximum allowed value of ${formatNumber(MAX_VALUE)}` });
                    setValue(clamped);
                    setAutoClamped({ field: "value", clampedTo: clamped });
                    return;
                  }
                  if (n < -MAX_VALUE) {
                    const clamped = String(-MAX_VALUE);
                    setErrors({ value: `Value must be at least ${formatNumber(-MAX_VALUE)}` });
                    setValue(clamped);
                    setAutoClamped({ field: "value", clampedTo: clamped });
                    return;
                  }
                }

                // User manually changed value to something else -> clear autoClamped and errors
                if (autoClamped?.field === "value") {
                  setAutoClamped(null);
                }

                setErrors(null);
                setValue(sanitized);
              }}
              sanitizeOptions={{ min: -MAX_VALUE, max: MAX_VALUE, maxLength: VALUE_MAX_LENGTH, allowNegative: true, allowDecimal: true }}
              inputMode="decimal"
              aria-label="Value to calculate percentage of"
              aria-invalid={errors?.value ? "true" : "false"}
              aria-describedby={errors?.value ? "value-error-message" : undefined}
              className={errors?.value ? "border-red-500" : ""}
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
                const raw = sanitized.trim();
                const n = raw === "" ? null : Number(raw);
                // Preserve the clamp error if this is the echo of our programmatic clamp
                if (autoClamped?.field === "percentage" && sanitized === autoClamped.clampedTo) {
                  return;
                }

                if (n !== null && !Number.isNaN(n)) {
                  if (n > MAX_PERCENTAGE) {
                    const clamped = String(MAX_PERCENTAGE);
                    setErrors({ percentage: `Percentage must be less than or equal to ${MAX_PERCENTAGE}%` });
                    setPercentage(clamped);
                    setAutoClamped({ field: "percentage", clampedTo: clamped });
                    return;
                  }
                  if (n < MIN_PERCENTAGE) {
                    const clamped = String(MIN_PERCENTAGE);
                    setErrors({ percentage: `Percentage must be greater than or equal to ${MIN_PERCENTAGE}%` });
                    setPercentage(clamped);
                    setAutoClamped({ field: "percentage", clampedTo: clamped });
                    return;
                  }
                }

                if (autoClamped?.field === "percentage") {
                  setAutoClamped(null);
                }

                setErrors(null);
                setPercentage(sanitized);
              }}
              sanitizeOptions={{ min: MIN_PERCENTAGE, max: MAX_PERCENTAGE, maxLength: PERCENTAGE_MAX_LENGTH, allowNegative: true, allowDecimal: true }}
              inputMode="decimal"
              aria-label="Percentage to calculate"
              aria-invalid={errors?.percentage ? "true" : "false"}
              aria-describedby={errors?.percentage ? "percentage-error-message" : undefined}
              className={errors?.percentage ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Range: {MIN_PERCENTAGE}% to {MAX_PERCENTAGE}%
            </p>
          </div>

          {/* Field Error Display */}
          {errors && (
            <div
              id="error-message"
              className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  {errors.value && <div id="value-error-message">{errors.value}</div>}
                  {errors.percentage && <div id="percentage-error-message">{errors.percentage}</div>}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button className="w-full" variant="default" onClick={onCalculate}>Calculate</Button>
        <Button className="w-full" variant="outline" onClick={onClear}>Clear</Button>
      </div>

      {calculated && result !== null && (
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
                {formatNumber(snapshot?.perc ?? 0, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}% of {formatNumber(snapshot?.val ?? 0, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} = {formatNumber(result, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {calculated && result !== null && snapshot && (
        <Card>
          <CardHeader>
            <CardTitle>Common Calculations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {(() => {
                const val = snapshot.val;
                const perc = snapshot.perc;

                // Try safeCalc first, fall back to native math with clamping for extremely large values
                const addResultSafe = safeCalc(D => D(val).mul(D(1).plus(D(perc).div(100))));
                const subtractResultSafe = safeCalc(D => D(val).mul(D(1).minus(D(perc).div(100))));

                const MAX_SAFE_DISPLAY = 1e15; // upper display/clamp limit

                const addResult = addResultSafe !== null ? addResultSafe : (() => {
                  const n = val * (1 + perc / 100);
                  if (!isFinite(n) || Math.abs(n) > MAX_SAFE_DISPLAY) return null;
                  return n;
                })();

                const subtractResult = subtractResultSafe !== null ? subtractResultSafe : (() => {
                  const n = val * (1 - perc / 100);
                  if (!isFinite(n) || Math.abs(n) > MAX_SAFE_DISPLAY) return null;
                  return n;
                })();

                if (addResult === null && subtractResult === null) {
                  // Both results unavailable — show a helpful message instead of an empty block
                  return (
                    <div className="text-sm text-muted-foreground">Common calculations unavailable for the current values (result too large).</div>
                  );
                }

                return (
                  <>
                    {addResult !== null && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Add {formatNumber(perc, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%:</span>
                        <span className="font-medium">{formatNumber(addResult, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {subtractResult !== null && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Subtract {formatNumber(perc, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%:</span>
                        <span className="font-medium">{formatNumber(subtractResult, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

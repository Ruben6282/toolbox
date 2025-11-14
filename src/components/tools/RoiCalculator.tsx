/**
 * ROI Calculator - Enterprise-grade client-side ROI computation
 * Features:
 * - Explicit bounds (AMOUNT_MAX, TIME_YEARS_MAX)
 * - Input sanitization (sanitizeNumber) + scientific notation rejection
 * - Pristine state (no errors until user supplies required fields)
 * - Dependency guard (final value requires initial investment)
 * - Finite/NaN checks before rendering results
 * - Accessibility: aria-invalid, aria-describedby, role=alert, targeted aria-live
 * - Precision: 2-decimal rounding for amounts & percentages
 * - Pure validateAndComputeRoi() for isolated unit testing
 * IMPORTANT: Back-end must revalidate if persisting data. Deploy with CSP & rate limiting.
 */
import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Label } from "@/components/ui/label";
import { RotateCcw, AlertCircle } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatCurrency } from "@/lib/safe-math";
import { validateRange } from "@/lib/validators";

// Security bounds
const AMOUNT_MAX = 1e10; // $10,000,000,000
const TIME_YEARS_MAX = 200; // cap horizon to prevent extreme exponents

const AllowedTimeUnits = ["days", "months", "years"] as const;
type TimeUnit = typeof AllowedTimeUnits[number];

export type RoiComputation = {
  error: string | null;
  errorField: "initialInvestment" | "finalValue" | "additionalInvestments" | "timePeriod" | "timeUnit" | null;
  initialInvestment?: number;
  finalValue?: number;
  additionalInvestments?: number;
  timeYears?: number;
  timeUnit?: TimeUnit;
  totalInvested?: number;
  totalReturn?: number;
  roiPercent?: number; // simple ROI
  annualizedPercent?: number; // annualized ROI percent
};

// eslint-disable-next-line react-refresh/only-export-components
export function validateAndComputeRoi(params: {
  initialInvestment: string;
  finalValue: string;
  additionalInvestments: string;
  timePeriod: string;
  timeUnit: string;
}): RoiComputation {
  try {
    const { initialInvestment, finalValue, additionalInvestments, timePeriod, timeUnit } = params;

    // Validate timeUnit
    const tu = (timeUnit || "").trim();
    if (!AllowedTimeUnits.includes(tu as TimeUnit)) {
      return { error: "Invalid time unit.", errorField: "timeUnit" };
    }

    // Helper to validate and sanitize amounts
    const parseMoney = (
      rawStr: string,
      field: RoiComputation["errorField"],
      allowZero = true
    ): number | { error: string; errorField: RoiComputation["errorField"] } => {
      const trimmed = (rawStr || "").trim();
      if (trimmed === "") return 0; // treat empty as 0
      const san = safeNumber(trimmed, { min: 0, max: AMOUNT_MAX });
      if (san === null) {
        return { error: "Invalid number.", errorField: field };
      }
      const rangeError = validateRange(san, 0, AMOUNT_MAX);
      if (rangeError !== true) {
        return { error: typeof rangeError === 'string' ? rangeError : `Value must be between $0 and $${AMOUNT_MAX.toLocaleString()}.`, errorField: field };
      }
      if (!allowZero && san === 0) {
        return { error: "Value must be greater than 0.", errorField: field };
      }
      return san;
    };

  const initialProvided = (initialInvestment || "").trim() !== "";
  const finalProvided = (finalValue || "").trim() !== "";

  // Treat empty initial/final as pristine (no error) until user enters something
  const initialParsed = parseMoney(initialInvestment, "initialInvestment", true);
  if (typeof initialParsed !== "number") return initialParsed;
  const finalParsed = parseMoney(finalValue, "finalValue", true);
  if (typeof finalParsed !== "number") return finalParsed;
    const additionalParsed = parseMoney(additionalInvestments, "additionalInvestments", true);
    if (typeof additionalParsed !== "number") return additionalParsed;

    // Time value sanitization (raw number before unit conversion)
    const tTrim = (timePeriod || "").trim();
    let timeRaw = 0;
    if (tTrim !== "") {
      const sanTime = safeNumber(tTrim, { min: 0, max: TIME_YEARS_MAX * 365 });
      if (sanTime === null) {
        return { error: "Invalid time value.", errorField: "timePeriod" };
      }
      const rangeError = validateRange(sanTime, 0, TIME_YEARS_MAX * 365);
      if (rangeError !== true) {
        return { error: typeof rangeError === 'string' ? rangeError : "Time value out of range.", errorField: "timePeriod" };
      }
      timeRaw = sanTime;
    }

    // Convert to years
    let timeYears: number | null = 0;
    switch (tu as TimeUnit) {
      case "years":
        timeYears = timeRaw;
        break;
      case "months":
        timeYears = safeCalc(D => D(timeRaw).div(12));
        break;
      case "days":
        timeYears = safeCalc(D => D(timeRaw).div(365));
        break;
    }

    if (timeYears === null) {
      return { error: "Time conversion error.", errorField: "timePeriod" };
    }

    if (timeYears > TIME_YEARS_MAX) {
      return { error: `Time horizon too large (>${TIME_YEARS_MAX} years).`, errorField: "timePeriod" };
    }
    if (timeYears < 0) {
      return { error: "Time cannot be negative.", errorField: "timePeriod" };
    }

    // If neither initial nor final provided yet, return pristine empty result
    if (!initialProvided && !finalProvided) {
      return {
        error: null,
        errorField: null,
        initialInvestment: 0,
        finalValue: 0,
        additionalInvestments: additionalParsed,
        timeYears,
        timeUnit: tu as TimeUnit,
        totalInvested: 0,
        totalReturn: 0,
        roiPercent: 0,
        annualizedPercent: 0,
      };
    }

    // Dependency guard: final value requires initial investment
    if (finalProvided && !initialProvided) {
      return { error: "Provide initial investment before final value.", errorField: "initialInvestment" };
    }

    // Enforce >0 only if user has provided the field
    if (initialProvided && initialParsed <= 0) {
      return { error: "Initial investment must be greater than 0.", errorField: "initialInvestment" };
    }
    if (finalProvided && finalParsed <= 0) {
      return { error: "Final value must be greater than 0.", errorField: "finalValue" };
    }

    const totalInvested = safeCalc(D => D(initialParsed).plus(additionalParsed));

    if (totalInvested === null || totalInvested <= 0) {
      return { error: "Total invested must be greater than 0.", errorField: "initialInvestment" };
    }

    const totalReturn = safeCalc(D => D(finalParsed).minus(totalInvested));
    if (totalReturn === null) {
      return { error: "Calculation error: invalid numeric result.", errorField: null };
    }

    let roiPercent: number | null = 0;
    if (totalInvested > 0) {
      roiPercent = safeCalc(D => D(finalParsed).minus(totalInvested).div(totalInvested).mul(100));
    }

    if (roiPercent === null) {
      return { error: "Calculation error: invalid ROI result.", errorField: null };
    }

    // Annualized ROI only if timeYears > 0 and ratio > 0
    let annualizedPercent: number | null = 0;
    const ratio = safeCalc(D => D(finalParsed).div(totalInvested));
    if (ratio === null) {
      return { error: "Calculation error: invalid ratio.", errorField: null };
    }

    if (timeYears > 0 && ratio > 0) {
      const ear = safeCalc(D => D(ratio).pow(D(1).div(timeYears)).minus(1));
      if (ear === null) {
        return { error: "Calculation error: invalid annualized return.", errorField: null };
      }
      annualizedPercent = safeCalc(D => D(ear).mul(100));
    }

    if (annualizedPercent === null) {
      return { error: "Calculation error: invalid annualized result.", errorField: null };
    }

    return {
      error: null,
      errorField: null,
      initialInvestment: initialParsed,
      finalValue: finalParsed,
      additionalInvestments: additionalParsed,
      timeYears,
      timeUnit: tu as TimeUnit,
      totalInvested,
      totalReturn,
      roiPercent,
      annualizedPercent,
    };
  } catch (e) {
    console.error("RoiCalculator: Unexpected error", e);
    return { error: "Unexpected error occurred.", errorField: null };
  }
}

export const RoiCalculator = () => {
  const [initialInvestment, setInitialInvestment] = useState("");
  const [finalValue, setFinalValue] = useState("");
  const [additionalInvestments, setAdditionalInvestments] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("years");



  // Currency formatter
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const calc = useMemo(
    () =>
      validateAndComputeRoi({
        initialInvestment,
        finalValue,
        additionalInvestments,
        timePeriod,
        timeUnit,
      }),
    [initialInvestment, finalValue, additionalInvestments, timePeriod, timeUnit]
  );

  const clearAll = useCallback(() => {
    setInitialInvestment("");
    setFinalValue("");
    setAdditionalInvestments("");
    setTimePeriod("");
    setTimeUnit("years");
  }, []);

  const hasResults =
    !calc.error &&
    typeof calc.initialInvestment === "number" &&
    calc.initialInvestment > 0 &&
    typeof calc.finalValue === "number" &&
    calc.finalValue > 0;

  const roiColorClass = (roi: number) =>
    roi > 0 ? "text-green-600" : roi < 0 ? "text-red-600" : "text-gray-600";
  const roiBgClass = (roi: number) =>
    roi > 0 ? "bg-green-50 border-green-200" : roi < 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ROI Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial-investment">Initial Investment ($)</Label>
              <SafeNumberInput
                id="initial-investment"
                placeholder="0"
                value={initialInvestment}
                onChange={(sanitized) => setInitialInvestment(sanitized)}
                sanitizeOptions={{ min: 0, max: AMOUNT_MAX }}
                inputMode="decimal"
                aria-invalid={calc.errorField === "initialInvestment" ? "true" : "false"}
                aria-describedby={calc.errorField === "initialInvestment" ? "roi-error" : undefined}
                className={calc.errorField === "initialInvestment" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">Max: {currencyFormatter.format(AMOUNT_MAX)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="final-value">Final Value ($)</Label>
              <SafeNumberInput
                id="final-value"
                placeholder="0"
                value={finalValue}
                onChange={(sanitized) => setFinalValue(sanitized)}
                sanitizeOptions={{ min: 0, max: AMOUNT_MAX }}
                inputMode="decimal"
                aria-invalid={calc.errorField === "finalValue" ? "true" : "false"}
                aria-describedby={calc.errorField === "finalValue" ? "roi-error" : undefined}
                className={calc.errorField === "finalValue" ? "border-red-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional-investments">Additional Investments ($)</Label>
              <SafeNumberInput
                id="additional-investments"
                placeholder="0"
                value={additionalInvestments}
                onChange={(sanitized) => setAdditionalInvestments(sanitized)}
                sanitizeOptions={{ min: 0, max: AMOUNT_MAX }}
                inputMode="decimal"
                aria-invalid={calc.errorField === "additionalInvestments" ? "true" : "false"}
                aria-describedby={calc.errorField === "additionalInvestments" ? "roi-error" : undefined}
                className={calc.errorField === "additionalInvestments" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">Lump sum additional capital (optional)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-period">Time Period</Label>
              <div className="flex gap-2">
                <SafeNumberInput
                  id="time-period"
                  placeholder="0"
                  value={timePeriod}
                  onChange={(sanitized) => setTimePeriod(sanitized)}
                  sanitizeOptions={{ min: 0, max: TIME_YEARS_MAX * 365 }}
                  inputMode="decimal"
                  aria-invalid={calc.errorField === "timePeriod" ? "true" : "false"}
                  aria-describedby={calc.errorField === "timePeriod" ? "roi-error" : undefined}
                  className={`${calc.errorField === "timePeriod" ? "border-red-500" : ""} flex-1`}
                />
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
                  className="px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">Max horizon: {TIME_YEARS_MAX} years</p>
            </div>
          </div>

          <Button
            onClick={clearAll}
            variant="outline"
            className="w-full"
            aria-label="Clear all fields"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>

          {calc.error && (
            <div
              id="roi-error"
              className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{calc.error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle>ROI Calculation Results</CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 sm:p-6 rounded-lg border ${roiBgClass(calc.roiPercent!)}`}>
                <div className="text-center">
                  <div
                    className={`text-3xl sm:text-4xl font-bold ${roiColorClass(calc.roiPercent!)} mb-2 break-all`}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {calc.roiPercent! > 0 ? '+' : ''}{calc.roiPercent!.toFixed(2)}%
                  </div>
                  <div className="text-base sm:text-lg font-medium text-muted-foreground">Return on Investment</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600 break-all px-2" aria-live="polite" aria-atomic="true">
                    {formatCurrency(calc.totalInvested!)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Invested</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-xl sm:text-2xl font-bold ${roiColorClass(calc.totalReturn!)} break-all px-2`}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {calc.totalReturn! > 0 ? '+' : ''}{formatCurrency(calc.totalReturn!)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Return</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600 break-all px-2" aria-live="polite" aria-atomic="true">
                    {calc.annualizedPercent! > 0 ? '+' : ''}{calc.annualizedPercent!.toFixed(2)}%
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">Annualized ROI</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Investment Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Initial Investment:</span>
                      <span className="font-medium break-all text-right" aria-live="polite" aria-atomic="true">
                        {formatCurrency(calc.initialInvestment!)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Additional Investments:</span>
                      <span className="font-medium break-all text-right" aria-live="polite" aria-atomic="true">
                        {formatCurrency(calc.additionalInvestments!)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Total Invested:</span>
                      <span className="font-medium break-all text-right" aria-live="polite" aria-atomic="true">
                        {formatCurrency(calc.totalInvested!)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Final Value:</span>
                      <span className="font-medium break-all text-right" aria-live="polite" aria-atomic="true">
                        {formatCurrency(calc.finalValue!)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Total Return:</span>
                      <span className="font-medium break-all text-right" aria-live="polite" aria-atomic="true">
                        {calc.totalReturn! > 0 ? '+' : ''}{formatCurrency(calc.totalReturn!)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Time Period:</span>
                      <span className="font-medium break-all text-right" aria-live="polite" aria-atomic="true">
                        {calc.timeYears!.toFixed(2)} years ({timePeriod || '0'} {timeUnit})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Performance Analysis</h4>
                <div className="text-sm space-y-1">
                  {calc.roiPercent! > 0 ? (
                    <p className="text-green-700" aria-live="polite" aria-atomic="true">
                      ✅ Your investment has generated a <strong>{calc.roiPercent!.toFixed(2)}%</strong> return.
                    </p>
                  ) : calc.roiPercent! < 0 ? (
                    <p className="text-red-700" aria-live="polite" aria-atomic="true">
                      ❌ Your investment has lost <strong>{Math.abs(calc.roiPercent!).toFixed(2)}%</strong> of its value.
                    </p>
                  ) : (
                    <p className="text-gray-700" aria-live="polite" aria-atomic="true">
                      ⚪ Your investment has neither gained nor lost value.
                    </p>
                  )}
                  {calc.timeYears! > 0 && (
                    <p aria-live="polite" aria-atomic="true">
                      Annualized return: <strong>{calc.annualizedPercent!.toFixed(2)}%</strong> per year.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ROI Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• ROI measures the efficiency of an investment</li>
            <li>• Higher ROI indicates better performance relative to capital deployed</li>
            <li>• Annualized ROI enables comparison across different time spans</li>
            <li>• Include all transaction fees and taxes for accuracy</li>
            <li>• ROI doesn’t reflect risk or cashflow timing—consider other metrics</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

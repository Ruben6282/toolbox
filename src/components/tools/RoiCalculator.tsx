// RoiCalculator — Production-ready, aligned with Discount/Mortgage/Compound calculators

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Label } from "@/components/ui/label";
import { RotateCcw, AlertCircle } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatCurrency } from "@/lib/safe-math";
import { validateRange } from "@/lib/validators";
import { notify } from "@/lib/notify";

/* LIMITS */
const AMOUNT_MAX = 1e10; // $10,000,000,000
const TIME_YEARS_MAX = 200;

const AllowedTimeUnits = ["days", "months", "years"] as const;
type TimeUnit = (typeof AllowedTimeUnits)[number];

/* TYPES */
type RoiErrors = {
  initialInvestment?: string;
  finalValue?: string;
  additionalInvestments?: string;
  timePeriod?: string;
  timeUnit?: string;
};

type RoiResult = {
  initialInvestment: number;
  finalValue: number;
  additionalInvestments: number;
  timeYears: number;
  totalInvested: number;
  totalReturn: number;
  roiPercent: number;
  annualizedPercent: number;
};

export const RoiCalculator = () => {
  const [initialInvestment, setInitialInvestment] = useState("");
  const [finalValue, setFinalValue] = useState("");
  const [additionalInvestments, setAdditionalInvestments] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("years");

  const [errors, setErrors] = useState<RoiErrors>({});
  const [result, setResult] = useState<RoiResult | null>(null);
  const [calculated, setCalculated] = useState(false);

  /* Currency formatter */
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

  const clearFieldError = (field: keyof RoiErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next: RoiErrors = { ...prev, [field]: undefined };
      if (
        !next.initialInvestment &&
        !next.finalValue &&
        !next.additionalInvestments &&
        !next.timePeriod &&
        !next.timeUnit
      ) {
        return {};
      }
      return next;
    });
  };

  /* INPUT HANDLERS WITH UI CLAMP */

  const handleInitialChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (n > AMOUNT_MAX) {
        const msg = `Initial investment cannot exceed ${currencyFormatter.format(
          AMOUNT_MAX
        )}.`;
        setErrors({ initialInvestment: msg });
        setInitialInvestment(String(AMOUNT_MAX));
        return;
      }
      if (n < 0) {
        const msg = "Initial investment cannot be negative.";
        setErrors({ initialInvestment: msg });
        setInitialInvestment("0");
        return;
      }
    }

    const initMaxMsg = `Initial investment cannot exceed ${currencyFormatter.format(
      AMOUNT_MAX
    )}.`;
    if (n === AMOUNT_MAX && errors.initialInvestment === initMaxMsg) {
      setInitialInvestment(val);
      return;
    }

    setErrors({});
    setInitialInvestment(val);
  };

  const handleFinalChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (n > AMOUNT_MAX) {
        const msg = `Final value cannot exceed ${currencyFormatter.format(
          AMOUNT_MAX
        )}.`;
        setErrors({ finalValue: msg });
        setFinalValue(String(AMOUNT_MAX));
        return;
      }
      if (n < 0) {
        const msg = "Final value cannot be negative.";
        setErrors({ finalValue: msg });
        setFinalValue("0");
        return;
      }
    }

    const finalMaxMsg = `Final value cannot exceed ${currencyFormatter.format(
      AMOUNT_MAX
    )}.`;
    if (n === AMOUNT_MAX && errors.finalValue === finalMaxMsg) {
      setFinalValue(val);
      return;
    }

    setErrors({});
    setFinalValue(val);
  };

  const handleAdditionalChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (n > AMOUNT_MAX) {
        const msg = `Additional investments cannot exceed ${currencyFormatter.format(
          AMOUNT_MAX
        )}.`;
        setErrors({ additionalInvestments: msg });
        setAdditionalInvestments(String(AMOUNT_MAX));
        return;
      }
      if (n < 0) {
        const msg = "Additional investments cannot be negative.";
        setErrors({ additionalInvestments: msg });
        setAdditionalInvestments("0");
        return;
      }
    }

    const addMaxMsg = `Additional investments cannot exceed ${currencyFormatter.format(
      AMOUNT_MAX
    )}.`;
    if (n === AMOUNT_MAX && errors.additionalInvestments === addMaxMsg) {
      setAdditionalInvestments(val);
      return;
    }

    setErrors({});
    setAdditionalInvestments(val);
  };

  const handleTimeChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    let maxForUnit = TIME_YEARS_MAX;
    switch (timeUnit) {
      case "years":
        maxForUnit = TIME_YEARS_MAX;
        break;
      case "months":
        maxForUnit = TIME_YEARS_MAX * 12;
        break;
      case "days":
        maxForUnit = TIME_YEARS_MAX * 365;
        break;
    }

    if (n !== null && !Number.isNaN(n)) {
      if (n < 0) {
        setErrors({ timePeriod: "Time period cannot be negative." });
        setTimePeriod("0");
        return;
      }
      if (n > maxForUnit) {
        setErrors({
          timePeriod: `Time period cannot exceed ${TIME_YEARS_MAX} years in total.`,
        });
        setTimePeriod(String(maxForUnit));
        return;
      }
    }

    clearFieldError("timePeriod");
    setTimePeriod(val);
  };

  const handleTimeUnitChange = (unit: TimeUnit) => {
    setTimeUnit(unit);
    // Re-validate current time value against new unit
    if (timePeriod.trim()) {
      handleTimeChange(timePeriod);
    }
    clearFieldError("timeUnit");
  };

  /* MAIN CALCULATE HANDLER */

  const onCalculate = () => {
    setCalculated(false);
    setResult(null);

    const newErrors: RoiErrors = {};

    // Required presence checks (only actually required fields)
    if (!initialInvestment.trim()) {
      newErrors.initialInvestment = "Initial investment is required.";
    }
    if (!finalValue.trim()) {
      newErrors.finalValue = "Final value is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    // Parse with safeNumber
    const initialNum = safeNumber(initialInvestment, { min: 0, max: AMOUNT_MAX });
    const finalNum = safeNumber(finalValue, { min: 0, max: AMOUNT_MAX });

    const additionalTrim = additionalInvestments.trim();
    const additionalNum =
      additionalTrim === ""
        ? 0
        : safeNumber(additionalInvestments, { min: 0, max: AMOUNT_MAX });

    // Time: optional
    const timeTrim = timePeriod.trim();
    let timeYears = 0;

    // Validate initial
    if (initialNum === null) {
      newErrors.initialInvestment = `Initial investment must be between 0 and ${currencyFormatter.format(
        AMOUNT_MAX
      )}.`;
    } else {
      const range = validateRange(initialNum, 0, AMOUNT_MAX);
      if (range !== true) {
        newErrors.initialInvestment =
          typeof range === "string"
            ? range
            : `Initial investment must be between 0 and ${currencyFormatter.format(
                AMOUNT_MAX
              )}.`;
      } else if (initialNum <= 0) {
        newErrors.initialInvestment = "Initial investment must be greater than 0.";
      }
    }

    // Validate final value
    if (finalNum === null) {
      newErrors.finalValue = `Final value must be between 0 and ${currencyFormatter.format(
        AMOUNT_MAX
      )}.`;
    } else {
      const range = validateRange(finalNum, 0, AMOUNT_MAX);
      if (range !== true) {
        newErrors.finalValue =
          typeof range === "string"
            ? range
            : `Final value must be between 0 and ${currencyFormatter.format(
                AMOUNT_MAX
              )}.`;
      }
    }

    // Additional investments (optional)
    if (additionalTrim !== "" && additionalNum === null) {
      newErrors.additionalInvestments = `Additional investments must be between 0 and ${currencyFormatter.format(
        AMOUNT_MAX
      )}.`;
    } else if (additionalNum !== null && additionalNum! > AMOUNT_MAX) {
      newErrors.additionalInvestments = `Additional investments must be between 0 and ${currencyFormatter.format(
        AMOUNT_MAX
      )}.`;
    }

    // Time (optional)
    if (timeTrim !== "") {
      let maxForUnit = TIME_YEARS_MAX;
      switch (timeUnit) {
        case "years":
          maxForUnit = TIME_YEARS_MAX;
          break;
        case "months":
          maxForUnit = TIME_YEARS_MAX * 12;
          break;
        case "days":
          maxForUnit = TIME_YEARS_MAX * 365;
          break;
      }

      const timeRaw = safeNumber(timePeriod, { min: 0, max: maxForUnit });
      if (timeRaw === null) {
        newErrors.timePeriod = `Time period must be between 0 and ${maxForUnit} ${timeUnit}.`;
      } else {
        switch (timeUnit) {
          case "years":
            timeYears = timeRaw;
            break;
          case "months":
            timeYears = safeCalc((D) => D(timeRaw).div(12)) ?? timeRaw / 12;
            break;
          case "days":
            timeYears = safeCalc((D) => D(timeRaw).div(365)) ?? timeRaw / 365;
            break;
        }

        if (timeYears < 0) {
          newErrors.timePeriod = "Time period cannot be negative.";
        } else if (timeYears > TIME_YEARS_MAX) {
          newErrors.timePeriod = `Time horizon cannot exceed ${TIME_YEARS_MAX} years.`;
        }
      }
    } else {
      timeYears = 0;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    // At this point, numbers are valid
    const initial = initialNum!;
    const final = finalNum!;
    const additional = additionalNum ?? 0;

    const totalInvested =
      safeCalc((D) => D(initial).plus(additional)) ?? initial + additional;

    if (totalInvested <= 0 || !Number.isFinite(totalInvested)) {
      setErrors({
        initialInvestment: "Total invested must be greater than 0.",
      });
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    const totalReturn =
      safeCalc((D) => D(final).minus(totalInvested)) ??
      (final - totalInvested);

    const roiPercent =
      totalInvested !== 0
        ? safeCalc((D) =>
            D(totalReturn).div(totalInvested).mul(100)
          ) ?? ((totalReturn / totalInvested) * 100)
        : 0;

    // Annualized ROI (optional, only if timeYears > 0 and ratio > 0)
    let annualizedPercent = 0;
    const ratio =
      totalInvested !== 0
        ? safeCalc((D) => D(final).div(totalInvested)) ??
          final / totalInvested
        : 0;

    if (
      timeYears > 0 &&
      ratio > 0 &&
      timeYears <= TIME_YEARS_MAX &&
      timeYears >= 0.01 && // guard against absurd exponents
      ratio <= 1e6 // guard against extreme growth ratios
    ) {
      const ear = safeCalc((D) =>
        D(ratio).pow(D(1).div(timeYears)).minus(1)
      );
      if (ear !== null && Number.isFinite(ear)) {
        annualizedPercent =
          safeCalc((D) => D(ear).mul(100)) ?? ear * 100;
      }
      // If ear is null/invalid, we silently fall back to 0 annualizedPercent
    }

    setErrors({});
    setResult({
      initialInvestment: initial,
      finalValue: final,
      additionalInvestments: additional,
      timeYears,
      totalInvested,
      totalReturn,
      roiPercent,
      annualizedPercent,
    });

    setCalculated(true);
    notify.success("ROI calculation completed.");
  };

  const onClear = () => {
    setInitialInvestment("");
    setFinalValue("");
    setAdditionalInvestments("");
    setTimePeriod("");
    setTimeUnit("years");
    setErrors({});
    setResult(null);
    setCalculated(false);
  };

  const hasError = Boolean(
    errors.initialInvestment ||
      errors.finalValue ||
      errors.additionalInvestments ||
      errors.timePeriod ||
      errors.timeUnit
  );

  const roiColorClass = (roi: number) =>
    roi > 0 ? "text-green-600" : roi < 0 ? "text-red-600" : "text-gray-600";

  const roiBgClass = (roi: number) =>
    roi > 0
      ? "bg-green-50 border-green-200"
      : roi < 0
      ? "bg-red-50 border-red-200"
      : "bg-gray-50 border-gray-200";

  const showResults = calculated && result && !hasError;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ROI Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* INPUT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Initial Investment (required) */}
            <div className="space-y-2">
              <Label htmlFor="initial-investment">Initial Investment ($)</Label>
              <SafeNumberInput
                id="initial-investment"
                placeholder="0"
                value={initialInvestment}
                onChange={handleInitialChange}
                sanitizeOptions={{
                  min: 0,
                  max: AMOUNT_MAX,
                  allowDecimal: true,
                  maxLength: String(AMOUNT_MAX).length,
                }}
                inputMode="decimal"
                aria-invalid={errors.initialInvestment ? "true" : "false"}
                aria-describedby={
                  errors.initialInvestment ? "roi-initial-err" : undefined
                }
                className={errors.initialInvestment ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Max: {currencyFormatter.format(AMOUNT_MAX)}
              </p>
            </div>

            {/* Final Value (required) */}
            <div className="space-y-2">
              <Label htmlFor="final-value">Final Value ($)</Label>
              <SafeNumberInput
                id="final-value"
                placeholder="0"
                value={finalValue}
                onChange={handleFinalChange}
                sanitizeOptions={{
                  min: 0,
                  max: AMOUNT_MAX,
                  allowDecimal: true,
                  maxLength: String(AMOUNT_MAX).length,
                }}
                inputMode="decimal"
                aria-invalid={errors.finalValue ? "true" : "false"}
                aria-describedby={
                  errors.finalValue ? "roi-final-err" : undefined
                }
                className={errors.finalValue ? "border-red-500" : ""}
              />
            </div>

            {/* Additional Investments (optional) */}
            <div className="space-y-2">
              <Label htmlFor="additional-investments">
                Additional Investments ($)
              </Label>
              <SafeNumberInput
                id="additional-investments"
                placeholder="0"
                value={additionalInvestments}
                onChange={handleAdditionalChange}
                sanitizeOptions={{
                  min: 0,
                  max: AMOUNT_MAX,
                  allowDecimal: true,
                  maxLength: String(AMOUNT_MAX).length,
                }}
                inputMode="decimal"
                aria-invalid={errors.additionalInvestments ? "true" : "false"}
                aria-describedby={
                  errors.additionalInvestments ? "roi-additional-err" : undefined
                }
                className={errors.additionalInvestments ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Lump sum additional capital (optional)
              </p>
            </div>

            {/* Time Period (optional) */}
            <div className="space-y-2">
              <Label htmlFor="time-period">Time Period (Optional)</Label>
              <div className="flex gap-2">
                <SafeNumberInput
                  id="time-period"
                  placeholder="0"
                  value={timePeriod}
                  onChange={handleTimeChange}
                  sanitizeOptions={{
                    min: 0,
                    max: TIME_YEARS_MAX * 365,
                    allowDecimal: true,
                    maxLength: 8,
                  }}
                  inputMode="decimal"
                  aria-invalid={errors.timePeriod ? "true" : "false"}
                  aria-describedby={
                    errors.timePeriod ? "roi-time-err" : undefined
                  }
                  className={`flex-1 ${
                    errors.timePeriod ? "border-red-500" : ""
                  }`}
                />
                <select
                  value={timeUnit}
                  onChange={(e) =>
                    handleTimeUnitChange(e.target.value as TimeUnit)
                  }
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  aria-label="Time unit"
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Max horizon: {TIME_YEARS_MAX} years
              </p>
            </div>
          </div>

          {/* ERRORS */}
          {(errors.initialInvestment ||
            errors.finalValue ||
            errors.additionalInvestments ||
            errors.timePeriod ||
            errors.timeUnit) && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              <div className="space-y-1">
                {errors.initialInvestment && (
                  <div id="roi-initial-err">{errors.initialInvestment}</div>
                )}
                {errors.finalValue && (
                  <div id="roi-final-err">{errors.finalValue}</div>
                )}
                {errors.additionalInvestments && (
                  <div id="roi-additional-err">
                    {errors.additionalInvestments}
                  </div>
                )}
                {errors.timePeriod && (
                  <div id="roi-time-err">{errors.timePeriod}</div>
                )}
                {errors.timeUnit && <div>{errors.timeUnit}</div>}
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={onCalculate} className="w-full">
              Calculate
            </Button>
            <Button
              onClick={onClear}
              variant="outline"
              className="w-full"
              aria-label="Clear all fields"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULTS */}
      {showResults && result && (
        <Card>
          <CardHeader>
            <CardTitle>ROI Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" aria-live="polite">
            {/* ROI headline */}
            <div
              className={`p-4 sm:p-6 rounded-lg border ${roiBgClass(
                result.roiPercent
              )}`}
            >
              <div className="text-center">
                <div
                  className={`text-3xl sm:text-4xl font-bold ${roiColorClass(
                    result.roiPercent
                  )} mb-2 break-all`}
                >
                  {result.roiPercent > 0 ? "+" : ""}
                  {result.roiPercent.toFixed(2)}%
                </div>
                <div className="text-base sm:text-lg font-medium text-muted-foreground">
                  Return on Investment
                </div>
              </div>
            </div>

            {/* Key figures */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 break-all px-2">
                  {formatCurrency(result.totalInvested)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Total Invested
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`text-xl sm:text-2xl font-bold ${roiColorClass(
                    result.totalReturn
                  )} break-all px-2`}
                >
                  {result.totalReturn > 0 ? "+" : ""}
                  {formatCurrency(result.totalReturn)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Total Return
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-600 break-all px-2">
                  {result.annualizedPercent > 0 ? "+" : ""}
                  {result.annualizedPercent.toFixed(2)}%
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Annualized ROI
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <h4 className="font-semibold">Investment Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">
                      Initial Investment:
                    </span>
                    <span className="font-medium break-all text-right">
                      {formatCurrency(result.initialInvestment)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">
                      Additional Investments:
                    </span>
                    <span className="font-medium break-all text-right">
                      {formatCurrency(result.additionalInvestments)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">
                      Total Invested:
                    </span>
                    <span className="font-medium break-all text-right">
                      {formatCurrency(result.totalInvested)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">
                      Final Value:
                    </span>
                    <span className="font-medium break-all text-right">
                      {formatCurrency(result.finalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">
                      Total Return:
                    </span>
                    <span className="font-medium break-all text-right">
                      {result.totalReturn > 0 ? "+" : ""}
                      {formatCurrency(result.totalReturn)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">
                      Time Period:
                    </span>
                    <span className="font-medium break-all text-right">
                      {result.timeYears.toFixed(2)} years
                      {timePeriod
                        ? ` (${timePeriod} ${timeUnit})`
                        : " (no period specified)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance analysis */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Performance Analysis</h4>
              <div className="text-sm space-y-1">
                {result.roiPercent > 0 ? (
                  <p className="text-green-700">
                    ✅ Your investment has generated a{" "}
                    <strong>{result.roiPercent.toFixed(2)}%</strong> return.
                  </p>
                ) : result.roiPercent < 0 ? (
                  <p className="text-red-700">
                    ❌ Your investment has lost{" "}
                    <strong>{Math.abs(result.roiPercent).toFixed(2)}%</strong> of
                    its value.
                  </p>
                ) : (
                  <p className="text-gray-700">
                    ⚪ Your investment has neither gained nor lost value.
                  </p>
                )}
                {result.timeYears > 0 && (
                  <p>
                    Annualized return:{" "}
                    <strong>{result.annualizedPercent.toFixed(2)}%</strong> per
                    year.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TIPS */}
      <Card>
        <CardHeader>
          <CardTitle>ROI Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• ROI measures the efficiency of an investment.</li>
            <li>
              • Higher ROI indicates better performance relative to capital
              deployed.
            </li>
            <li>
              • Annualized ROI enables comparison across different time spans.
            </li>
            <li>• Include all transaction fees and taxes for accuracy.</li>
            <li>
              • ROI doesn’t reflect risk or cashflow timing—consider other
              metrics too.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

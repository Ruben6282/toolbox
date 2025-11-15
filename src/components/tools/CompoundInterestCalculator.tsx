// CompoundInterestCalculator — Production-Ready Version
// Matches DiscountCalculator UX, error system, input handling, safety, & consistency.

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, RotateCcw } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatCurrency } from "@/lib/safe-math";
import { validateRange } from "@/lib/validators";
import { notify } from "@/lib/notify";

/* CONSTANTS */
const AMOUNT_MAX = 1e10; // $10,000,000,000
const RATE_MIN = 0;
const RATE_MAX = 100;
const TIME_MAX_YEARS = 200;

/* ENUMS */
const AllowedTimeUnits = ["days", "weeks", "months", "years"] as const;
type TimeUnit = typeof AllowedTimeUnits[number];

const AllowedFrequencies = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "semi-annually",
  "annually",
] as const;
type Frequency = typeof AllowedFrequencies[number];

const FREQ_MAP: Record<Frequency, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  "semi-annually": 2,
  annually: 1,
};

/* ERROR TYPE */
type CompoundErrors = {
  principal?: string;
  interestRate?: string;
  time?: string;
  additional?: string;
};

/* RESULT TYPE */
type CIResult = {
  principal: number;
  rate: number;
  years: number;
  compoundAmount: number;
  contribFV: number;
  finalAmount: number;
  totalContributions: number;
  totalInterest: number;
  effectiveAnnualRate: number;
};

export const CompoundInterestCalculator = () => {
  /* FORM STATE */
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [time, setTime] = useState("");
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("years");
  const [compoundingFrequency, setCompoundingFrequency] =
    useState<Frequency>("annually");
  const [additional, setAdditional] = useState("");
  const [contributionFrequency, setContributionFrequency] =
    useState<Frequency>("monthly");

  const [errors, setErrors] = useState<CompoundErrors>({});
  const [result, setResult] = useState<CIResult | null>(null);
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

  /* ----------------------------------------
   * INPUT HANDLERS — Clamp like DiscountCalc
   * ---------------------------------------- */

  const clampNumber = (
    val: string,
    min: number,
    max: number,
    field: keyof CompoundErrors,
    label: string
  ) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (n > max) {
        setErrors({
          [field]: `${label} cannot exceed ${formatCurrency(max)}.`,
        });
        return String(max);
      }
      if (n < min) {
        setErrors({
          [field]: `${label} cannot be less than ${min}.`,
        });
        return String(min);
      }
    }

    // Clear error if this field was previously in error
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev, [field]: undefined };
      if (!next.principal && !next.interestRate && !next.time && !next.additional)
        return {};
      return next;
    });

    return val;
  };

  const handlePrincipal = (v: string) =>
    setPrincipal(
      clampNumber(v, 0, AMOUNT_MAX, "principal", "Initial investment")
    );

  const handleInterestRate = (v: string) =>
    setInterestRate(
      clampNumber(v, RATE_MIN, RATE_MAX, "interestRate", "Interest rate")
    );

  const handleTime = (v: string) => {
    const raw = v.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n) && n < 0) {
      setErrors({ time: "Time cannot be negative." });
      return;
    }

    // No UI clamp for upper bound; enforced after unit conversion
    setErrors((prev) => {
      if (!prev.time) return prev;
      const next = { ...prev, time: undefined };
      return Object.values(next).every((x) => !x) ? {} : next;
    });

    setTime(v);
  };

  const handleAdditional = (v: string) =>
    setAdditional(
      clampNumber(v, 0, AMOUNT_MAX, "additional", "Contribution amount")
    );

  /* ----------------------------------------
   * CALCULATE BUTTON HANDLER
   * ---------------------------------------- */

  const onCalculate = () => {
    setCalculated(false);
    setResult(null);

    const newErrors: CompoundErrors = {};

    // Required: interest rate
    if (!interestRate.trim()) {
      newErrors.interestRate = "Interest rate is required.";
    }

    // Required: time
    if (!time.trim()) {
      newErrors.time = "Time value is required.";
    }

    // Required: at least one: principal OR additional contributions
    if (!principal.trim() && !additional.trim()) {
      newErrors.principal =
        "Enter a principal or a contribution amount to calculate compound interest.";
      newErrors.additional =
        "Enter a principal or a contribution amount to calculate compound interest.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    /* Parse numbers */
    const pNum = safeNumber(principal, { min: 0, max: AMOUNT_MAX }) ?? 0;
    const rNum = safeNumber(interestRate, { min: RATE_MIN, max: RATE_MAX });
    const tNum = safeNumber(time);
    const aNum = safeNumber(additional, { min: 0, max: AMOUNT_MAX }) ?? 0;

    if (rNum === null) {
      newErrors.interestRate = `Interest rate must be between ${RATE_MIN}% and ${RATE_MAX}%.`;
    }

    if (tNum === null || tNum < 0) {
      newErrors.time = "Time must be a valid non-negative number.";
    }

    if (pNum === null) {
      newErrors.principal = `Principal must be between 0 and ${formatCurrency(
        AMOUNT_MAX
      )}`;
    }

    if (aNum === null) {
      newErrors.additional = `Contribution must be between 0 and ${formatCurrency(
        AMOUNT_MAX
      )}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    /* Convert time to years */
    let years = 0;
    switch (timeUnit) {
      case "years":
        years = tNum!;
        break;
      case "months":
        years = tNum! / 12;
        break;
      case "weeks":
        years = tNum! / 52;
        break;
      case "days":
        years = tNum! / 365;
        break;
    }

    if (years > TIME_MAX_YEARS) {
      setErrors({
        time: `Time cannot exceed ${TIME_MAX_YEARS} years.`,
      });
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    const n = FREQ_MAP[compoundingFrequency];
    const rn = FREQ_MAP[contributionFrequency];
    const r = rNum! / 100;

    /* -------------------------
     * SAFE CALCULATIONS
     * (with JS Math fallback so
     * valid inputs never fail)
     * ------------------------- */

    // Principal FV
    let compoundAmount = pNum;
    if (r !== 0 && pNum > 0 && years > 0) {
      let out = safeCalc((D) =>
        D(1).plus(D(r).div(n)).pow(D(n).mul(years)).mul(pNum)
      );

      if (out === null) {
        // Fallback to plain JS math
        const base = 1 + r / n;
        const exp = n * years;
        const jsVal = pNum * Math.pow(base, exp);
        out = Number.isFinite(jsVal) ? jsVal : pNum;
      }

      compoundAmount = out;
    }

    // Contributions FV
    let contribFV = 0;
    const periods = rn * years;
    const ratePerPeriod = r / rn;

    if (aNum > 0 && periods > 0) {
      if (ratePerPeriod === 0) {
        contribFV = aNum * periods;
      } else {
        let out = safeCalc((D) => {
          const growth = D(1).plus(ratePerPeriod).pow(periods);
          return D(aNum).mul(growth.minus(1).div(ratePerPeriod));
        });

        if (out === null) {
          const base = 1 + ratePerPeriod;
          const jsGrowth = Math.pow(base, periods);
          const jsVal =
            (Number.isFinite(jsGrowth) ? jsGrowth - 1 : 0) /
            ratePerPeriod *
            aNum;
          out = Number.isFinite(jsVal) ? jsVal : 0;
        }

        contribFV = out;
      }
    }

    // Totals
    const finalAmount = compoundAmount + contribFV;
    const totalContributions = pNum + aNum * periods;
    const totalInterest = finalAmount - totalContributions;

    const effectiveAnnualRate =
      years > 0 && totalContributions > 0
        ? ((finalAmount / totalContributions) ** (1 / years) - 1) * 100
        : 0;

    // Everything valid — save result
    setErrors({});
    setResult({
      principal: pNum,
      rate: rNum!,
      years,
      compoundAmount,
      contribFV,
      finalAmount,
      totalContributions,
      totalInterest,
      effectiveAnnualRate,
    });
    setCalculated(true);
    notify.success("Compound interest calculation completed.");
  };

  /* CLEAR */
  const onClear = () => {
    setPrincipal("");
    setInterestRate("");
    setTime("");
    setTimeUnit("years");
    setCompoundingFrequency("annually");
    setAdditional("");
    setContributionFrequency("monthly");
    setErrors({});
    setResult(null);
    setCalculated(false);
  };

  const hasError = Boolean(
    errors.principal || errors.interestRate || errors.time || errors.additional
  );

  /* ----------------------------------------
   * RENDER
   * ---------------------------------------- */
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compound Interest Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Principal (optional, but one of principal/additional required) */}
            <div className="space-y-2">
              <Label>Initial Investment ($)</Label>
              <SafeNumberInput
                value={principal}
                onChange={handlePrincipal}
                placeholder="0"
                sanitizeOptions={{ min: 0, max: AMOUNT_MAX }}
                aria-invalid={errors.principal ? "true" : "false"}
                className={errors.principal ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Max: {currencyFormatter.format(AMOUNT_MAX)}
              </p>
            </div>

            {/* Interest Rate (required) */}
            <div className="space-y-2">
              <Label>Annual Interest Rate (%)</Label>
              <SafeNumberInput
                value={interestRate}
                onChange={handleInterestRate}
                placeholder="0.00"
                sanitizeOptions={{ min: RATE_MIN, max: RATE_MAX }}
                aria-invalid={errors.interestRate ? "true" : "false"}
                className={errors.interestRate ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Range: {RATE_MIN}% – {RATE_MAX}%
              </p>
            </div>

            {/* Time (required) */}
            <div className="space-y-2">
              <Label>Time</Label>
              <SafeNumberInput
                value={time}
                onChange={handleTime}
                placeholder="0"
                aria-invalid={errors.time ? "true" : "false"}
                className={errors.time ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Max horizon: {TIME_MAX_YEARS} years
              </p>
            </div>

            {/* Time Unit (optional selector) */}
            <div className="space-y-2">
              <Label>Time Unit</Label>
              <Select value={timeUnit} onValueChange={(v) => setTimeUnit(v as TimeUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AllowedTimeUnits.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u[0].toUpperCase() + u.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compounding Frequency (optional selector) */}
            <div className="space-y-2">
              <Label>Compounding Frequency</Label>
              <Select
                value={compoundingFrequency}
                onValueChange={(v) => setCompoundingFrequency(v as Frequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AllowedFrequencies.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Contributions (optional, but one of principal/additional required) */}
            <div className="space-y-2">
              <Label>Additional Contributions ($)</Label>
              <SafeNumberInput
                value={additional}
                onChange={handleAdditional}
                placeholder="0"
                sanitizeOptions={{ min: 0, max: AMOUNT_MAX }}
                aria-invalid={errors.additional ? "true" : "false"}
                className={errors.additional ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Max per period: {currencyFormatter.format(AMOUNT_MAX)}
              </p>
            </div>

            {/* Contribution Frequency (optional selector) */}
            <div className="space-y-2">
              <Label>Contribution Frequency</Label>
              <Select
                value={contributionFrequency}
                onValueChange={(v) => setContributionFrequency(v as Frequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AllowedFrequencies.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ERRORS */}
          {hasError && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              <div className="space-y-1">
                {errors.principal && <div>{errors.principal}</div>}
                {errors.interestRate && <div>{errors.interestRate}</div>}
                {errors.time && <div>{errors.time}</div>}
                {errors.additional && <div>{errors.additional}</div>}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={onCalculate} className="w-full">
              Calculate
            </Button>
            <Button onClick={onClear} className="w-full" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" /> Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULTS */}
      {calculated && result && !hasError && (
        <Card>
          <CardHeader>
            <CardTitle>Compound Interest Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" aria-live="polite">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 break-all">
                  {formatCurrency(result.finalAmount)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Final Amount
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 break-all">
                  {formatCurrency(result.totalInterest)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total Interest
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 break-all">
                  {formatCurrency(result.totalContributions)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total Contributions
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p>
                • Portfolio growth:{" "}
                <strong>
                  {(
                    ((result.finalAmount / result.totalContributions - 1) *
                      100) || 0
                  ).toFixed(1)}
                  %
                </strong>
              </p>
              <p>
                • Effective annual rate:{" "}
                <strong>{result.effectiveAnnualRate.toFixed(2)}%</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Compound Interest Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Start early — time is the strongest growth multiplier.</li>
            <li>• Regular contributions dramatically boost returns.</li>
            <li>• Higher compounding frequency increases effective yield.</li>
            <li>• Review your investment strategy periodically.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, RotateCcw } from "lucide-react";
import { sanitizeNumber } from "@/lib/security";

// Security bounds and allowed values
const AMOUNT_MAX = 1e10; // $10,000,000,000
const RATE_MIN = 0;
const RATE_MAX = 100; // 100% APR max
const TIME_YEARS_MIN = 0; // allow 0 to render empty results
const TIME_YEARS_MAX = 200; // safety cap to avoid huge exponents

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
  "daily": 365,
  "weekly": 52,
  "monthly": 12,
  "quarterly": 4,
  "semi-annually": 2,
  "annually": 1,
};

export type CompoundComputation = {
  error: string | null;
  errorField: "principal" | "interestRate" | "time" | "timeUnit" | "compoundingFrequency" | "additionalContributions" | "contributionFrequency" | null;
  // Echoed validated inputs
  principal?: number;
  interestRate?: number; // percent per year
  timeInYears?: number;
  timeUnit?: TimeUnit;
  compoundingFrequency?: Frequency;
  additional?: number;
  contributionFrequency?: Frequency;
  // Derived outputs
  periods?: number; // contribution periods
  compoundingPeriodsPerYear?: number; // n
  compoundAmount?: number; // FV of principal only
  contributionValue?: number; // FV of contributions stream
  finalAmount?: number; // total FV
  totalContributions?: number; // principal + sum of contributions
  totalInterest?: number; // final - totalContributions
  effectiveAnnualRate?: number; // percent
};

// eslint-disable-next-line react-refresh/only-export-components
export function validateAndComputeCompoundInterest(params: {
  principal: string;
  interestRate: string;
  time: string;
  timeUnit: string;
  compoundingFrequency: string;
  additionalContributions: string;
  contributionFrequency: string;
}): CompoundComputation {
  try {
    const {
      principal,
      interestRate,
      time,
      timeUnit,
      compoundingFrequency,
      additionalContributions,
      contributionFrequency,
    } = params;

    // Validate enums first
    const tu = (timeUnit || "").trim();
    if (!AllowedTimeUnits.includes(tu as TimeUnit)) {
      return {
        error: "Invalid time unit. Please choose a valid option.",
        errorField: "timeUnit",
      };
    }
    const cf = (compoundingFrequency || "").trim();
    if (!AllowedFrequencies.includes(cf as Frequency)) {
      return {
        error: "Invalid compounding frequency.",
        errorField: "compoundingFrequency",
      };
    }
    const rf = (contributionFrequency || "").trim();
    if (!AllowedFrequencies.includes(rf as Frequency)) {
      return {
        error: "Invalid contribution frequency.",
        errorField: "contributionFrequency",
      };
    }

    // Numeric validation with sanitation and scientific notation block
    // Principal
    let principalNum = 0;
    const pTrim = (principal || "").trim();
    if (pTrim !== "") {
      if (/[eE]/.test(pTrim)) {
        return {
          error: "Scientific notation is not allowed. Please enter a standard number.",
          errorField: "principal",
        };
      }
      const san = sanitizeNumber(pTrim, 0, AMOUNT_MAX);
      if (san === null) {
        const raw = parseFloat(pTrim);
        if (isNaN(raw) || !isFinite(raw)) {
          return { error: "Invalid amount. Enter a valid number.", errorField: "principal" };
        }
        return {
          error: `Initial investment must be between $0 and $${AMOUNT_MAX.toLocaleString()}.`,
          errorField: "principal",
        };
      }
      principalNum = san;
    }

    // Interest rate (percent)
    let rateNum = 0;
    const rTrim = (interestRate || "").trim();
    if (rTrim !== "") {
      if (/[eE]/.test(rTrim)) {
        return {
          error: "Scientific notation is not allowed. Please enter a standard number.",
          errorField: "interestRate",
        };
      }
      const san = sanitizeNumber(rTrim, RATE_MIN, RATE_MAX);
      if (san === null) {
        const raw = parseFloat(rTrim);
        if (isNaN(raw) || !isFinite(raw)) {
          return { error: "Invalid interest rate.", errorField: "interestRate" };
        }
        return {
          error: `Interest rate must be between ${RATE_MIN}% and ${RATE_MAX}%.`,
          errorField: "interestRate",
        };
      }
      rateNum = san;
    }

    // Time value
    let timeNum = 0;
    const tTrim = (time || "").trim();
    if (tTrim !== "") {
      if (/[eE]/.test(tTrim)) {
        return {
          error: "Scientific notation is not allowed. Please enter a standard number.",
          errorField: "time",
        };
      }
      const san = sanitizeNumber(tTrim, 0, TIME_YEARS_MAX * 365); // sanitize raw entry; detailed check after unit conversion
      if (san === null) {
        const raw = parseFloat(tTrim);
        if (isNaN(raw) || !isFinite(raw)) {
          return { error: "Invalid time value.", errorField: "time" };
        }
        return {
          error: `Time value out of range.`,
          errorField: "time",
        };
      }
      timeNum = san;
    }

    // Additional contribution per period
    let additionalNum = 0;
    const aTrim = (additionalContributions || "").trim();
    if (aTrim !== "") {
      if (/[eE]/.test(aTrim)) {
        return {
          error: "Scientific notation is not allowed. Please enter a standard number.",
          errorField: "additionalContributions",
        };
      }
      const san = sanitizeNumber(aTrim, 0, AMOUNT_MAX);
      if (san === null) {
        const raw = parseFloat(aTrim);
        if (isNaN(raw) || !isFinite(raw)) {
          return { error: "Invalid contribution amount.", errorField: "additionalContributions" };
        }
        return {
          error: `Contribution must be between $0 and $${AMOUNT_MAX.toLocaleString()}.`,
          errorField: "additionalContributions",
        };
      }
      additionalNum = san;
    }

    // Convert time to years with whitelist
    let years = 0;
    switch (tu as TimeUnit) {
      case "years":
        years = timeNum;
        break;
      case "months":
        years = timeNum / 12;
        break;
      case "weeks":
        years = timeNum / 52;
        break;
      case "days":
        years = timeNum / 365;
        break;
    }

    // Range after conversion
    if (years < TIME_YEARS_MIN) {
      return { error: "Time must be greater than 0.", errorField: "time" };
    }
    if (years > TIME_YEARS_MAX) {
      return {
        error: `Time horizon is too large (>${TIME_YEARS_MAX} years). Please reduce it.`,
        errorField: "time",
      };
    }

    const n = FREQ_MAP[cf as Frequency];
    const contribN = FREQ_MAP[rf as Frequency];

    // If there's nothing to compute, return a valid empty result
    if (years === 0 || (principalNum <= 0 && additionalNum <= 0)) {
      return {
        error: null,
        errorField: null,
        principal: principalNum,
        interestRate: rateNum,
        timeInYears: years,
        timeUnit: tu as TimeUnit,
        compoundingFrequency: cf as Frequency,
        additional: additionalNum,
        contributionFrequency: rf as Frequency,
        periods: 0,
        compoundingPeriodsPerYear: n,
        compoundAmount: 0,
        contributionValue: 0,
        finalAmount: 0,
        totalContributions: 0,
        totalInterest: 0,
        effectiveAnnualRate: 0,
      };
    }

    const r = rateNum / 100; // decimal APR
    const t = years;

    // Compute compound on principal with 0% special handling
    let compoundAmount = 0;
    if (r === 0) {
      compoundAmount = principalNum;
    } else {
      const growth = Math.pow(1 + r / n, n * t);
      if (!Number.isFinite(growth) || growth <= 0) {
        return { error: "Calculation error: invalid growth factor.", errorField: "interestRate" };
      }
      compoundAmount = principalNum * growth;
    }

    // Future value of contributions (annuity due/ordinary?) — assume end-of-period contributions (ordinary annuity)
    let contributionValue = 0;
    const contributionPeriods = contribN * t;
    if (additionalNum > 0 && contributionPeriods > 0) {
      const contributionRate = r / contribN;
      if (contributionRate === 0) {
        contributionValue = additionalNum * contributionPeriods; // no interest accrual
      } else {
        const growth = Math.pow(1 + contributionRate, contributionPeriods);
        if (!Number.isFinite(growth) || growth <= 0) {
          return { error: "Calculation error: invalid contribution growth.", errorField: "interestRate" };
        }
        const denom = contributionRate;
        if (denom === 0 || !Number.isFinite(denom)) {
          return { error: "Calculation error: invalid contribution rate.", errorField: "interestRate" };
        }
        contributionValue = additionalNum * ((growth - 1) / denom);
      }
    }

    let finalAmount = compoundAmount + contributionValue;
    let totalContributions = principalNum + additionalNum * contributionPeriods;
    let totalInterest = finalAmount - totalContributions;

    // Round monetary values to 2 decimals
    const round2 = (x: number) => Math.round(x * 100) / 100;
    compoundAmount = round2(compoundAmount);
    contributionValue = round2(contributionValue);
    finalAmount = round2(finalAmount);
    totalContributions = round2(totalContributions);
    totalInterest = round2(totalInterest);

    // Effective annual rate based on contributions baseline if possible
    let effectiveAnnualRate = 0;
    if (t > 0 && totalContributions > 0) {
      const ratio = finalAmount / totalContributions;
      if (ratio > 0) {
        const ear = Math.pow(ratio, 1 / t) - 1;
        effectiveAnnualRate = Math.round(ear * 10000) / 100; // percent with 2 decimals
      }
    }

    // Final finite checks
    const all = [compoundAmount, contributionValue, finalAmount, totalContributions, totalInterest, effectiveAnnualRate];
    if (all.some((v) => !Number.isFinite(v))) {
      return { error: "Calculation error: results are invalid.", errorField: null };
    }

    return {
      error: null,
      errorField: null,
      principal: principalNum,
      interestRate: rateNum,
      timeInYears: years,
      timeUnit: tu as TimeUnit,
      compoundingFrequency: cf as Frequency,
      additional: additionalNum,
      contributionFrequency: rf as Frequency,
      periods: contributionPeriods,
      compoundingPeriodsPerYear: n,
      compoundAmount,
      contributionValue,
      finalAmount,
      totalContributions,
      totalInterest,
      effectiveAnnualRate,
    };
  } catch (error) {
    console.error("CompoundInterestCalculator: Unexpected error in validation", error);
    return {
      error: "An unexpected error occurred. Please refresh and try again.",
      errorField: null,
    };
  }
}

export const CompoundInterestCalculator = () => {
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [time, setTime] = useState("");
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("years");
  const [compoundingFrequency, setCompoundingFrequency] = useState<Frequency>("annually");
  const [additionalContributions, setAdditionalContributions] = useState("");
  const [contributionFrequency, setContributionFrequency] = useState<Frequency>("monthly");

  // Locale-aware currency formatter (USD)
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

  // Calculate with validation and safety
  const calc = useMemo(
    () =>
      validateAndComputeCompoundInterest({
        principal,
        interestRate,
        time,
        timeUnit,
        compoundingFrequency,
        additionalContributions,
        contributionFrequency,
      }),
    [principal, interestRate, time, timeUnit, compoundingFrequency, additionalContributions, contributionFrequency]
  );

  const clearAll = useCallback(() => {
    setPrincipal("");
    setInterestRate("");
    setTime("");
    setTimeUnit("years");
    setCompoundingFrequency("annually");
    setAdditionalContributions("");
    setContributionFrequency("monthly");
  }, []);

  const hasResults =
    !calc.error &&
    typeof calc.timeInYears === "number" &&
    calc.timeInYears > 0 &&
    ((typeof calc.principal === "number" && calc.principal > 0) ||
      (typeof calc.additional === "number" && calc.additional > 0));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compound Interest Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Initial Investment ($)</Label>
              <Input
                id="principal"
                type="number"
                placeholder="0"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                min="0"
                step="0.01"
                aria-invalid={calc.errorField === "principal" ? "true" : "false"}
                aria-describedby={calc.errorField === "principal" ? "compound-error" : undefined}
                className={calc.errorField === "principal" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">Max: {currencyFormatter.format(AMOUNT_MAX)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest-rate">Annual Interest Rate (%)</Label>
              <Input
                id="interest-rate"
                type="number"
                placeholder="0.00"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                min="0"
                max={String(RATE_MAX)}
                step="0.01"
                aria-invalid={calc.errorField === "interestRate" ? "true" : "false"}
                aria-describedby={calc.errorField === "interestRate" ? "compound-error" : undefined}
                className={calc.errorField === "interestRate" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">Range: {RATE_MIN}% to {RATE_MAX}%</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time Period</Label>
              <Input
                id="time"
                type="number"
                placeholder="0"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                min="0"
                step="0.01"
                aria-invalid={calc.errorField === "time" ? "true" : "false"}
                aria-describedby={calc.errorField === "time" ? "compound-error" : undefined}
                className={calc.errorField === "time" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">Max horizon: {TIME_YEARS_MAX} years</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-unit">Time Unit</Label>
              <Select value={timeUnit} onValueChange={(v) => setTimeUnit(v as TimeUnit)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compounding">Compounding Frequency</Label>
              <Select value={compoundingFrequency} onValueChange={(v) => setCompoundingFrequency(v as Frequency)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional">Additional Contributions ($)</Label>
              <Input
                id="additional"
                type="number"
                placeholder="0"
                value={additionalContributions}
                onChange={(e) => setAdditionalContributions(e.target.value)}
                min="0"
                step="0.01"
                aria-invalid={calc.errorField === "additionalContributions" ? "true" : "false"}
                aria-describedby={calc.errorField === "additionalContributions" ? "compound-error" : undefined}
                className={calc.errorField === "additionalContributions" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">Max per period: {currencyFormatter.format(AMOUNT_MAX)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contribution-freq">Contribution Frequency</Label>
              <Select value={contributionFrequency} onValueChange={(v) => setContributionFrequency(v as Frequency)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full" aria-label="Clear all fields">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>

          {calc.error && (
            <div
              id="compound-error"
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
            <CardTitle>Compound Interest Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 break-all px-2" aria-live="polite" aria-atomic="true">
                  {currencyFormatter.format(calc.finalAmount!)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Final Amount</div>
              </div>

              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 break-all px-2" aria-live="polite" aria-atomic="true">
                  {currencyFormatter.format(calc.totalInterest!)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Interest</div>
              </div>

              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 break-all px-2" aria-live="polite" aria-atomic="true">
                  {currencyFormatter.format(calc.totalContributions!)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Contributions</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm sm:text-base">Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Initial Investment:</span>
                    <span className="font-medium break-all text-right" aria-live="polite" aria-atomic="true">
                      {currencyFormatter.format(calc.principal!)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Compound Growth:</span>
                    <span className="font-medium break-all text-right" aria-live="polite" aria-atomic="true">
                      {currencyFormatter.format(calc.compoundAmount!)}
                    </span>
                  </div>
                </div>

                {calc.additional! > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Additional Contributions (sum):</span>
                      <span className="font-medium break-all text-right" aria-live="polite" aria-atomic="true">
                        {currencyFormatter.format(calc.totalContributions! - calc.principal!)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Contribution Value (FV):</span>
                      <span className="font-medium break-all text-right" aria-live="polite" aria-atomic="true">
                        {currencyFormatter.format(calc.contributionValue!)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Key Insights</h4>
              <div className="text-sm space-y-1 break-words">
                <p>
                  • Portfolio growth over period:
                  <strong className="ml-1 break-all">{(((calc.finalAmount! / calc.totalContributions!) - 1) * 100).toFixed(1)}%</strong>
                </p>
                <p>
                  • Interest earned:
                  <strong className="ml-1 break-all">{currencyFormatter.format(calc.totalInterest!)}</strong>
                </p>
                <p>
                  • Effective annual rate:
                  <strong className="ml-1 break-all">{calc.effectiveAnnualRate!.toFixed(2)}%</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Compound Interest Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Start investing early - time is your greatest asset</li>
            <li>• Make regular contributions to maximize compound growth</li>
            <li>• Higher compounding frequency leads to slightly better returns</li>
            <li>• Consider tax implications of your investment returns</li>
            <li>• Review and adjust your investment strategy regularly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

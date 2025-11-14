import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, RotateCcw } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatCurrency } from "@/lib/safe-math";
import { validateRange, validateResult, ValidationErrors } from "@/lib/validators";

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

    // Principal validation
    let principalNum = 0;
    const pTrim = (principal || "").trim();
    if (pTrim !== "") {
      const parsed = safeNumber(pTrim);
      if (parsed === null) {
        return { error: ValidationErrors.INVALID_NUMBER, errorField: "principal" };
      }
      if (!validateRange(parsed, 0, AMOUNT_MAX)) {
        return {
          error: `Initial investment must be between $0 and $${AMOUNT_MAX.toLocaleString()}.`,
          errorField: "principal",
        };
      }
      principalNum = parsed;
    }

    // Interest rate validation
    let rateNum = 0;
    const rTrim = (interestRate || "").trim();
    if (rTrim !== "") {
      const parsed = safeNumber(rTrim);
      if (parsed === null) {
        return { error: ValidationErrors.INVALID_NUMBER, errorField: "interestRate" };
      }
      if (!validateRange(parsed, RATE_MIN, RATE_MAX)) {
        return {
          error: `Interest rate must be between ${RATE_MIN}% and ${RATE_MAX}%.`,
          errorField: "interestRate",
        };
      }
      rateNum = parsed;
    }

    // Time validation
    let timeNum = 0;
    const tTrim = (time || "").trim();
    if (tTrim !== "") {
      const parsed = safeNumber(tTrim);
      if (parsed === null) {
        return { error: ValidationErrors.INVALID_NUMBER, errorField: "time" };
      }
      if (parsed < 0 || parsed > TIME_YEARS_MAX * 365) {
        return {
          error: `Time value out of range.`,
          errorField: "time",
        };
      }
      timeNum = parsed;
    }

    // Additional contribution validation
    let additionalNum = 0;
    const aTrim = (additionalContributions || "").trim();
    if (aTrim !== "") {
      const parsed = safeNumber(aTrim);
      if (parsed === null) {
        return { error: ValidationErrors.INVALID_NUMBER, errorField: "additionalContributions" };
      }
      if (!validateRange(parsed, 0, AMOUNT_MAX)) {
        return {
          error: `Contribution must be between $0 and $${AMOUNT_MAX.toLocaleString()}.`,
          errorField: "additionalContributions",
        };
      }
      additionalNum = parsed;
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

    // Compute compound on principal using safe math
    let compoundAmount = 0;
    if (r === 0) {
      compoundAmount = principalNum;
    } else {
      const result = safeCalc(D => D(1).plus(D(r).div(n)).pow(D(n).mul(t)).mul(principalNum));
      if (result === null) {
        return { error: "Calculation error: invalid growth factor.", errorField: "interestRate" };
      }
      compoundAmount = result;
    }

    // Future value of contributions using safe math
    let contributionValue = 0;
    const contributionPeriods = contribN * t;
    if (additionalNum > 0 && contributionPeriods > 0) {
      const contributionRate = r / contribN;
      if (contributionRate === 0) {
        contributionValue = additionalNum * contributionPeriods;
      } else {
        const result = safeCalc(D => {
          const growth = D(1).plus(contributionRate).pow(contributionPeriods);
          return D(additionalNum).mul(growth.minus(1).div(contributionRate));
        });
        if (result === null) {
          return { error: "Calculation error: invalid contribution growth.", errorField: "interestRate" };
        }
        contributionValue = result;
      }
    }

    const finalAmount = safeCalc(D => D(compoundAmount).plus(contributionValue));
    const totalContributions = safeCalc(D => D(principalNum).plus(D(additionalNum).mul(contributionPeriods)));
    
    if (finalAmount === null || totalContributions === null) {
      return { error: "Calculation error: results are invalid.", errorField: null };
    }

    const totalInterest = safeCalc(D => D(finalAmount).minus(totalContributions));
    if (totalInterest === null) {
      return { error: "Calculation error: results are invalid.", errorField: null };
    }

    // Round monetary values to 2 decimals
    const round2 = (x: number) => Math.round(x * 100) / 100;
    compoundAmount = round2(compoundAmount);
    contributionValue = round2(contributionValue);
    const finalAmountRounded = round2(finalAmount);
    const totalContributionsRounded = round2(totalContributions);
    const totalInterestRounded = round2(totalInterest);

    // Effective annual rate
    let effectiveAnnualRate = 0;
    if (t > 0 && totalContributions > 0) {
      const ear = safeCalc(D => D(finalAmount).div(totalContributions).pow(D(1).div(t)).minus(1).mul(100));
      effectiveAnnualRate = ear ? round2(ear) : 0;
    }

    // Validate displayable results
    if (!validateResult(finalAmountRounded)) {
      return { error: ValidationErrors.RESULT_TOO_LARGE, errorField: null };
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
      finalAmount: finalAmountRounded,
      totalContributions: totalContributionsRounded,
      totalInterest: totalInterestRounded,
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

  // Enum coercers
  const coerceTimeUnit = (v: string): TimeUnit => (AllowedTimeUnits.includes(v as TimeUnit) ? (v as TimeUnit) : "years");
  const coerceFrequency = (v: string): Frequency => (AllowedFrequencies.includes(v as Frequency) ? (v as Frequency) : "annually");

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
              <SafeNumberInput
                id="principal"
                placeholder="0"
                value={principal}
                onChange={setPrincipal}
                aria-invalid={calc.errorField === "principal" ? "true" : "false"}
                aria-describedby={calc.errorField === "principal" ? "compound-error" : undefined}
                className={calc.errorField === "principal" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">Max: {formatCurrency(AMOUNT_MAX)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest-rate">Annual Interest Rate (%)</Label>
              <SafeNumberInput
                id="interest-rate"
                placeholder="0.00"
                value={interestRate}
                onChange={setInterestRate}
                aria-invalid={calc.errorField === "interestRate" ? "true" : "false"}
                aria-describedby={calc.errorField === "interestRate" ? "compound-error" : undefined}
                className={calc.errorField === "interestRate" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">Range: {RATE_MIN}% to {RATE_MAX}%</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time Period</Label>
              <SafeNumberInput
                id="time"
                placeholder="0"
                value={time}
                onChange={setTime}
                aria-invalid={calc.errorField === "time" ? "true" : "false"}
                aria-describedby={calc.errorField === "time" ? "compound-error" : undefined}
                className={calc.errorField === "time" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">Max horizon: {TIME_YEARS_MAX} years</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-unit">Time Unit</Label>
              <Select value={timeUnit} onValueChange={(v) => setTimeUnit(coerceTimeUnit(v))}>
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
              <Select value={compoundingFrequency} onValueChange={(v) => setCompoundingFrequency(coerceFrequency(v))}>
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
              <SafeNumberInput
                id="additional"
                placeholder="0"
                value={additionalContributions}
                onChange={setAdditionalContributions}
                aria-invalid={calc.errorField === "additionalContributions" ? "true" : "false"}
                aria-describedby={calc.errorField === "additionalContributions" ? "compound-error" : undefined}
                className={calc.errorField === "additionalContributions" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">Max per period: {formatCurrency(AMOUNT_MAX)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contribution-freq">Contribution Frequency</Label>
              <Select value={contributionFrequency} onValueChange={(v) => setContributionFrequency(coerceFrequency(v))}>
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

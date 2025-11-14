/**
 * LoanCalculator - Enterprise-grade loan EMI calculation tool
 *
 * Security & Reliability Features:
 * - Input Sanitization: sanitizeNumber() validates numeric input and rejects NaN/Infinity
 * - Range Clamping: Principal, rate, and term clamped to safe, configurable ranges
 * - Safe Math: Guards against division by zero and overflow in EMI formula
 * - Zero-Interest Handling: Dedicated branch for 0% interest (no division by 0)
 * - Type Safety: Explicit numeric parsing with fallbacks
 * - Error Handling UI: Clear, accessible error messages for invalid input
 * - Localization: Intl.NumberFormat for human-friendly currency formatting
 * - Accessibility: aria-live, aria-invalid, and aria-describedby for screen readers (WCAG 2.1 AA)
 */

import { useMemo, useState } from "react";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatCurrency } from "@/lib/safe-math";
import { validateRange } from "@/lib/validators";

const MAX_PRINCIPAL = 1e12; // 1 trillion
const MIN_PRINCIPAL = 0;

const MIN_RATE = 0; // 0% allowed, handled by special formula
const MAX_RATE = 100; // 100% APR upper guardrail

const MIN_YEARS = 1;
const MAX_YEARS = 100;

type LoanResult = {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
};



export const LoanCalculator = () => {
  const [principal, setPrincipal] = useState("100000");
  const [rate, setRate] = useState("5");
  const [years, setYears] = useState("30");
  const [result, setResult] = useState<LoanResult | null>(null);
  const [error, setError] = useState<string | null>(null);



  // Currency formatter (locale-aware)
  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const calculateLoan = (pStr: string, rStr: string, yStr: string) => {
    setError(null);

    const hasPrincipal = pStr.trim().length > 0;
    const hasRate = rStr.trim().length > 0;
    const hasYears = yStr.trim().length > 0;

    // If nothing (or incomplete) is entered, clear result without error
    if (!hasPrincipal || !hasRate || !hasYears) {
      setResult(null);
      return;
    }

    // Safe parsing with unified system
    const principalVal = safeNumber(pStr, { min: MIN_PRINCIPAL, max: MAX_PRINCIPAL });
    const rateVal = safeNumber(rStr, { min: MIN_RATE, max: MAX_RATE });
    const yearsVal = safeNumber(yStr, { min: MIN_YEARS, max: MAX_YEARS });

    // Validate principal
    if (principalVal === null) {
      setError("Invalid loan amount. Please enter a valid number.");
      setResult(null);
      return;
    }
    const principalRangeError = validateRange(principalVal, MIN_PRINCIPAL, MAX_PRINCIPAL);
    if (principalRangeError !== true) {
      setError(
        typeof principalRangeError === 'string' 
          ? principalRangeError 
          : `Loan amount must be between ${formatCurrency(MIN_PRINCIPAL)} and ${formatCurrency(MAX_PRINCIPAL)}.`
      );
      setResult(null);
      return;
    }

    // Validate rate
    if (rateVal === null) {
      setError("Invalid interest rate. Please enter a valid number.");
      setResult(null);
      return;
    }
    const rateRangeError = validateRange(rateVal, MIN_RATE, MAX_RATE);
    if (rateRangeError !== true) {
      setError(
        typeof rateRangeError === 'string'
          ? rateRangeError
          : `Annual interest rate must be between ${MIN_RATE}% and ${MAX_RATE}%.`
      );
      setResult(null);
      return;
    }

    // Validate years
    if (yearsVal === null) {
      setError("Invalid loan term. Please enter a valid number of years.");
      setResult(null);
      return;
    }
    const yearsRangeError = validateRange(yearsVal, MIN_YEARS, MAX_YEARS);
    if (yearsRangeError !== true) {
      setError(
        typeof yearsRangeError === 'string'
          ? yearsRangeError
          : `Loan term must be between ${MIN_YEARS} and ${MAX_YEARS} years.`
      );
      setResult(null);
      return;
    }

    const months = safeCalc(D => D(yearsVal).mul(12));

    if (months === null || months <= 0) {
      setError("Loan term must be greater than 0 months.");
      setResult(null);
      return;
    }

    let monthlyPayment: number | null;
    let totalPayment: number | null;
    let totalInterest: number | null;

    try {
      if (rateVal === 0) {
        // Zero-interest loan: simple division
        monthlyPayment = safeCalc(D => D(principalVal).div(months));
        totalPayment = principalVal;
        totalInterest = 0;
      } else {
        const monthlyRate = safeCalc(D => D(rateVal).div(100).div(12));
        if (monthlyRate === null) {
          setError("Invalid monthly rate calculation.");
          setResult(null);
          return;
        }

        const factor = safeCalc(D => D(1).plus(monthlyRate).pow(months));
        if (factor === null || factor <= 1) {
          setError(
            "Calculation overflow. Try reducing the rate or term length."
          );
          setResult(null);
          return;
        }

        monthlyPayment = safeCalc(D => 
          D(principalVal).mul(monthlyRate).mul(factor).div(D(factor).minus(1))
        );

        totalPayment = safeCalc(D => D(monthlyPayment!).mul(months));
        totalInterest = safeCalc(D => D(totalPayment!).minus(principalVal));
      }

      if (
        monthlyPayment === null ||
        totalPayment === null ||
        totalInterest === null
      ) {
        setError("Calculation resulted in an invalid number.");
        setResult(null);
        return;
      }

      setResult({
        monthlyPayment,
        totalPayment,
        totalInterest,
      });
    } catch (err) {
      console.error("Loan calculation error:", err);
      setError("An unexpected error occurred during calculation.");
      setResult(null);
    }
  };

  const handlePrincipalChange = (val: string) => {
    setPrincipal(val);
    calculateLoan(val, rate, years);
  };

  const handleRateChange = (val: string) => {
    setRate(val);
    calculateLoan(principal, val, years);
  };

  const handleYearsChange = (val: string) => {
    setYears(val);
    calculateLoan(principal, rate, val);
  };

  const hasError = Boolean(error);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Loan Amount */}
          <div className="space-y-2">
            <Label htmlFor="loan-amount">Loan Amount</Label>
            <SafeNumberInput
              id="loan-amount"
              value={principal}
              onChange={handlePrincipalChange}
              sanitizeOptions={{ min: MIN_PRINCIPAL, max: MAX_PRINCIPAL }}
              inputMode="decimal"
              aria-label="Loan amount"
              aria-invalid={hasError ? "true" : "false"}
              aria-describedby={hasError ? "loan-error" : undefined}
              className={hasError ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Min: {currencyFormatter.format(MIN_PRINCIPAL)} • Max:{" "}
              {currencyFormatter.format(MAX_PRINCIPAL)}
            </p>
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <Label htmlFor="loan-rate">Annual Interest Rate (%)</Label>
            <SafeNumberInput
              id="loan-rate"
              value={rate}
              onChange={handleRateChange}
              sanitizeOptions={{ min: MIN_RATE, max: MAX_RATE }}
              inputMode="decimal"
              aria-label="Annual interest rate"
              aria-invalid={hasError ? "true" : "false"}
              aria-describedby={hasError ? "loan-error" : undefined}
              className={hasError ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Range: {MIN_RATE}% to {MAX_RATE}% (0% allowed)
            </p>
          </div>

          {/* Loan Term */}
          <div className="space-y-2">
            <Label htmlFor="loan-years">Loan Term (years)</Label>
            <SafeNumberInput
              id="loan-years"
              value={years}
              onChange={handleYearsChange}
              sanitizeOptions={{ min: MIN_YEARS, max: MAX_YEARS, allowDecimal: false }}
              inputMode="numeric"
              aria-label="Loan term in years"
              aria-invalid={hasError ? "true" : "false"}
              aria-describedby={hasError ? "loan-error" : undefined}
              className={hasError ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Range: {MIN_YEARS} to {MAX_YEARS} years
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div
              id="loan-error"
              className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && !error && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-center"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary break-words px-2">
                  {formatCurrency(result.monthlyPayment)}
                </div>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                  per month
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Total Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary break-all px-2">
                    {formatCurrency(result.totalPayment)}
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    over {years} years
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Interest</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-accent break-all px-2">
                    {formatCurrency(result.totalInterest)}
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    interest paid
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

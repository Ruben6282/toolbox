/**
 * MortgageCalculator - Enterprise-grade mortgage calculation tool
 *
 * Security & UX Features:
 * - Explicit Range Validation: All inputs validated with explicit bounds
 * - Input Sanitization: All inputs trimmed and validated with sanitizeNumber()
 * - NaN/Infinity Guards: Verifies all derived numbers are finite before rendering
 * - Division by Zero Protection: Validates denominators before calculations
 * - Mathematical Safety: Try-catch around all calculations with finite checks
 * - Error Handling UI: Role alert banner with aria-live announcements
 * - Accessibility: aria-invalid + aria-describedby on invalid fields; targeted aria-live regions
 * - Localization: Intl.NumberFormat for currency-safe, locale-aware formatting
 * - Precision: All monetary values rounded to 2 decimal places
 * - Business Logic: PMI calculated correctly on loan after down payment
 * 
 * IMPORTANT SECURITY NOTES:
 * - This is CLIENT-SIDE validation only. Backend MUST re-validate all inputs
 * - Deploy with Content-Security-Policy headers to prevent XSS
 * - Consider rate limiting on backend if this data is submitted to a server
 */

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Label } from "@/components/ui/label";
import { AlertCircle, RotateCcw } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatCurrency } from "@/lib/safe-math";
import { validateRange } from "@/lib/validators";

// Security bounds
const LOAN_AMOUNT_MAX = 1e10; // $10,000,000,000
const INTEREST_RATE_MIN = 0;
const INTEREST_RATE_MAX = 30; // 30% max
const LOAN_TERM_MIN = 1;
const LOAN_TERM_MAX = 50; // 50 years max
const PMI_RATE_MAX = 5; // 5% max

export type MortgageComputation = {
  error: string | null;
  errorField: "loanAmount" | "interestRate" | "loanTerm" | "downPayment" | "propertyTax" | "homeInsurance" | "pmi" | null;
  loanAmount?: number;
  interestRate?: number;
  loanTerm?: number;
  downPayment?: number;
  propertyTax?: number;
  homeInsurance?: number;
  pmiRate?: number;
  monthlyPayment?: number;
  monthlyTax?: number;
  monthlyInsurance?: number;
  monthlyPmi?: number;
  totalMonthlyPayment?: number;
  totalPayment?: number;
  totalInterest?: number;
  actualLoanAmount?: number; // Loan amount after down payment
};

// eslint-disable-next-line react-refresh/only-export-components
export function validateAndComputeMortgage(params: {
  loanAmount: string;
  interestRate: string;
  loanTerm: string;
  downPayment: string;
  propertyTax: string;
  homeInsurance: string;
  pmi: string;
}): MortgageComputation {
  try {
    const { loanAmount, interestRate, loanTerm, downPayment, propertyTax, homeInsurance, pmi } = params;

    // --- Loan Amount Validation ---
    let loanAmountNum = 0;
    const trimmedLoanAmount = loanAmount.trim();
    if (trimmedLoanAmount !== "") {
      const sanLoan = safeNumber(trimmedLoanAmount, { min: 0, max: LOAN_AMOUNT_MAX });
      if (sanLoan === null) {
        return {
          error: "Invalid loan amount. Please enter a valid number.",
          errorField: "loanAmount",
        };
      }
      const rangeError = validateRange(sanLoan, 0, LOAN_AMOUNT_MAX);
      if (rangeError !== true) {
        return {
          error: typeof rangeError === 'string' ? rangeError : `Loan amount must be between $0 and $${LOAN_AMOUNT_MAX.toLocaleString()}.`,
          errorField: "loanAmount",
        };
      }
      loanAmountNum = sanLoan;
    }

    // --- Interest Rate Validation ---
    let interestRateNum = 0;
    const trimmedRate = interestRate.trim();
    if (trimmedRate !== "") {
      const sanRate = safeNumber(trimmedRate, { min: INTEREST_RATE_MIN, max: INTEREST_RATE_MAX });
      if (sanRate === null) {
        return {
          error: "Invalid interest rate. Please enter a valid number.",
          errorField: "interestRate",
        };
      }
      const rangeError = validateRange(sanRate, INTEREST_RATE_MIN, INTEREST_RATE_MAX);
      if (rangeError !== true) {
        return {
          error: typeof rangeError === 'string' ? rangeError : `Interest rate must be between ${INTEREST_RATE_MIN}% and ${INTEREST_RATE_MAX}%.`,
          errorField: "interestRate",
        };
      }
      interestRateNum = sanRate;
    }

    // --- Loan Term Validation ---
    let loanTermNum = 30; // Default to 30 years
    const trimmedTerm = loanTerm.trim();
    if (trimmedTerm !== "") {
      const sanTerm = safeNumber(trimmedTerm, { min: LOAN_TERM_MIN, max: LOAN_TERM_MAX, allowDecimal: false });
      if (sanTerm === null) {
        return {
          error: "Invalid loan term. Please enter a valid number.",
          errorField: "loanTerm",
        };
      }
      const rangeError = validateRange(sanTerm, LOAN_TERM_MIN, LOAN_TERM_MAX);
      if (rangeError !== true) {
        return {
          error: typeof rangeError === 'string' ? rangeError : `Loan term must be between ${LOAN_TERM_MIN} and ${LOAN_TERM_MAX} years.`,
          errorField: "loanTerm",
        };
      }
      loanTermNum = Math.floor(sanTerm);
    }

    // --- Down Payment Validation ---
    let downPaymentNum = 0;
    const trimmedDown = downPayment.trim();
    if (trimmedDown !== "") {
      const sanDown = safeNumber(trimmedDown, { min: 0, max: LOAN_AMOUNT_MAX });
      if (sanDown === null) {
        return {
          error: "Invalid down payment. Please enter a valid number.",
          errorField: "downPayment",
        };
      }
      const rangeError = validateRange(sanDown, 0, LOAN_AMOUNT_MAX);
      if (rangeError !== true) {
        return {
          error: typeof rangeError === 'string' ? rangeError : `Down payment must be between $0 and $${LOAN_AMOUNT_MAX.toLocaleString()}.`,
          errorField: "downPayment",
        };
      }
      downPaymentNum = sanDown;

      // Validate down payment doesn't exceed loan amount
      if (loanAmountNum > 0 && downPaymentNum > loanAmountNum) {
        return {
          error: "Down payment cannot exceed the loan amount.",
          errorField: "downPayment",
        };
      }
    }

    // --- Property Tax Validation ---
    let propertyTaxNum = 0;
    const trimmedTax = propertyTax.trim();
    if (trimmedTax !== "") {
      const sanTax = safeNumber(trimmedTax, { min: 0, max: LOAN_AMOUNT_MAX });
      if (sanTax === null) {
        return {
          error: "Invalid property tax. Please enter a valid number.",
          errorField: "propertyTax",
        };
      }
      const rangeError = validateRange(sanTax, 0, LOAN_AMOUNT_MAX);
      if (rangeError !== true) {
        return {
          error: typeof rangeError === 'string' ? rangeError : `Property tax must be between $0 and $${LOAN_AMOUNT_MAX.toLocaleString()}.`,
          errorField: "propertyTax",
        };
      }
      propertyTaxNum = sanTax;
    }

    // --- Home Insurance Validation ---
    let homeInsuranceNum = 0;
    const trimmedIns = homeInsurance.trim();
    if (trimmedIns !== "") {
      const sanIns = safeNumber(trimmedIns, { min: 0, max: LOAN_AMOUNT_MAX });
      if (sanIns === null) {
        return {
          error: "Invalid home insurance. Please enter a valid number.",
          errorField: "homeInsurance",
        };
      }
      const rangeError = validateRange(sanIns, 0, LOAN_AMOUNT_MAX);
      if (rangeError !== true) {
        return {
          error: typeof rangeError === 'string' ? rangeError : `Home insurance must be between $0 and $${LOAN_AMOUNT_MAX.toLocaleString()}.`,
          errorField: "homeInsurance",
        };
      }
      homeInsuranceNum = sanIns;
    }

    // --- PMI Rate Validation ---
    let pmiRateNum = 0;
    const trimmedPmi = pmi.trim();
    if (trimmedPmi !== "") {
      const sanPmi = safeNumber(trimmedPmi, { min: 0, max: PMI_RATE_MAX });
      if (sanPmi === null) {
        return {
          error: "Invalid PMI rate. Please enter a valid number.",
          errorField: "pmi",
        };
      }
      const rangeError = validateRange(sanPmi, 0, PMI_RATE_MAX);
      if (rangeError !== true) {
        return {
          error: typeof rangeError === 'string' ? rangeError : `PMI rate must be between 0% and ${PMI_RATE_MAX}%.`,
          errorField: "pmi",
        };
      }
      pmiRateNum = sanPmi;
    }

    // --- Mortgage Calculation with Safety Checks ---
    if (loanAmountNum <= 0 || interestRateNum <= 0) {
      // Return valid but empty result
      return {
        error: null,
        errorField: null,
        loanAmount: loanAmountNum,
        interestRate: interestRateNum,
        loanTerm: loanTermNum,
        downPayment: downPaymentNum,
        propertyTax: propertyTaxNum,
        homeInsurance: homeInsuranceNum,
        pmiRate: pmiRateNum,
        monthlyPayment: 0,
        monthlyTax: 0,
        monthlyInsurance: 0,
        monthlyPmi: 0,
        totalMonthlyPayment: 0,
        totalPayment: 0,
        totalInterest: 0,
        actualLoanAmount: 0,
      };
    }

    // Calculate actual loan amount after down payment
    const actualLoanAmount = safeCalc(D => D(loanAmountNum).minus(downPaymentNum));

    if (actualLoanAmount === null || actualLoanAmount <= 0) {
      return {
        error: "Loan amount after down payment must be greater than $0.",
        errorField: "downPayment",
      };
    }

    const monthlyRate = safeCalc(D => D(interestRateNum).div(100).div(12));
    const numPayments = safeCalc(D => D(loanTermNum).mul(12));

    if (monthlyRate === null || numPayments === null) {
      return {
        error: "Calculation error: Invalid rate or term.",
        errorField: null,
      };
    }

    // Check for edge case: 0% interest rate
    let monthlyPayment: number | null;
    if (monthlyRate === 0) {
      // With 0% interest, payment is just principal divided by months
      monthlyPayment = safeCalc(D => D(actualLoanAmount).div(numPayments));
    } else {
      // Standard mortgage formula
      const factor = safeCalc(D => D(1).plus(monthlyRate).pow(numPayments));
      if (factor === null) {
        return {
          error: "Calculation error: Loan parameters produce invalid result.",
          errorField: null,
        };
      }

      const denominator = safeCalc(D => D(factor).minus(1));
      if (denominator === null || denominator === 0) {
        return {
          error: "Calculation error: Invalid interest rate or loan term combination.",
          errorField: "interestRate",
        };
      }

      const numerator = safeCalc(D => D(actualLoanAmount).mul(monthlyRate).mul(factor));
      if (numerator === null) {
        return {
          error: "Calculation error: Loan parameters produce invalid result.",
          errorField: null,
        };
      }

      monthlyPayment = safeCalc(D => D(numerator).div(denominator));
    }

    if (monthlyPayment === null) {
      return {
        error: "Calculation error: Results are invalid. Please check your inputs.",
        errorField: null,
      };
    }

    const totalPayment = safeCalc(D => D(monthlyPayment!).mul(numPayments));
    const totalInterest = safeCalc(D => D(totalPayment ?? 0).minus(actualLoanAmount));

    // Calculate monthly costs
    const monthlyTax = safeCalc(D => D(propertyTaxNum).div(12));
    const monthlyInsurance = safeCalc(D => D(homeInsuranceNum).div(12));
    // PMI is calculated on actual loan amount after down payment
    const monthlyPmi = safeCalc(D => D(pmiRateNum).div(100).mul(actualLoanAmount).div(12));

    const totalMonthlyPayment = safeCalc(D => 
      D(monthlyPayment!).plus(monthlyTax ?? 0).plus(monthlyInsurance ?? 0).plus(monthlyPmi ?? 0)
    );

    if (
      totalPayment === null ||
      totalInterest === null ||
      monthlyTax === null ||
      monthlyInsurance === null ||
      monthlyPmi === null ||
      totalMonthlyPayment === null
    ) {
      return {
        error: "Calculation error: Results are invalid. Please check your inputs.",
        errorField: null,
      };
    }

    return {
      error: null,
      errorField: null,
      loanAmount: loanAmountNum,
      interestRate: interestRateNum,
      loanTerm: loanTermNum,
      downPayment: downPaymentNum,
      propertyTax: propertyTaxNum,
      homeInsurance: homeInsuranceNum,
      pmiRate: pmiRateNum,
      monthlyPayment,
      monthlyTax,
      monthlyInsurance,
      monthlyPmi,
      totalMonthlyPayment,
      totalPayment,
      totalInterest,
      actualLoanAmount,
    };
  } catch (error) {
    // Catch any unexpected errors to prevent component crash
    console.error("MortgageCalculator: Unexpected error in validateAndComputeMortgage", error);
    return {
      error: "An unexpected error occurred. Please refresh and try again.",
      errorField: null,
    };
  }
}

export const MortgageCalculator = () => {
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [loanTerm, setLoanTerm] = useState("30");
  const [downPayment, setDownPayment] = useState("");
  const [propertyTax, setPropertyTax] = useState("");
  const [homeInsurance, setHomeInsurance] = useState("");
  const [pmi, setPmi] = useState("");



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

  // Calculate with validation
  const calc = useMemo(
    () =>
      validateAndComputeMortgage({
        loanAmount,
        interestRate,
        loanTerm,
        downPayment,
        propertyTax,
        homeInsurance,
        pmi,
      }),
    [loanAmount, interestRate, loanTerm, downPayment, propertyTax, homeInsurance, pmi]
  );

  const clearAll = useCallback(() => {
    setLoanAmount("");
    setInterestRate("");
    setLoanTerm("30");
    setDownPayment("");
    setPropertyTax("");
    setHomeInsurance("");
    setPmi("");
  }, []);

  const hasResults =
    !calc.error &&
    typeof calc.loanAmount === "number" &&
    calc.loanAmount > 0 &&
    typeof calc.interestRate === "number" &&
    calc.interestRate > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mortgage Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan-amount">Loan Amount ($)</Label>
              <SafeNumberInput
                id="loan-amount"
                placeholder="0"
                value={loanAmount}
                onChange={(sanitized) => setLoanAmount(sanitized)}
                sanitizeOptions={{ min: 0, max: LOAN_AMOUNT_MAX }}
                inputMode="decimal"
                aria-invalid={calc.errorField === "loanAmount" ? "true" : "false"}
                aria-describedby={
                  calc.errorField === "loanAmount" ? "mortgage-error" : undefined
                }
                className={calc.errorField === "loanAmount" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Max: {currencyFormatter.format(LOAN_AMOUNT_MAX)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest-rate">Interest Rate (%)</Label>
              <SafeNumberInput
                id="interest-rate"
                placeholder="0.00"
                value={interestRate}
                onChange={(sanitized) => setInterestRate(sanitized)}
                sanitizeOptions={{ min: INTEREST_RATE_MIN, max: INTEREST_RATE_MAX }}
                inputMode="decimal"
                aria-invalid={calc.errorField === "interestRate" ? "true" : "false"}
                aria-describedby={
                  calc.errorField === "interestRate" ? "mortgage-error" : undefined
                }
                className={calc.errorField === "interestRate" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Range: {INTEREST_RATE_MIN}% to {INTEREST_RATE_MAX}%
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-term">Loan Term (Years)</Label>
              <SafeNumberInput
                id="loan-term"
                placeholder="30"
                value={loanTerm}
                onChange={(sanitized) => setLoanTerm(sanitized)}
                sanitizeOptions={{ min: LOAN_TERM_MIN, max: LOAN_TERM_MAX, allowDecimal: false }}
                inputMode="numeric"
                aria-invalid={calc.errorField === "loanTerm" ? "true" : "false"}
                aria-describedby={
                  calc.errorField === "loanTerm" ? "mortgage-error" : undefined
                }
                className={calc.errorField === "loanTerm" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Range: {LOAN_TERM_MIN} to {LOAN_TERM_MAX} years
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="down-payment">Down Payment ($) (Optional)</Label>
              <SafeNumberInput
                id="down-payment"
                placeholder="0"
                value={downPayment}
                onChange={(sanitized) => setDownPayment(sanitized)}
                sanitizeOptions={{ min: 0, max: LOAN_AMOUNT_MAX }}
                inputMode="decimal"
                aria-invalid={calc.errorField === "downPayment" ? "true" : "false"}
                aria-describedby={
                  calc.errorField === "downPayment" ? "mortgage-error" : undefined
                }
                className={calc.errorField === "downPayment" ? "border-red-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-tax">Annual Property Tax ($) (Optional)</Label>
              <SafeNumberInput
                id="property-tax"
                placeholder="0"
                value={propertyTax}
                onChange={(sanitized) => setPropertyTax(sanitized)}
                sanitizeOptions={{ min: 0, max: LOAN_AMOUNT_MAX }}
                inputMode="decimal"
                aria-invalid={calc.errorField === "propertyTax" ? "true" : "false"}
                aria-describedby={
                  calc.errorField === "propertyTax" ? "mortgage-error" : undefined
                }
                className={calc.errorField === "propertyTax" ? "border-red-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="home-insurance">Annual Home Insurance ($) (Optional)</Label>
              <SafeNumberInput
                id="home-insurance"
                placeholder="0"
                value={homeInsurance}
                onChange={(sanitized) => setHomeInsurance(sanitized)}
                sanitizeOptions={{ min: 0, max: LOAN_AMOUNT_MAX }}
                inputMode="decimal"
                aria-invalid={calc.errorField === "homeInsurance" ? "true" : "false"}
                aria-describedby={
                  calc.errorField === "homeInsurance" ? "mortgage-error" : undefined
                }
                className={calc.errorField === "homeInsurance" ? "border-red-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pmi">PMI Rate (%) (Optional)</Label>
              <SafeNumberInput
                id="pmi"
                placeholder="0.00"
                value={pmi}
                onChange={(sanitized) => setPmi(sanitized)}
                sanitizeOptions={{ min: 0, max: PMI_RATE_MAX }}
                inputMode="decimal"
                aria-invalid={calc.errorField === "pmi" ? "true" : "false"}
                aria-describedby={
                  calc.errorField === "pmi" ? "mortgage-error" : undefined
                }
                className={calc.errorField === "pmi" ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Range: 0% to {PMI_RATE_MAX}%
              </p>
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

          {/* Error Banner */}
          {calc.error && (
            <div
              id="mortgage-error"
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
            <CardTitle>Mortgage Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">Monthly Payment Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Principal & Interest:</span>
                    <span
                      className="font-medium break-all text-right"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {formatCurrency(calc.monthlyPayment!)}
                    </span>
                  </div>
                  {calc.propertyTax! > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Property Tax:</span>
                      <span
                        className="font-medium break-all text-right"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {formatCurrency(calc.monthlyTax!)}
                      </span>
                    </div>
                  )}
                  {calc.homeInsurance! > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Home Insurance:</span>
                      <span
                        className="font-medium break-all text-right"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {formatCurrency(calc.monthlyInsurance!)}
                      </span>
                    </div>
                  )}
                  {calc.pmiRate! > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground flex-shrink-0">PMI:</span>
                      <span
                        className="font-medium break-all text-right"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {formatCurrency(calc.monthlyPmi!)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-xs sm:text-sm gap-2">
                    <span className="font-semibold flex-shrink-0">Total Monthly Payment:</span>
                    <span
                      className="font-bold text-base sm:text-lg break-all text-right"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {formatCurrency(calc.totalMonthlyPayment!)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">Loan Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Loan Amount (After Down Payment):</span>
                    <span
                      className="font-medium break-all text-right"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {formatCurrency(calc.actualLoanAmount!)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Total Interest Paid:</span>
                    <span
                      className="font-medium break-all text-right"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {formatCurrency(calc.totalInterest!)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Total Amount Paid:</span>
                    <span
                      className="font-medium break-all text-right"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {formatCurrency(calc.totalPayment!)}
                    </span>
                  </div>
                  {calc.downPayment! > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Down Payment:</span>
                      <span
                        className="font-medium break-all text-right"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {formatCurrency(calc.downPayment!)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-muted p-3 sm:p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-sm sm:text-base">Key Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-muted-foreground">Interest Rate:</span>
                  <span className="font-medium">{calc.interestRate!.toFixed(2)}%</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-muted-foreground">Loan Term:</span>
                  <span className="font-medium">{calc.loanTerm!} years</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-muted-foreground">Monthly Rate:</span>
                  <span className="font-medium">{(calc.interestRate! / 12).toFixed(3)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mortgage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Consider making extra principal payments to reduce total interest</li>
            <li>• Shop around for the best interest rates and loan terms</li>
            <li>• Factor in closing costs when budgeting for your home purchase</li>
            <li>• PMI is typically required when down payment is less than 20%</li>
            <li>• Property taxes and insurance costs vary by location</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

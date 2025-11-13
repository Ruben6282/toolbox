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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, RotateCcw } from "lucide-react";
import { sanitizeNumber } from "@/lib/security";

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
      if (/[eE]/.test(trimmedLoanAmount)) {
        return {
          error: "Scientific notation is not allowed. Please enter a standard number.",
          errorField: "loanAmount",
        };
      }

      const sanLoan = sanitizeNumber(trimmedLoanAmount, 0, LOAN_AMOUNT_MAX);
      if (sanLoan === null) {
        const raw = parseFloat(trimmedLoanAmount);
        if (isNaN(raw) || !isFinite(raw)) {
          return {
            error: "Invalid loan amount. Please enter a valid number.",
            errorField: "loanAmount",
          };
        }
        return {
          error: `Loan amount must be between $0 and $${LOAN_AMOUNT_MAX.toLocaleString()}.`,
          errorField: "loanAmount",
        };
      }
      loanAmountNum = sanLoan;
    }

    // --- Interest Rate Validation ---
    let interestRateNum = 0;
    const trimmedRate = interestRate.trim();
    if (trimmedRate !== "") {
      if (/[eE]/.test(trimmedRate)) {
        return {
          error: "Scientific notation is not allowed. Please enter a standard number.",
          errorField: "interestRate",
        };
      }

      const sanRate = sanitizeNumber(trimmedRate, INTEREST_RATE_MIN, INTEREST_RATE_MAX);
      if (sanRate === null) {
        const raw = parseFloat(trimmedRate);
        if (isNaN(raw) || !isFinite(raw)) {
          return {
            error: "Invalid interest rate. Please enter a valid number.",
            errorField: "interestRate",
          };
        }
        return {
          error: `Interest rate must be between ${INTEREST_RATE_MIN}% and ${INTEREST_RATE_MAX}%.`,
          errorField: "interestRate",
        };
      }
      interestRateNum = sanRate;
    }

    // --- Loan Term Validation ---
    let loanTermNum = 30; // Default to 30 years
    const trimmedTerm = loanTerm.trim();
    if (trimmedTerm !== "") {
      if (/[eE.]/.test(trimmedTerm)) {
        return {
          error: "Loan term must be a whole number of years.",
          errorField: "loanTerm",
        };
      }

      const sanTerm = sanitizeNumber(trimmedTerm, LOAN_TERM_MIN, LOAN_TERM_MAX);
      if (sanTerm === null) {
        const raw = parseInt(trimmedTerm);
        if (isNaN(raw) || !isFinite(raw)) {
          return {
            error: "Invalid loan term. Please enter a valid number.",
            errorField: "loanTerm",
          };
        }
        return {
          error: `Loan term must be between ${LOAN_TERM_MIN} and ${LOAN_TERM_MAX} years.`,
          errorField: "loanTerm",
        };
      }
      // Ensure it's an integer
      loanTermNum = Math.floor(sanTerm);
    }

    // --- Down Payment Validation ---
    let downPaymentNum = 0;
    const trimmedDown = downPayment.trim();
    if (trimmedDown !== "") {
      if (/[eE]/.test(trimmedDown)) {
        return {
          error: "Scientific notation is not allowed. Please enter a standard number.",
          errorField: "downPayment",
        };
      }

      const sanDown = sanitizeNumber(trimmedDown, 0, LOAN_AMOUNT_MAX);
      if (sanDown === null) {
        const raw = parseFloat(trimmedDown);
        if (isNaN(raw) || !isFinite(raw)) {
          return {
            error: "Invalid down payment. Please enter a valid number.",
            errorField: "downPayment",
          };
        }
        return {
          error: `Down payment must be between $0 and $${LOAN_AMOUNT_MAX.toLocaleString()}.`,
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
      if (/[eE]/.test(trimmedTax)) {
        return {
          error: "Scientific notation is not allowed. Please enter a standard number.",
          errorField: "propertyTax",
        };
      }

      const sanTax = sanitizeNumber(trimmedTax, 0, LOAN_AMOUNT_MAX);
      if (sanTax === null) {
        const raw = parseFloat(trimmedTax);
        if (isNaN(raw) || !isFinite(raw)) {
          return {
            error: "Invalid property tax. Please enter a valid number.",
            errorField: "propertyTax",
          };
        }
        return {
          error: `Property tax must be between $0 and $${LOAN_AMOUNT_MAX.toLocaleString()}.`,
          errorField: "propertyTax",
        };
      }
      propertyTaxNum = sanTax;
    }

    // --- Home Insurance Validation ---
    let homeInsuranceNum = 0;
    const trimmedIns = homeInsurance.trim();
    if (trimmedIns !== "") {
      if (/[eE]/.test(trimmedIns)) {
        return {
          error: "Scientific notation is not allowed. Please enter a standard number.",
          errorField: "homeInsurance",
        };
      }

      const sanIns = sanitizeNumber(trimmedIns, 0, LOAN_AMOUNT_MAX);
      if (sanIns === null) {
        const raw = parseFloat(trimmedIns);
        if (isNaN(raw) || !isFinite(raw)) {
          return {
            error: "Invalid home insurance. Please enter a valid number.",
            errorField: "homeInsurance",
          };
        }
        return {
          error: `Home insurance must be between $0 and $${LOAN_AMOUNT_MAX.toLocaleString()}.`,
          errorField: "homeInsurance",
        };
      }
      homeInsuranceNum = sanIns;
    }

    // --- PMI Rate Validation ---
    let pmiRateNum = 0;
    const trimmedPmi = pmi.trim();
    if (trimmedPmi !== "") {
      if (/[eE]/.test(trimmedPmi)) {
        return {
          error: "Scientific notation is not allowed. Please enter a standard number.",
          errorField: "pmi",
        };
      }

      const sanPmi = sanitizeNumber(trimmedPmi, 0, PMI_RATE_MAX);
      if (sanPmi === null) {
        const raw = parseFloat(trimmedPmi);
        if (isNaN(raw) || !isFinite(raw)) {
          return {
            error: "Invalid PMI rate. Please enter a valid number.",
            errorField: "pmi",
          };
        }
        return {
          error: `PMI rate must be between 0% and ${PMI_RATE_MAX}%.`,
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
    const actualLoanAmount = Math.round((loanAmountNum - downPaymentNum) * 100) / 100;

    // Division by zero protection
    if (actualLoanAmount <= 0) {
      return {
        error: "Loan amount after down payment must be greater than $0.",
        errorField: "downPayment",
      };
    }

    const monthlyRate = interestRateNum / 100 / 12;
    const numPayments = loanTermNum * 12;

    // Check for edge case: 0% interest rate
    let monthlyPayment: number;
    if (monthlyRate === 0) {
      // With 0% interest, payment is just principal divided by months
      monthlyPayment = actualLoanAmount / numPayments;
    } else {
      // Standard mortgage formula
      const denominator = Math.pow(1 + monthlyRate, numPayments) - 1;

      // Division by zero protection
      if (denominator === 0 || !Number.isFinite(denominator)) {
        return {
          error: "Calculation error: Invalid interest rate or loan term combination.",
          errorField: "interestRate",
        };
      }

      const numerator = actualLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments);

      if (!Number.isFinite(numerator)) {
        return {
          error: "Calculation error: Loan parameters produce invalid result.",
          errorField: null,
        };
      }

      monthlyPayment = numerator / denominator;
    }

    // Round to 2 decimal places
    monthlyPayment = Math.round(monthlyPayment * 100) / 100;

    const totalPayment = Math.round(monthlyPayment * numPayments * 100) / 100;
    const totalInterest = Math.round((totalPayment - actualLoanAmount) * 100) / 100;

    // Calculate monthly costs
    const monthlyTax = Math.round((propertyTaxNum / 12) * 100) / 100;
    const monthlyInsurance = Math.round((homeInsuranceNum / 12) * 100) / 100;
    // PMI is calculated on actual loan amount after down payment
    const monthlyPmi = Math.round((pmiRateNum / 100 * actualLoanAmount / 12) * 100) / 100;

    const totalMonthlyPayment = Math.round(
      (monthlyPayment + monthlyTax + monthlyInsurance + monthlyPmi) * 100
    ) / 100;

    // Final finite checks
    if (
      !Number.isFinite(monthlyPayment) ||
      !Number.isFinite(totalPayment) ||
      !Number.isFinite(totalInterest) ||
      !Number.isFinite(monthlyTax) ||
      !Number.isFinite(monthlyInsurance) ||
      !Number.isFinite(monthlyPmi) ||
      !Number.isFinite(totalMonthlyPayment)
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
              <Input
                id="loan-amount"
                type="number"
                placeholder="0"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                min="0"
                step="0.01"
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
              <Input
                id="interest-rate"
                type="number"
                placeholder="0.00"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                min="0"
                max="30"
                step="0.01"
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
              <Input
                id="loan-term"
                type="number"
                placeholder="30"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                min="1"
                max="50"
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
              <Input
                id="down-payment"
                type="number"
                placeholder="0"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                min="0"
                step="0.01"
                aria-invalid={calc.errorField === "downPayment" ? "true" : "false"}
                aria-describedby={
                  calc.errorField === "downPayment" ? "mortgage-error" : undefined
                }
                className={calc.errorField === "downPayment" ? "border-red-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-tax">Annual Property Tax ($) (Optional)</Label>
              <Input
                id="property-tax"
                type="number"
                placeholder="0"
                value={propertyTax}
                onChange={(e) => setPropertyTax(e.target.value)}
                min="0"
                step="0.01"
                aria-invalid={calc.errorField === "propertyTax" ? "true" : "false"}
                aria-describedby={
                  calc.errorField === "propertyTax" ? "mortgage-error" : undefined
                }
                className={calc.errorField === "propertyTax" ? "border-red-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="home-insurance">Annual Home Insurance ($) (Optional)</Label>
              <Input
                id="home-insurance"
                type="number"
                placeholder="0"
                value={homeInsurance}
                onChange={(e) => setHomeInsurance(e.target.value)}
                min="0"
                step="0.01"
                aria-invalid={calc.errorField === "homeInsurance" ? "true" : "false"}
                aria-describedby={
                  calc.errorField === "homeInsurance" ? "mortgage-error" : undefined
                }
                className={calc.errorField === "homeInsurance" ? "border-red-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pmi">PMI Rate (%) (Optional)</Label>
              <Input
                id="pmi"
                type="number"
                placeholder="0.00"
                value={pmi}
                onChange={(e) => setPmi(e.target.value)}
                min="0"
                max="5"
                step="0.01"
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
                      {currencyFormatter.format(calc.monthlyPayment!)}
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
                        {currencyFormatter.format(calc.monthlyTax!)}
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
                        {currencyFormatter.format(calc.monthlyInsurance!)}
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
                        {currencyFormatter.format(calc.monthlyPmi!)}
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
                      {currencyFormatter.format(calc.totalMonthlyPayment!)}
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
                      {currencyFormatter.format(calc.actualLoanAmount!)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Total Interest Paid:</span>
                    <span
                      className="font-medium break-all text-right"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {currencyFormatter.format(calc.totalInterest!)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Total Amount Paid:</span>
                    <span
                      className="font-medium break-all text-right"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {currencyFormatter.format(calc.totalPayment!)}
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
                        {currencyFormatter.format(calc.downPayment!)}
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

/**
 * MortgageCalculator - Enterprise-grade mortgage calculation tool
 *
 * Security & UX Features:
 * - Required core fields: loan amount, interest rate, loan term
 * - Optional fields: down payment, property tax, home insurance, PMI
 * - Input Sanitization: safeNumber() + SafeNumberInput with min/max
 * - Range Validation: Explicit bounds for all numeric fields
 * - No Real-Time Calculation: Uses an explicit "Calculate" button
 * - Error Handling: Per-field errors, multi-field display after Calculate
 * - Max Handling: UI clamping and clear error messages (aligned with DiscountCalculator)
 * - Results Visibility: Hidden until a successful calculation
 * - Accessibility: aria-invalid, aria-describedby, aria-live on results and errors
 * - Localization: Intl.NumberFormat for currency-safe, locale-aware formatting
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Label } from "@/components/ui/label";
import { AlertCircle, RotateCcw } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatCurrency } from "@/lib/safe-math";
import { validateRange } from "@/lib/validators";
import { notify } from "@/lib/notify";

/* LIMITS */
const LOAN_AMOUNT_MAX = 1e9; // $1,000,000,000
const INTEREST_RATE_MIN = 0;
const INTEREST_RATE_MAX = 30; // 30% max
const LOAN_TERM_MIN = 1;
const LOAN_TERM_MAX = 50; // 50 years max
const PMI_RATE_MAX = 5; // 5% max

type MortgageErrors = {
  loanAmount?: string;
  interestRate?: string;
  loanTerm?: string;
  downPayment?: string;
  propertyTax?: string;
  homeInsurance?: string;
  pmi?: string;
};

type MortgageResult = {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  downPayment: number;
  propertyTax: number;
  homeInsurance: number;
  pmiRate: number;
  monthlyPayment: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyPmi: number;
  totalMonthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  actualLoanAmount: number;
};

export const MortgageCalculator = () => {
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [loanTerm, setLoanTerm] = useState("30");
  const [downPayment, setDownPayment] = useState("");
  const [propertyTax, setPropertyTax] = useState("");
  const [homeInsurance, setHomeInsurance] = useState("");
  const [pmi, setPmi] = useState("");

  const [errors, setErrors] = useState<MortgageErrors>({});
  const [result, setResult] = useState<MortgageResult | null>(null);
  const [calculated, setCalculated] = useState(false);

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

  const clearFieldError = (field: keyof MortgageErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next: MortgageErrors = { ...prev, [field]: undefined };
      if (
        !next.loanAmount &&
        !next.interestRate &&
        !next.loanTerm &&
        !next.downPayment &&
        !next.propertyTax &&
        !next.homeInsurance &&
        !next.pmi
      ) {
        return {};
      }
      return next;
    });
  };

  /* INPUT HANDLERS WITH UI-CLAMP LOGIC (aligned with DiscountCalculator) */

  const handleLoanAmountChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (n > LOAN_AMOUNT_MAX) {
        const msg = `Loan amount cannot exceed ${currencyFormatter.format(
          LOAN_AMOUNT_MAX
        )}`;
        setErrors({ loanAmount: msg });
        setLoanAmount(String(LOAN_AMOUNT_MAX));
        return;
      }
      if (n < 0) {
        const msg = "Loan amount cannot be negative.";
        setErrors({ loanAmount: msg });
        setLoanAmount("0");
        return;
      }
    }

    // Preserve clamp error when value equals the max we just applied to avoid flicker
    const loanMaxMsg = `Loan amount cannot exceed ${currencyFormatter.format(
      LOAN_AMOUNT_MAX
    )}`;
    if (n === LOAN_AMOUNT_MAX && errors.loanAmount === loanMaxMsg) {
      setLoanAmount(val);
      return;
    }

    setErrors({});
    setLoanAmount(val);
  };

  const handleInterestRateChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (n > INTEREST_RATE_MAX) {
        setErrors({
          interestRate: `Interest rate cannot exceed ${INTEREST_RATE_MAX}%`,
        });
        setInterestRate(String(INTEREST_RATE_MAX));
        return;
      }
      if (n < INTEREST_RATE_MIN) {
        setErrors({
          interestRate: `Interest rate cannot be less than ${INTEREST_RATE_MIN}%`,
        });
        setInterestRate(String(INTEREST_RATE_MIN));
        return;
      }
    }

    clearFieldError("interestRate");
    setInterestRate(val);
  };

  const handleLoanTermChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (!Number.isInteger(n)) {
        setErrors({
          loanTerm: "Loan term must be a whole number of years.",
        });
      } else {
        clearFieldError("loanTerm");
      }

      if (n > LOAN_TERM_MAX) {
        setErrors({
          loanTerm: `Loan term cannot exceed ${LOAN_TERM_MAX} years`,
        });
        setLoanTerm(String(LOAN_TERM_MAX));
        return;
      }
      if (n < LOAN_TERM_MIN) {
        setErrors({
          loanTerm: `Loan term cannot be less than ${LOAN_TERM_MIN} year`,
        });
        setLoanTerm(String(LOAN_TERM_MIN));
        return;
      }
    } else {
      // allow empty while typing
      clearFieldError("loanTerm");
    }

    setLoanTerm(val);
  };

  const handleDownPaymentChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (n > LOAN_AMOUNT_MAX) {
        const msg = `Down payment cannot exceed ${currencyFormatter.format(
          LOAN_AMOUNT_MAX
        )}`;
        setErrors({ downPayment: msg });
        setDownPayment(String(LOAN_AMOUNT_MAX));
        return;
      }
      if (n < 0) {
        const msg = "Down payment cannot be negative.";
        setErrors({ downPayment: msg });
        setDownPayment("0");
        return;
      }
    }

    // Preserve clamp error when value equals the max we just applied to avoid flicker
    const downMaxMsg = `Down payment cannot exceed ${currencyFormatter.format(
      LOAN_AMOUNT_MAX
    )}`;
    if (n === LOAN_AMOUNT_MAX && errors.downPayment === downMaxMsg) {
      setDownPayment(val);
      return;
    }

    setErrors({});
    setDownPayment(val);
  };

  const handlePropertyTaxChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (n > LOAN_AMOUNT_MAX) {
        const msg = `Annual property tax cannot exceed ${currencyFormatter.format(
          LOAN_AMOUNT_MAX
        )}`;
        setErrors({ propertyTax: msg });
        setPropertyTax(String(LOAN_AMOUNT_MAX));
        return;
      }
      if (n < 0) {
        const msg = "Annual property tax cannot be negative.";
        setErrors({ propertyTax: msg });
        setPropertyTax("0");
        return;
      }
    }

    // Preserve clamp error when value equals the max we just applied to avoid flicker
    const taxMaxMsg = `Annual property tax cannot exceed ${currencyFormatter.format(
      LOAN_AMOUNT_MAX
    )}`;
    if (n === LOAN_AMOUNT_MAX && errors.propertyTax === taxMaxMsg) {
      setPropertyTax(val);
      return;
    }

    setErrors({});
    setPropertyTax(val);
  };

  const handleHomeInsuranceChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (n > LOAN_AMOUNT_MAX) {
        const msg = `Annual home insurance cannot exceed ${currencyFormatter.format(
          LOAN_AMOUNT_MAX
        )}`;
        setErrors({ homeInsurance: msg });
        setHomeInsurance(String(LOAN_AMOUNT_MAX));
        return;
      }
      if (n < 0) {
        const msg = "Annual home insurance cannot be negative.";
        setErrors({ homeInsurance: msg });
        setHomeInsurance("0");
        return;
      }
    }

    // Preserve clamp error when value equals the max we just applied to avoid flicker
    const insMaxMsg = `Annual home insurance cannot exceed ${currencyFormatter.format(
      LOAN_AMOUNT_MAX
    )}`;
    if (n === LOAN_AMOUNT_MAX && errors.homeInsurance === insMaxMsg) {
      setHomeInsurance(val);
      return;
    }

    setErrors({});
    setHomeInsurance(val);
  };

  const handlePmiChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (n > PMI_RATE_MAX) {
        setErrors({
          pmi: `PMI rate cannot exceed ${PMI_RATE_MAX}%`,
        });
        setPmi(String(PMI_RATE_MAX));
        return;
      }
      if (n < 0) {
        setErrors({
          pmi: "PMI rate cannot be negative.",
        });
        setPmi("0");
        return;
      }
    }

    clearFieldError("pmi");
    setPmi(val);
  };

  /* MAIN CALCULATE BUTTON HANDLER (DiscountCalculator pattern) */

  const onCalculate = () => {
    setCalculated(false);
    setResult(null);

    const newErrors: MortgageErrors = {};

    const loanStr = loanAmount.trim();
    const rateStr = interestRate.trim();
    const termStr = loanTerm.trim();
    const downStr = downPayment.trim();
    const taxStr = propertyTax.trim();
    const insStr = homeInsurance.trim();
    const pmiStr = pmi.trim();

    // Required presence checks
    if (!loanStr) newErrors.loanAmount = "Loan amount is required.";
    if (!rateStr) newErrors.interestRate = "Interest rate is required.";
    if (!termStr) newErrors.loanTerm = "Loan term is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    // Parse with safeNumber + validateRange

    const loanNum = safeNumber(loanStr, { min: 0, max: LOAN_AMOUNT_MAX });
    const rateNum = safeNumber(rateStr, {
      min: INTEREST_RATE_MIN,
      max: INTEREST_RATE_MAX,
    });
    const termNum = safeNumber(termStr, {
      min: LOAN_TERM_MIN,
      max: LOAN_TERM_MAX,
      allowDecimal: false,
    });

    if (loanNum === null) {
      newErrors.loanAmount = `Loan amount must be between 0 and ${currencyFormatter.format(
        LOAN_AMOUNT_MAX
      )}`;
    } else {
      const loanRange = validateRange(loanNum, 0, LOAN_AMOUNT_MAX);
      if (loanRange !== true) {
        newErrors.loanAmount =
          typeof loanRange === "string"
            ? loanRange
            : `Loan amount must be between 0 and ${currencyFormatter.format(
                LOAN_AMOUNT_MAX
              )}`;
      } else if (loanNum <= 0) {
        newErrors.loanAmount = "Loan amount must be greater than 0.";
      }
    }

    if (rateNum === null) {
      newErrors.interestRate = `Interest rate must be between ${INTEREST_RATE_MIN}% and ${INTEREST_RATE_MAX}%`;
    } else {
      const rateRange = validateRange(
        rateNum,
        INTEREST_RATE_MIN,
        INTEREST_RATE_MAX
      );
      if (rateRange !== true) {
        newErrors.interestRate =
          typeof rateRange === "string"
            ? rateRange
            : `Interest rate must be between ${INTEREST_RATE_MIN}% and ${INTEREST_RATE_MAX}%.`;
      }
    }

    if (termNum === null) {
      newErrors.loanTerm =
        "Loan term must be a whole number between 1 and 50 years.";
    } else {
      const termRange = validateRange(termNum, LOAN_TERM_MIN, LOAN_TERM_MAX);
      if (termRange !== true) {
        newErrors.loanTerm =
          typeof termRange === "string"
            ? termRange
            : `Loan term must be between ${LOAN_TERM_MIN} and ${LOAN_TERM_MAX} years.`;
      }
    }

    // Optional fields -> 0 if empty, otherwise validate

    let downNum = 0;
    if (downStr) {
      const val = safeNumber(downStr, { min: 0, max: LOAN_AMOUNT_MAX });
      if (val === null) {
        newErrors.downPayment =
          "Down payment must be between 0 and the maximum loan amount.";
      } else {
        const range = validateRange(val, 0, LOAN_AMOUNT_MAX);
        if (range !== true) {
          newErrors.downPayment =
            typeof range === "string"
              ? range
              : `Down payment must be between 0 and ${currencyFormatter.format(
                  LOAN_AMOUNT_MAX
                )}`;
        } else {
          downNum = val;
        }
      }
    }

    let taxNum = 0;
    if (taxStr) {
      const val = safeNumber(taxStr, { min: 0, max: LOAN_AMOUNT_MAX });
      if (val === null) {
        newErrors.propertyTax =
          "Annual property tax must be between 0 and the maximum loan amount.";
      } else {
        const range = validateRange(val, 0, LOAN_AMOUNT_MAX);
        if (range !== true) {
          newErrors.propertyTax =
            typeof range === "string"
              ? range
              : `Annual property tax must be between 0 and ${currencyFormatter.format(
                  LOAN_AMOUNT_MAX
                )}`;
        } else {
          taxNum = val;
        }
      }
    }

    let insNum = 0;
    if (insStr) {
      const val = safeNumber(insStr, { min: 0, max: LOAN_AMOUNT_MAX });
      if (val === null) {
        newErrors.homeInsurance =
          "Annual home insurance must be between 0 and the maximum loan amount.";
      } else {
        const range = validateRange(val, 0, LOAN_AMOUNT_MAX);
        if (range !== true) {
          newErrors.homeInsurance =
            typeof range === "string"
              ? range
              : `Annual home insurance must be between 0 and ${currencyFormatter.format(
                  LOAN_AMOUNT_MAX
                )}`;
        } else {
          insNum = val;
        }
      }
    }

    let pmiNum = 0;
    if (pmiStr) {
      const val = safeNumber(pmiStr, { min: 0, max: PMI_RATE_MAX });
      if (val === null) {
        newErrors.pmi = `PMI rate must be between 0% and ${PMI_RATE_MAX}%.`;
      } else {
        const range = validateRange(val, 0, PMI_RATE_MAX);
        if (range !== true) {
          newErrors.pmi =
            typeof range === "string"
              ? range
              : `PMI rate must be between 0% and ${PMI_RATE_MAX}%.`;
        } else {
          pmiNum = val;
        }
      }
    }

    // Down payment vs loan check (only if both valid)
    if (
      loanNum !== null &&
      loanNum > 0 &&
      downNum > loanNum &&
      !newErrors.downPayment
    ) {
      newErrors.downPayment = "Down payment cannot exceed the loan amount.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    // Safe to assert non-null now
    const loan = loanNum!;
    const rate = rateNum!;
    const termYears = termNum!;

    // Actual loan amount after down payment
    const actualLoanAmount = safeCalc((D) => D(loan).minus(downNum))!;
    if (!Number.isFinite(actualLoanAmount) || actualLoanAmount <= 0) {
      setErrors({
        downPayment:
          "Loan amount after down payment must be greater than 0.",
      });
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    const months = safeCalc((D) => D(termYears).mul(12))!;
    if (!Number.isFinite(months) || months <= 0) {
      setErrors({
        loanTerm: "Loan term must result in at least one monthly payment.",
      });
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    const monthlyRate = safeCalc((D) => D(rate).div(100).div(12))!;
    if (!Number.isFinite(monthlyRate) || monthlyRate < 0) {
      setErrors({
        interestRate: "Interest rate calculation failed.",
      });
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    let monthlyPayment: number;

    if (monthlyRate === 0) {
      // 0% interest: straight division
      monthlyPayment = safeCalc((D) =>
        D(actualLoanAmount).div(months)
      )!;
    } else {
      const factor = safeCalc((D) =>
        D(1).plus(monthlyRate).pow(months)
      )!;
      const denominator = safeCalc((D) => D(factor).minus(1))!;
      const numerator = safeCalc((D) =>
        D(actualLoanAmount).mul(monthlyRate).mul(factor)
      )!;

      if (
        !Number.isFinite(factor) ||
        !Number.isFinite(denominator) ||
        denominator === 0 ||
        !Number.isFinite(numerator)
      ) {
        setErrors({
          interestRate:
            "Calculation error: invalid combination of interest rate and loan term.",
        });
        notify.error("Please fix the highlighted fields before calculating.");
        return;
      }

      monthlyPayment = safeCalc((D) => D(numerator).div(denominator))!;
    }

    if (
      !Number.isFinite(monthlyPayment) ||
      monthlyPayment <= 0
    ) {
      setErrors({
        loanAmount:
          "Monthly payment calculation failed. Please check your inputs.",
      });
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    const totalPayment = safeCalc((D) =>
      D(monthlyPayment).mul(months)
    )!;
    const totalInterest = safeCalc((D) =>
      D(totalPayment).minus(actualLoanAmount)
    )!;

    const monthlyTax = safeCalc((D) => D(taxNum).div(12))!;
    const monthlyInsurance = safeCalc((D) => D(insNum).div(12))!;
    const monthlyPmi = safeCalc((D) =>
      D(pmiNum).div(100).mul(actualLoanAmount).div(12)
    )!;

    const totalMonthlyPayment = safeCalc((D) =>
      D(monthlyPayment)
        .plus(monthlyTax)
        .plus(monthlyInsurance)
        .plus(monthlyPmi)
    )!;

    if (
      !Number.isFinite(totalPayment) ||
      !Number.isFinite(totalInterest) ||
      !Number.isFinite(monthlyTax) ||
      !Number.isFinite(monthlyInsurance) ||
      !Number.isFinite(monthlyPmi) ||
      !Number.isFinite(totalMonthlyPayment)
    ) {
      setErrors({
        loanAmount:
          "Calculation resulted in an invalid number. Please check your inputs.",
      });
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    setErrors({});
    setResult({
      loanAmount: loan,
      interestRate: rate,
      loanTerm: termYears,
      downPayment: downNum,
      propertyTax: taxNum,
      homeInsurance: insNum,
      pmiRate: pmiNum,
      monthlyPayment,
      monthlyTax,
      monthlyInsurance,
      monthlyPmi,
      totalMonthlyPayment,
      totalPayment,
      totalInterest,
      actualLoanAmount,
    });

    setCalculated(true);
    notify.success("Mortgage calculation completed.");
  };

  const onClear = () => {
    setLoanAmount("");
    setInterestRate("");
    setLoanTerm("30");
    setDownPayment("");
    setPropertyTax("");
    setHomeInsurance("");
    setPmi("");
    setErrors({});
    setResult(null);
    setCalculated(false);
  };

  const hasError = Boolean(
    errors.loanAmount ||
      errors.interestRate ||
      errors.loanTerm ||
      errors.downPayment ||
      errors.propertyTax ||
      errors.homeInsurance ||
      errors.pmi
  );

  const showResults = calculated && result && !hasError;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mortgage Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* INPUT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Loan Amount (required) */}
            <div className="space-y-2">
              <Label htmlFor="loan-amount">Loan Amount ($)</Label>
              <SafeNumberInput
                id="loan-amount"
                placeholder="0"
                value={loanAmount}
                onChange={handleLoanAmountChange}
                sanitizeOptions={{
                  min: 0,
                  max: LOAN_AMOUNT_MAX,
                  allowDecimal: true,
                  maxLength: String(LOAN_AMOUNT_MAX).length,
                }}
                inputMode="decimal"
                aria-invalid={errors.loanAmount ? "true" : "false"}
                aria-describedby={
                  errors.loanAmount ? "mortgage-loan-err" : undefined
                }
                className={errors.loanAmount ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Max: {currencyFormatter.format(LOAN_AMOUNT_MAX)}
              </p>
            </div>

            {/* Interest Rate (required) */}
            <div className="space-y-2">
              <Label htmlFor="interest-rate">Interest Rate (%)</Label>
              <SafeNumberInput
                id="interest-rate"
                placeholder="0.00"
                value={interestRate}
                onChange={handleInterestRateChange}
                sanitizeOptions={{
                  min: INTEREST_RATE_MIN,
                  max: INTEREST_RATE_MAX,
                  allowDecimal: true,
                  maxLength: 5,
                }}
                inputMode="decimal"
                aria-invalid={errors.interestRate ? "true" : "false"}
                aria-describedby={
                  errors.interestRate ? "mortgage-interest-err" : undefined
                }
                className={errors.interestRate ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Range: {INTEREST_RATE_MIN}% – {INTEREST_RATE_MAX}%
              </p>
            </div>

            {/* Loan Term (required) */}
            <div className="space-y-2">
              <Label htmlFor="loan-term">Loan Term (Years)</Label>
              <SafeNumberInput
                id="loan-term"
                placeholder="30"
                value={loanTerm}
                onChange={handleLoanTermChange}
                sanitizeOptions={{
                  min: LOAN_TERM_MIN,
                  max: LOAN_TERM_MAX,
                  allowDecimal: false,
                  maxLength: 3,
                }}
                inputMode="numeric"
                aria-invalid={errors.loanTerm ? "true" : "false"}
                aria-describedby={
                  errors.loanTerm ? "mortgage-term-err" : undefined
                }
                className={errors.loanTerm ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Range: {LOAN_TERM_MIN} – {LOAN_TERM_MAX} years
              </p>
            </div>

            {/* Down Payment (optional) */}
            <div className="space-y-2">
              <Label htmlFor="down-payment">Down Payment ($) (Optional)</Label>
              <SafeNumberInput
                id="down-payment"
                placeholder="0"
                value={downPayment}
                onChange={handleDownPaymentChange}
                sanitizeOptions={{
                  min: 0,
                  max: LOAN_AMOUNT_MAX,
                  allowDecimal: true,
                  maxLength: String(LOAN_AMOUNT_MAX).length,
                }}
                inputMode="decimal"
                aria-invalid={errors.downPayment ? "true" : "false"}
                aria-describedby={
                  errors.downPayment ? "mortgage-down-err" : undefined
                }
                className={errors.downPayment ? "border-red-500" : ""}
              />
            </div>

            {/* Property Tax (optional) */}
            <div className="space-y-2">
              <Label htmlFor="property-tax">
                Annual Property Tax ($) (Optional)
              </Label>
              <SafeNumberInput
                id="property-tax"
                placeholder="0"
                value={propertyTax}
                onChange={handlePropertyTaxChange}
                sanitizeOptions={{
                  min: 0,
                  max: LOAN_AMOUNT_MAX,
                  allowDecimal: true,
                  maxLength: String(LOAN_AMOUNT_MAX).length,
                }}
                inputMode="decimal"
                aria-invalid={errors.propertyTax ? "true" : "false"}
                aria-describedby={
                  errors.propertyTax ? "mortgage-tax-err" : undefined
                }
                className={errors.propertyTax ? "border-red-500" : ""}
              />
            </div>

            {/* Home Insurance (optional) */}
            <div className="space-y-2">
              <Label htmlFor="home-insurance">
                Annual Home Insurance ($) (Optional)
              </Label>
              <SafeNumberInput
                id="home-insurance"
                placeholder="0"
                value={homeInsurance}
                onChange={handleHomeInsuranceChange}
                sanitizeOptions={{
                  min: 0,
                  max: LOAN_AMOUNT_MAX,
                  allowDecimal: true,
                  maxLength: String(LOAN_AMOUNT_MAX).length,
                }}
                inputMode="decimal"
                aria-invalid={errors.homeInsurance ? "true" : "false"}
                aria-describedby={
                  errors.homeInsurance ? "mortgage-ins-err" : undefined
                }
                className={errors.homeInsurance ? "border-red-500" : ""}
              />
            </div>

            {/* PMI (optional) */}
            <div className="space-y-2">
              <Label htmlFor="pmi">PMI Rate (%) (Optional)</Label>
              <SafeNumberInput
                id="pmi"
                placeholder="0.00"
                value={pmi}
                onChange={handlePmiChange}
                sanitizeOptions={{
                  min: 0,
                  max: PMI_RATE_MAX,
                  allowDecimal: true,
                  maxLength: 5,
                }}
                inputMode="decimal"
                aria-invalid={errors.pmi ? "true" : "false"}
                aria-describedby={
                  errors.pmi ? "mortgage-pmi-err" : undefined
                }
                className={errors.pmi ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Range: 0% – {PMI_RATE_MAX}%
              </p>
            </div>
          </div>

          {/* ERROR BANNER (before actions, DiscountCalculator style) */}
          {hasError && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              <div className="space-y-1">
                {errors.loanAmount && (
                  <div id="mortgage-loan-err">{errors.loanAmount}</div>
                )}
                {errors.interestRate && (
                  <div id="mortgage-interest-err">{errors.interestRate}</div>
                )}
                {errors.loanTerm && (
                  <div id="mortgage-term-err">{errors.loanTerm}</div>
                )}
                {errors.downPayment && (
                  <div id="mortgage-down-err">{errors.downPayment}</div>
                )}
                {errors.propertyTax && (
                  <div id="mortgage-tax-err">{errors.propertyTax}</div>
                )}
                {errors.homeInsurance && (
                  <div id="mortgage-ins-err">{errors.homeInsurance}</div>
                )}
                {errors.pmi && (
                  <div id="mortgage-pmi-err">{errors.pmi}</div>
                )}
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
            <CardTitle>Mortgage Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" aria-live="polite">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">
                  Monthly Payment Breakdown
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">
                      Principal &amp; Interest:
                    </span>
                    <span className="font-medium break-all text-right">
                      {formatCurrency(result.monthlyPayment)}
                    </span>
                  </div>
                  {result.propertyTax > 0 && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">
                        Property Tax:
                      </span>
                      <span className="font-medium break-all text-right">
                        {formatCurrency(result.monthlyTax)}
                      </span>
                    </div>
                  )}
                  {result.homeInsurance > 0 && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">
                        Home Insurance:
                      </span>
                      <span className="font-medium break-all text-right">
                        {formatCurrency(result.monthlyInsurance)}
                      </span>
                    </div>
                  )}
                  {result.pmiRate > 0 && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">
                        PMI:
                      </span>
                      <span className="font-medium break-all text-right">
                        {formatCurrency(result.monthlyPmi)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 gap-2">
                    <span className="font-semibold flex-shrink-0">
                      Total Monthly Payment:
                    </span>
                    <span className="font-bold text-base sm:text-lg break-all text-right">
                      {formatCurrency(result.totalMonthlyPayment)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Loan summary */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">
                  Loan Summary
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">
                      Loan Amount (After Down Payment):
                    </span>
                    <span className="font-medium break-all text-right">
                      {formatCurrency(result.actualLoanAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">
                      Total Interest Paid:
                    </span>
                    <span className="font-medium break-all text-right">
                      {formatCurrency(result.totalInterest)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">
                      Total Amount Paid:
                    </span>
                    <span className="font-medium break-all text-right">
                      {formatCurrency(result.totalPayment)}
                    </span>
                  </div>
                  {result.downPayment > 0 && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">
                        Down Payment:
                      </span>
                      <span className="font-medium break-all text-right">
                        {formatCurrency(result.downPayment)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Key info */}
            <div className="bg-muted p-3 sm:p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-sm sm:text-base">
                Key Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-muted-foreground">Interest Rate:</span>
                  <span className="font-medium">
                    {result.interestRate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-muted-foreground">Loan Term:</span>
                  <span className="font-medium">{result.loanTerm} years</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-muted-foreground">Monthly Rate:</span>
                  <span className="font-medium">
                    {(result.interestRate / 12).toFixed(3)}%
                  </span>
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
            <li>• Consider making extra principal payments to reduce total interest.</li>
            <li>• Shop around for the best interest rates and loan terms.</li>
            <li>• Factor in closing costs when budgeting for your home purchase.</li>
            <li>• PMI is typically required when down payment is less than 20%.</li>
            <li>• Property taxes and insurance costs vary significantly by location.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

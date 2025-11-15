/**
 * LoanCalculator - Enterprise-grade loan EMI calculation tool
 *
 * Security & Reliability Features:
 * - Input Sanitization: safeNumber() validates numeric input and rejects NaN/Infinity
 * - Range Clamping: Principal, rate, and term clamped to safe, configurable ranges
 * - Safe Math: Guards against division by zero and overflow in EMI formula
 * - Zero-Interest Handling: Dedicated branch for 0% interest (no division by 0)
 * - Type Safety: Explicit numeric parsing with fallbacks
 * - Error Handling UI: Clear, per-field error messages for invalid input
 * - Localization: Intl.NumberFormat for human-friendly currency formatting
 * - Accessibility: aria-live, aria-invalid, and aria-describedby for screen readers (WCAG 2.1 AA)
 */

import { useMemo, useState } from "react"
import { SafeNumberInput } from "@/components/ui/safe-number-input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { safeNumber } from "@/lib/safe-number"
import { safeCalc, formatCurrency } from "@/lib/safe-math"
import { validateRange } from "@/lib/validators"
import { notify } from "@/lib/notify"

/**
 * Limits chosen so that:
 * - EMI formula ( (P * r * (1+r)^n) / ((1+r)^n - 1) ) never overflows
 * - safeCalc() operations remain stable
 * - Still realistic for real-world loans
 */
const MAX_PRINCIPAL = 1e10 // 10 billion
const MIN_PRINCIPAL = 0

// APR bounds (0–40%) keep (1 + r/12)^months in a safe numeric range
const MIN_RATE = 0
const MAX_RATE = 40 // 40% APR upper bound

// Term bounds (1–40 years) also keep pow() within safe exponent range
const MIN_YEARS = 1
const MAX_YEARS = 40

type LoanResult = {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
}

type LoanErrors = {
  principal?: string
  rate?: string
  years?: string
}

export const LoanCalculator = () => {
  const [principal, setPrincipal] = useState("100000")
  const [rate, setRate] = useState("5")
  const [years, setYears] = useState("30")
  const [result, setResult] = useState<LoanResult | null>(null)
  const [errors, setErrors] = useState<LoanErrors | null>(null)
  const [attempted, setAttempted] = useState(false)
  const [calculated, setCalculated] = useState(false)
  const [snapshot, setSnapshot] = useState<{
    principal: number
    rate: number
    years: number
  } | null>(null)
  const [autoClamped, setAutoClamped] = useState<null | {
    field: "principal" | "rate" | "years"
    clampedTo: string
  }>(null)

  // Currency formatter (locale-aware)
  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }, [])

  const PRINCIPAL_MAX_LENGTH = String(MAX_PRINCIPAL).length
  const RATE_MAX_LENGTH = 6 // allows values like '40.00'
  const YEARS_MAX_LENGTH = String(MAX_YEARS).length

  const setFieldError = (field: keyof LoanErrors, message: string) => {
    setErrors((prev) => ({ ...(prev || {}), [field]: message }))
  }

  const clearFieldError = (field: keyof LoanErrors) => {
    setErrors((prev) => {
      if (!prev) return null
      const next: LoanErrors = { ...prev, [field]: undefined }
      if (!next.principal && !next.rate && !next.years) {
        return null
      }
      return next
    })
  }

  const calculateLoan = (pStr: string, rStr: string, yStr: string): boolean => {
    // Start with a clean error state
    setErrors(null)
    setAttempted(true)

    const hasPrincipal = pStr.trim().length > 0
    const hasRate = rStr.trim().length > 0
    const hasYears = yStr.trim().length > 0

    if (!hasPrincipal || !hasRate || !hasYears) {
      if (!hasPrincipal) setFieldError("principal", "Loan amount is required.")
      if (!hasRate) setFieldError("rate", "Interest rate is required.")
      if (!hasYears) setFieldError("years", "Loan term is required.")
      setResult(null)
      return false
    }

    // Detect raw 'exceed max' cases to show combined exceed errors
    const rawP = pStr.trim()
    const rawR = rStr.trim()
    const rawY = yStr.trim()

    const exceedList: Array<keyof LoanErrors> = []
    const pNum = rawP === "" ? null : Number(rawP)
    const rNum = rawR === "" ? null : Number(rawR)
    const yNum = rawY === "" ? null : Number(rawY)

    if (pNum !== null && !Number.isNaN(pNum) && pNum > MAX_PRINCIPAL) {
      setErrors((prev) => ({
        ...(prev || {}),
        principal: `Loan amount exceeds maximum allowed of ${formatCurrency(
          MAX_PRINCIPAL
        )}`,
      }))
      exceedList.push("principal")
    }

    if (rNum !== null && !Number.isNaN(rNum) && rNum > MAX_RATE) {
      setErrors((prev) => ({
        ...(prev || {}),
        rate: `Interest rate exceeds maximum of ${MAX_RATE}%`,
      }))
      exceedList.push("rate")
    }

    if (yNum !== null && !Number.isNaN(yNum) && yNum > MAX_YEARS) {
      setErrors((prev) => ({
        ...(prev || {}),
        years: `Loan term exceeds maximum of ${MAX_YEARS} years`,
      }))
      exceedList.push("years")
    }

    if (exceedList.length > 0) {
      setResult(null)
      return false
    }

    // Parse with safeNumber inside guaranteed safe bounds
    const principalVal = safeNumber(pStr, {
      min: MIN_PRINCIPAL,
      max: MAX_PRINCIPAL,
    })
    const rateVal = safeNumber(rStr, { min: MIN_RATE, max: MAX_RATE })
    const yearsVal = safeNumber(yStr, {
      min: MIN_YEARS,
      max: MAX_YEARS,
      allowDecimal: false,
    })

    // Validate principal
    if (principalVal === null) {
      setFieldError(
        "principal",
        "Invalid loan amount. Please enter a valid number."
      )
      setResult(null)
      return false
    }
    const principalRangeError = validateRange(
      principalVal,
      MIN_PRINCIPAL,
      MAX_PRINCIPAL
    )
    if (principalRangeError !== true) {
      setFieldError(
        "principal",
        typeof principalRangeError === "string"
          ? principalRangeError
          : `Loan amount must be between ${formatCurrency(
              MIN_PRINCIPAL
            )} and ${formatCurrency(MAX_PRINCIPAL)}.`
      )
      setResult(null)
      return false
    }

    // Validate rate
    if (rateVal === null) {
      setFieldError(
        "rate",
        "Invalid interest rate. Please enter a valid number."
      )
      setResult(null)
      return false
    }
    const rateRangeError = validateRange(rateVal, MIN_RATE, MAX_RATE)
    if (rateRangeError !== true) {
      setFieldError(
        "rate",
        typeof rateRangeError === "string"
          ? rateRangeError
          : `Annual interest rate must be between ${MIN_RATE}% and ${MAX_RATE}%.`
      )
      setResult(null)
      return false
    }

    // Validate years
    if (yearsVal === null) {
      setFieldError(
        "years",
        "Invalid loan term. Please enter a whole number of years."
      )
      setResult(null)
      return false
    }
    const yearsRangeError = validateRange(yearsVal, MIN_YEARS, MAX_YEARS)
    if (yearsRangeError !== true) {
      setFieldError(
        "years",
        typeof yearsRangeError === "string"
          ? yearsRangeError
          : `Loan term must be between ${MIN_YEARS} and ${MAX_YEARS} years.`
      )
      setResult(null)
      return false
    }

    const months = safeCalc((D) => D(yearsVal).mul(12))

    if (months === null || months <= 0) {
      setFieldError("years", "Loan term must be greater than 0 months.")
      setResult(null)
      return false
    }

    let monthlyPayment: number | null
    let totalPayment: number | null
    let totalInterest: number | null

    try {
      if (rateVal === 0) {
        // Zero-interest loan: simple division
        monthlyPayment = safeCalc((D) => D(principalVal).div(months))
        totalPayment = principalVal
        totalInterest = 0
      } else {
        const monthlyRate = safeCalc((D) => D(rateVal).div(100).div(12))
        if (monthlyRate === null || monthlyRate <= 0) {
          setFieldError(
            "rate",
            "Could not compute monthly rate. Please adjust the rate."
          )
          setResult(null)
          return false
        }

        // EMI factor (1 + r)^n – safe within our chosen bounds
        const factor = safeCalc((D) => D(1).plus(monthlyRate).pow(months))
        if (factor === null) {
          // Should never happen for valid inputs within ranges
          setFieldError(
            "rate",
            "Unable to compute payment with these values. Try a smaller rate or shorter term."
          )
          setResult(null)
          return false
        }

        const denominator = safeCalc((D) => D(factor).minus(1))
        if (denominator === null || denominator === 0) {
          setFieldError(
            "rate",
            "Unable to compute payment due to numerical limits. Try a smaller rate or shorter term."
          )
          setResult(null)
          return false
        }

        monthlyPayment = safeCalc((D) =>
          D(principalVal).mul(monthlyRate).mul(factor).div(denominator)
        )

        totalPayment =
          monthlyPayment === null
            ? null
            : safeCalc((D) => D(monthlyPayment!).mul(months))

        totalInterest =
          totalPayment === null
            ? null
            : safeCalc((D) => D(totalPayment!).minus(principalVal))
      }

      if (
        monthlyPayment === null ||
        totalPayment === null ||
        totalInterest === null ||
        !Number.isFinite(monthlyPayment) ||
        !Number.isFinite(totalPayment) ||
        !Number.isFinite(totalInterest)
      ) {
        setFieldError(
          "principal",
          "Calculation resulted in an invalid number. Please check your inputs."
        )
        setResult(null)
        return false
      }

      setResult({
        monthlyPayment,
        totalPayment,
        totalInterest,
      })
      setSnapshot({ principal: principalVal, rate: rateVal, years: yearsVal })
      return true
    } catch (err) {
      console.error("Loan calculation error:", err)
      setFieldError(
        "principal",
        "An unexpected error occurred during calculation."
      )
      setResult(null)
      return false
    }
  }

  const handlePrincipalChange = (val: string) => {
    const raw = val.trim()
    const n = raw === "" ? null : Number(raw)

    // preserve clamp error echo
    if (autoClamped?.field === "principal" && val === autoClamped.clampedTo)
      return

    if (n !== null && !Number.isNaN(n)) {
      if (n > MAX_PRINCIPAL) {
        const clamped = String(MAX_PRINCIPAL)
        setErrors({
          principal: `Loan amount exceeds maximum allowed of ${formatCurrency(
            MAX_PRINCIPAL
          )}`,
        })
        setPrincipal(clamped)
        setAutoClamped({ field: "principal", clampedTo: clamped })
        return
      }
      if (n < MIN_PRINCIPAL) {
        const clamped = String(MIN_PRINCIPAL)
        setErrors({
          principal: `Loan amount must be at least ${formatCurrency(
            MIN_PRINCIPAL
          )}`,
        })
        setPrincipal(clamped)
        setAutoClamped({ field: "principal", clampedTo: clamped })
        return
      }
    }

    if (autoClamped?.field === "principal") setAutoClamped(null)
    clearFieldError("principal")
    setPrincipal(val)
  }

  const handleRateChange = (val: string) => {
    const raw = val.trim()
    const n = raw === "" ? null : Number(raw)

    if (autoClamped?.field === "rate" && val === autoClamped.clampedTo) return

    if (n !== null && !Number.isNaN(n)) {
      if (n > MAX_RATE) {
        const clamped = String(MAX_RATE)
        setErrors({
          rate: `Interest rate must be less than or equal to ${MAX_RATE}%`,
        })
        setRate(clamped)
        setAutoClamped({ field: "rate", clampedTo: clamped })
        return
      }
      if (n < MIN_RATE) {
        const clamped = String(MIN_RATE)
        setErrors({
          rate: `Interest rate must be at least ${MIN_RATE}%`,
        })
        setRate(clamped)
        setAutoClamped({ field: "rate", clampedTo: clamped })
        return
      }
    }

    if (autoClamped?.field === "rate") setAutoClamped(null)
    clearFieldError("rate")
    setRate(val)
  }

  const handleYearsChange = (val: string) => {
    const raw = val.trim()
    const n = raw === "" ? null : Number(raw)

    if (autoClamped?.field === "years" && val === autoClamped.clampedTo) return

    if (n !== null && !Number.isNaN(n)) {
      if (!Number.isInteger(n)) {
        setErrors({ years: "Loan term must be a whole number of years." })
      } else {
        clearFieldError("years")
      }

      if (n > MAX_YEARS) {
        const clamped = String(MAX_YEARS)
        setErrors({
          years: `Loan term must be less than or equal to ${MAX_YEARS} years`,
        })
        setYears(clamped)
        setAutoClamped({ field: "years", clampedTo: clamped })
        return
      }
      if (n < MIN_YEARS) {
        const clamped = String(MIN_YEARS)
        setErrors({
          years: `Loan term must be at least ${MIN_YEARS} years`,
        })
        setYears(clamped)
        setAutoClamped({ field: "years", clampedTo: clamped })
        return
      }
    } else {
      // empty or non-numeric
      clearFieldError("years")
    }

    if (autoClamped?.field === "years") setAutoClamped(null)
    setYears(val)
  }

  const onCalculate = () => {
    setResult(null)
    setCalculated(false)
    const ok = calculateLoan(principal, rate, years)
    if (ok) {
      setCalculated(true)
      notify.success("Loan calculation successful")
    } else {
      notify.error("Please fix the highlighted fields before calculating.")
    }
  }

  const onClear = () => {
    setPrincipal("")
    setRate("")
    setYears("")
    setResult(null)
    setCalculated(false)
    setErrors(null)
    setSnapshot(null)
    setAutoClamped(null)
    setAttempted(false)
  }

  const hasError = Boolean(
    errors && (errors.principal || errors.rate || errors.years)
  )

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
              sanitizeOptions={{
                min: MIN_PRINCIPAL,
                max: MAX_PRINCIPAL,
                maxLength: PRINCIPAL_MAX_LENGTH,
                allowDecimal: true,
              }}
              inputMode="decimal"
              aria-label="Loan amount"
              aria-invalid={errors?.principal ? "true" : "false"}
              aria-describedby={
                errors?.principal ? "loan-principal-error-message" : undefined
              }
              className={errors?.principal ? "border-red-500" : ""}
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
              sanitizeOptions={{
                min: MIN_RATE,
                max: MAX_RATE,
                maxLength: RATE_MAX_LENGTH,
                allowDecimal: true,
              }}
              inputMode="decimal"
              aria-label="Annual interest rate"
              aria-invalid={errors?.rate ? "true" : "false"}
              aria-describedby={
                errors?.rate ? "loan-rate-error-message" : undefined
              }
              className={errors?.rate ? "border-red-500" : ""}
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
              sanitizeOptions={{
                min: MIN_YEARS,
                max: MAX_YEARS,
                maxLength: YEARS_MAX_LENGTH,
                allowDecimal: false,
              }}
              inputMode="numeric"
              aria-label="Loan term in years"
              aria-invalid={errors?.years ? "true" : "false"}
              aria-describedby={
                errors?.years ? "loan-years-error-message" : undefined
              }
              className={errors?.years ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Range: {MIN_YEARS} to {MAX_YEARS} years
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              className="w-full"
              onClick={onCalculate}
              aria-label="Calculate loan"
            >
              Calculate
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onClear}
              aria-label="Clear loan inputs"
            >
              Clear
            </Button>
          </div>

          {/* Error Display */}
          {hasError && (
            <div
              className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  {(() => {
                    const entries = errors
                      ? Object.entries(errors).filter(([, v]) => !!v)
                      : []
                    if (attempted && entries.length > 1) {
                      return entries.map(([k, v]) => (
                        <div
                          key={k}
                          className="mb-1"
                          id={`loan-${k}-error-message`}
                        >
                          {v}
                        </div>
                      ))
                    }

                    const priority: (keyof LoanErrors)[] = [
                      "principal",
                      "rate",
                      "years",
                    ]
                    for (const key of priority) {
                      const msg = errors?.[key]
                      if (msg) {
                        return (
                          <div
                            id={`loan-${key}-error-message`}
                            className="mb-1"
                          >
                            {msg}
                          </div>
                        )
                      }
                    }
                    return null
                  })()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {calculated && snapshot && result && !hasError && (
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
                    over {snapshot.years} years
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
  )
}

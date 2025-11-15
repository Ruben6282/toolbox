import { useState, useMemo } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SafeNumberInput } from "@/components/ui/safe-number-input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { RotateCcw, AlertCircle } from "lucide-react"
import { safeNumber } from "@/lib/safe-number"
import { safeCalc, formatCurrency } from "@/lib/safe-math"
import { validateRange } from "@/lib/validators"
import { notify } from "@/lib/notify"

const INCOME_MAX = 1e9 // $1,000,000,000 cap (aligned with DiscountCalculator scale)

type FilingStatus = "single" | "married"

const TAX_DATA = {
  "2024": {
    single: {
      brackets: [
        { min: 0, max: 11000, rate: 0.1 },
        { min: 11000, max: 44725, rate: 0.12 },
        { min: 44725, max: 95375, rate: 0.22 },
        { min: 95375, max: 182050, rate: 0.24 },
        { min: 182050, max: 231250, rate: 0.32 },
        { min: 231250, max: 578125, rate: 0.35 },
        { min: 578125, max: Infinity, rate: 0.37 },
      ],
      standard: 13850,
    },
    married: {
      brackets: [
        { min: 0, max: 22000, rate: 0.1 },
        { min: 22000, max: 89450, rate: 0.12 },
        { min: 89450, max: 190750, rate: 0.22 },
        { min: 190750, max: 364200, rate: 0.24 },
        { min: 364200, max: 462500, rate: 0.32 },
        { min: 462500, max: 693750, rate: 0.35 },
        { min: 693750, max: Infinity, rate: 0.37 },
      ],
      standard: 27700,
    },
  },
  "2025": {}, // falls back to 2024 data
}

const STATES: Record<string, number> = {
  none: 0,
  california: 0.013,
  "new-york": 0.045,
  illinois: 0.0495,
  pennsylvania: 0.0307,
  ohio: 0.0315,
  georgia: 0.055,
  "north-carolina": 0.0525,
  michigan: 0.0425,
  texas: 0,
  florida: 0,
}

type TaxBracket = { min: number; max: number; rate: number }
type FilingData = { brackets: TaxBracket[]; standard: number }
type TaxTable = Record<string, Partial<Record<FilingStatus, FilingData>>>

const TAX: TaxTable = TAX_DATA as unknown as TaxTable

type TaxErrors = {
  grossIncome?: string
  deductions?: string
  credits?: string
  additionalIncome?: string
}

type TaxResult = {
  totalIncome: number
  totalTax: number
  federalTax: number
  stateTax: number
  taxableIncome: number
  usedDeduction: number
  credits: number
  netIncome: number
  effectiveRate: number
}

export const TaxCalculator = () => {
  const [grossIncome, setGrossIncome] = useState("")
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single")
  const [taxYear, setTaxYear] = useState("2024")
  const [state, setState] = useState("none")
  const [deductions, setDeductions] = useState("")
  const [credits, setCredits] = useState("")
  const [additionalIncome, setAdditionalIncome] = useState("")

  const [errors, setErrors] = useState<TaxErrors>({})
  const [result, setResult] = useState<TaxResult | null>(null)
  const [calculated, setCalculated] = useState(false)

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )

  const clearFieldError = (field: keyof TaxErrors) => {
    setErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev, [field]: undefined }
      if (!next.grossIncome && !next.deductions && !next.credits && !next.additionalIncome) {
        return {}
      }
      return next
    })
  }

  /* INPUT HANDLERS WITH UI-CLAMP LOGIC */

  const handleGrossIncomeChange = (val: string) => {
    const raw = val.trim()
    const n = raw === "" ? null : Number(raw)

    if (n !== null && !Number.isNaN(n)) {
      if (n > INCOME_MAX) {
        const msg = `Gross income cannot exceed ${currencyFormatter.format(INCOME_MAX)}`
        setErrors({ grossIncome: msg })
        setGrossIncome(String(INCOME_MAX))
        return
      }
      if (n < 0) {
        const msg = "Gross income cannot be negative."
        setErrors({ grossIncome: msg })
        setGrossIncome("0")
        return
      }
    }

    // Preserve clamp error when value equals the max we applied to avoid flicker
    const grossMaxMsg = `Gross income cannot exceed ${currencyFormatter.format(INCOME_MAX)}`
    if (n === INCOME_MAX && errors.grossIncome === grossMaxMsg) {
      setGrossIncome(val)
      return
    }

    setErrors({})
    setGrossIncome(val)
  }

  const handleDeductionsChange = (val: string) => {
    const raw = val.trim()
    const n = raw === "" ? null : Number(raw)

    if (n !== null && !Number.isNaN(n)) {
      if (n > INCOME_MAX) {
        const msg = `Deductions cannot exceed ${currencyFormatter.format(INCOME_MAX)}`
        setErrors({ deductions: msg })
        setDeductions(String(INCOME_MAX))
        return
      }
      if (n < 0) {
        const msg = "Deductions cannot be negative."
        setErrors({ deductions: msg })
        setDeductions("0")
        return
      }
    }

    const dedMaxMsg = `Deductions cannot exceed ${currencyFormatter.format(INCOME_MAX)}`
    if (n === INCOME_MAX && errors.deductions === dedMaxMsg) {
      setDeductions(val)
      return
    }

    setErrors({})
    setDeductions(val)
  }

  const handleCreditsChange = (val: string) => {
    const raw = val.trim()
    const n = raw === "" ? null : Number(raw)

    if (n !== null && !Number.isNaN(n)) {
      if (n > INCOME_MAX) {
        const msg = `Tax credits cannot exceed ${currencyFormatter.format(INCOME_MAX)}`
        setErrors({ credits: msg })
        setCredits(String(INCOME_MAX))
        return
      }
      if (n < 0) {
        const msg = "Tax credits cannot be negative."
        setErrors({ credits: msg })
        setCredits("0")
        return
      }
    }

    const credMaxMsg = `Tax credits cannot exceed ${currencyFormatter.format(INCOME_MAX)}`
    if (n === INCOME_MAX && errors.credits === credMaxMsg) {
      setCredits(val)
      return
    }

    setErrors({})
    setCredits(val)
  }

  const handleAdditionalIncomeChange = (val: string) => {
    const raw = val.trim()
    const n = raw === "" ? null : Number(raw)

    if (n !== null && !Number.isNaN(n)) {
      if (n > INCOME_MAX) {
        const msg = `Additional income cannot exceed ${currencyFormatter.format(
          INCOME_MAX
        )}`
        setErrors({ additionalIncome: msg })
        setAdditionalIncome(String(INCOME_MAX))
        return
      }
      if (n < 0) {
        const msg = "Additional income cannot be negative."
        setErrors({ additionalIncome: msg })
        setAdditionalIncome("0")
        return
      }
    }

    const addMaxMsg = `Additional income cannot exceed ${currencyFormatter.format(
      INCOME_MAX
    )}`
    if (n === INCOME_MAX && errors.additionalIncome === addMaxMsg) {
      setAdditionalIncome(val)
      return
    }

    setErrors({})
    setAdditionalIncome(val)
  }

  /* MAIN CALCULATE BUTTON HANDLER */

  const onCalculate = () => {
    setCalculated(false)
    setResult(null)

    const newErrors: TaxErrors = {}

    // Required presence checks
    if (!grossIncome.trim()) {
      newErrors.grossIncome = "Gross income is required."
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      notify.error("Please fix the highlighted fields before calculating.")
      return
    }

    // Parse with safeNumber and validate ranges

    // Gross income (required)
    const grossNum = safeNumber(grossIncome, { min: 0, max: INCOME_MAX })
    if (grossNum === null || grossNum <= 0) {
      const rangeError = grossNum === null ? false : validateRange(grossNum, 0, INCOME_MAX)
      newErrors.grossIncome =
        typeof rangeError === "string"
          ? rangeError
          : `Gross income must be between 0 and ${currencyFormatter.format(INCOME_MAX)}`
    }

    // Deductions (optional)
    let deductionsNum = 0
    if (deductions.trim()) {
      const dNum = safeNumber(deductions, { min: 0, max: INCOME_MAX })
      if (dNum === null) {
        newErrors.deductions = `Deductions must be between 0 and ${currencyFormatter.format(
          INCOME_MAX
        )}`
      } else {
        const rangeError = validateRange(dNum, 0, INCOME_MAX)
        if (rangeError !== true) {
          newErrors.deductions =
            typeof rangeError === "string"
              ? rangeError
              : `Deductions must be between 0 and ${currencyFormatter.format(INCOME_MAX)}`
        } else {
          deductionsNum = dNum
        }
      }
    }

    // Credits (optional)
    let creditsNum = 0
    if (credits.trim()) {
      const cNum = safeNumber(credits, { min: 0, max: INCOME_MAX })
      if (cNum === null) {
        newErrors.credits = `Tax credits must be between 0 and ${currencyFormatter.format(
          INCOME_MAX
        )}`
      } else {
        const rangeError = validateRange(cNum, 0, INCOME_MAX)
        if (rangeError !== true) {
          newErrors.credits =
            typeof rangeError === "string"
              ? rangeError
              : `Tax credits must be between 0 and ${currencyFormatter.format(INCOME_MAX)}`
        } else {
          creditsNum = cNum
        }
      }
    }

    // Additional income (optional)
    let additionalNum = 0
    if (additionalIncome.trim()) {
      const aNum = safeNumber(additionalIncome, { min: 0, max: INCOME_MAX })
      if (aNum === null) {
        newErrors.additionalIncome = `Additional income must be between 0 and ${currencyFormatter.format(
          INCOME_MAX
        )}`
      } else {
        const rangeError = validateRange(aNum, 0, INCOME_MAX)
        if (rangeError !== true) {
          newErrors.additionalIncome =
            typeof rangeError === "string"
              ? rangeError
              : `Additional income must be between 0 and ${currencyFormatter.format(
                  INCOME_MAX
                )}`
        } else {
          additionalNum = aNum
        }
      }
    }

    if (Object.keys(newErrors).length > 0 || grossNum === null || grossNum <= 0) {
      setErrors(newErrors)
      notify.error("Please fix the highlighted fields before calculating.")
      return
    }

    // ----- SAFE CALCULATIONS (inputs are valid & bounded) -----

    const income = grossNum!
    const totalIncome = safeCalc(D => D(income).plus(additionalNum))!

    // Year data (fallback to 2024 if year/taxYear missing)
    const getYearData = (year: string, filing: FilingStatus): FilingData => {
      const d = TAX[year]?.[filing] ?? TAX["2024"][filing]
      if (!d) throw new Error("Missing tax data for selected year/filing status")
      return d
    }

    const yearData = getYearData(taxYear, filingStatus)

    const standardDeduction: number = yearData.standard
    const usedDeduction = Math.max(deductionsNum, standardDeduction)
    const taxableIncomeRaw = safeCalc(D => D(totalIncome).minus(usedDeduction))!
    const taxableIncome = Math.max(0, taxableIncomeRaw)

    // Federal tax
    let federalTax = 0
    for (const b of yearData.brackets as Array<{
      min: number
      max: number
      rate: number
    }>) {
      if (taxableIncome > b.min) {
        const amountInBracket = Math.min(taxableIncome, b.max) - b.min
        if (amountInBracket > 0) {
          const t = safeCalc(D => D(amountInBracket).mul(b.rate))!
          federalTax += t
        }
      } else {
        break
      }
    }

    // State tax
    const stateRate = STATES[state] ?? 0
    const stateTax = safeCalc(D => D(taxableIncome).mul(stateRate))!

    // Total tax after credits (never below 0)
    const totalTaxRaw = safeCalc(D => D(federalTax).plus(stateTax).minus(creditsNum))!
    const totalTax = Math.max(0, totalTaxRaw)

    const netIncome = safeCalc(D => D(totalIncome).minus(totalTax))!
    const effectiveRate =
      totalIncome > 0
        ? safeCalc(D => D(totalTax).div(totalIncome).mul(100))!
        : 0

    setErrors({})
    setResult({
      totalIncome,
      totalTax,
      federalTax,
      stateTax,
      taxableIncome,
      usedDeduction,
      credits: creditsNum,
      netIncome,
      effectiveRate,
    })
    setCalculated(true)
    notify.success("Tax calculation completed.")
  }

  const onClear = () => {
    setGrossIncome("")
    setFilingStatus("single")
    setTaxYear("2024")
    setState("none")
    setDeductions("")
    setCredits("")
    setAdditionalIncome("")
    setErrors({})
    setResult(null)
    setCalculated(false)
  }

  const hasError = Boolean(
    errors.grossIncome || errors.deductions || errors.credits || errors.additionalIncome
  )

  const fmt = (n: number) => formatCurrency(n)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tax Calculator</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* INPUTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gross Income (required) */}
            <div className="space-y-2">
              <Label htmlFor="gross-income">Gross Income ($)</Label>
              <SafeNumberInput
                id="gross-income"
                placeholder="0"
                value={grossIncome}
                onChange={handleGrossIncomeChange}
                sanitizeOptions={{
                  min: 0,
                  max: INCOME_MAX,
                  allowDecimal: true,
                  maxLength: String(INCOME_MAX).length,
                }}
                aria-invalid={errors.grossIncome ? "true" : "false"}
                aria-describedby={errors.grossIncome ? "tax-gross-err" : undefined}
                className={errors.grossIncome ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Required — Max: {currencyFormatter.format(INCOME_MAX)}
              </p>
            </div>

            {/* Tax Year */}
            <div className="space-y-2">
              <Label>Tax Year</Label>
              <Select value={taxYear} onValueChange={setTaxYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filing Status */}
            <div className="space-y-2">
              <Label>Filing Status</Label>
              <Select
                value={filingStatus}
                onValueChange={v =>
                  setFilingStatus(v === "married" ? "married" : "single")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married Filing Jointly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(STATES).map(s => (
                    <SelectItem key={s} value={s}>
                      {s
                        .replace("-", " ")
                        .replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deductions */}
            <div className="space-y-2">
              <Label htmlFor="deductions">Deductions ($)</Label>
              <SafeNumberInput
                id="deductions"
                value={deductions}
                onChange={handleDeductionsChange}
                sanitizeOptions={{
                  min: 0,
                  max: INCOME_MAX,
                  allowDecimal: true,
                  maxLength: String(INCOME_MAX).length,
                }}
                placeholder="0"
                aria-invalid={errors.deductions ? "true" : "false"}
                aria-describedby={errors.deductions ? "tax-deductions-err" : undefined}
                className={errors.deductions ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use standard deduction.
              </p>
            </div>

            {/* Credits */}
            <div className="space-y-2">
              <Label htmlFor="credits">Tax Credits ($)</Label>
              <SafeNumberInput
                id="credits"
                value={credits}
                onChange={handleCreditsChange}
                sanitizeOptions={{
                  min: 0,
                  max: INCOME_MAX,
                  allowDecimal: true,
                  maxLength: String(INCOME_MAX).length,
                }}
                placeholder="0"
                aria-invalid={errors.credits ? "true" : "false"}
                aria-describedby={errors.credits ? "tax-credits-err" : undefined}
                className={errors.credits ? "border-red-500" : ""}
              />
            </div>

            {/* Additional Income */}
            <div className="space-y-2">
              <Label htmlFor="additional-income">Additional Income ($)</Label>
              <SafeNumberInput
                id="additional-income"
                value={additionalIncome}
                onChange={handleAdditionalIncomeChange}
                sanitizeOptions={{
                  min: 0,
                  max: INCOME_MAX,
                  allowDecimal: true,
                  maxLength: String(INCOME_MAX).length,
                }}
                placeholder="0"
                aria-invalid={errors.additionalIncome ? "true" : "false"}
                aria-describedby={
                  errors.additionalIncome ? "tax-additional-err" : undefined
                }
                className={errors.additionalIncome ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Other income sources (investments, side jobs, etc.)
              </p>
            </div>
          </div>

          {/* ERRORS */}
          {(errors.grossIncome ||
            errors.deductions ||
            errors.credits ||
            errors.additionalIncome) && (
            <div
              className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              <div className="space-y-1">
                {errors.grossIncome && (
                  <div id="tax-gross-err">{errors.grossIncome}</div>
                )}
                {errors.deductions && (
                  <div id="tax-deductions-err">{errors.deductions}</div>
                )}
                {errors.credits && (
                  <div id="tax-credits-err">{errors.credits}</div>
                )}
                {errors.additionalIncome && (
                  <div id="tax-additional-err">{errors.additionalIncome}</div>
                )}
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button className="w-full" onClick={onCalculate}>
              Calculate Tax
            </Button>
            <Button
              onClick={onClear}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULTS */}
      {calculated && result && !hasError && (
        <Card>
          <CardHeader>
            <CardTitle>Tax Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3" aria-live="polite">
            <div className="grid grid-cols-1 md:grid-cols-3 text-center gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600 break-all">
                  {fmt(result.totalIncome)}
                </div>
                <div className="text-sm text-muted-foreground">Total Income</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600 break-all">
                  {fmt(result.totalTax)}
                </div>
                <div className="text-sm text-muted-foreground">Total Tax</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 break-all">
                  {fmt(result.netIncome)}
                </div>
                <div className="text-sm text-muted-foreground">Net Income</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span>Federal Tax:</span>
                <span className="break-all">{fmt(result.federalTax)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>State Tax:</span>
                <span className="break-all">{fmt(result.stateTax)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Deductions Used:</span>
                <span className="break-all">{fmt(result.usedDeduction)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Taxable Income:</span>
                <span className="break-all">{fmt(result.taxableIncome)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Tax Credits:</span>
                <span className="break-all">{fmt(result.credits)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Effective Tax Rate:</span>
                <span className="break-all">
                  {result.effectiveRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TIPS SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• This calculator provides rough estimates based on 2024 brackets.</li>
            <li>• Consider contributing to retirement accounts to reduce taxable income.</li>
            <li>• Itemize deductions if they exceed the standard deduction.</li>
            <li>• Take advantage of all eligible tax credits.</li>
            <li>• Consult a tax professional for complex situations or large incomes.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from "react"
import { SafeNumberInput } from "@/components/ui/safe-number-input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RotateCcw, AlertCircle } from "lucide-react"
import { safeNumber } from "@/lib/safe-number"
import { safeCalc } from "@/lib/safe-math"
import { validateRange } from "@/lib/validators"

/* FULL NON-SCIENTIFIC LIMIT */
const MAX_INPUT_VALUE = 100_000_000_000_000; // 100 trillion, safe max

type Category = "length" | "weight" | "temperature"
const ALLOWED_CATEGORIES: Category[] = ["length", "weight", "temperature"]

const coerceCategory = (val: string): Category =>
  ALLOWED_CATEGORIES.includes(val as Category) ? (val as Category) : "length"

// Length uses meter as base
const LENGTH_FACTORS: Record<string, number> = {
  meter: 1,
  kilometer: 0.001,
  centimeter: 100,
  millimeter: 1000,
  mile: 0.000621371,
  yard: 1.09361,
  foot: 3.28084,
  inch: 39.3701,
}

// Weight uses kilogram as base
const WEIGHT_FACTORS: Record<string, number> = {
  kilogram: 1,
  gram: 1000,
  milligram: 1_000_000,
  pound: 2.20462,
  ounce: 35.274,
  ton: 0.001,
}

const CONVERSION_UNITS = {
  length: Object.keys(LENGTH_FACTORS),
  weight: Object.keys(WEIGHT_FACTORS),
  temperature: ["celsius", "fahrenheit", "kelvin"],
} as const

type UnitErrors = {
  value?: string
}

type UnitResult = {
  input: number
  output: number
  from: string
  to: string
  category: Category
}

export const UnitConverter = () => {
  const [category, setCategory] = useState<Category>("length")
  const [value, setValue] = useState("")
  const [fromUnit, setFromUnit] = useState("meter")
  const [toUnit, setToUnit] = useState("kilometer")

  const [errors, setErrors] = useState<UnitErrors>({})
  const [result, setResult] = useState<UnitResult | null>(null)
  const [calculated, setCalculated] = useState(false)

  const hasError = Boolean(errors.value)

  // Allow empty input + clamp only max
  const handleValueChange = (val: string) => {
    const trimmed = val.trim()
    const n = trimmed === "" ? null : Number(trimmed)

    if (n === null || Number.isNaN(n)) {
      setErrors({})
      setValue(val)
      return
    }

    if (Math.abs(n) > MAX_INPUT_VALUE) {
      const clamped = n > 0 ? MAX_INPUT_VALUE : -MAX_INPUT_VALUE
      const msg = `Value must be between -${MAX_INPUT_VALUE} and ${MAX_INPUT_VALUE}.`
      setErrors({ value: msg })
      setValue(String(clamped))
      return
    }

    // Preserve clamp error when the handler runs again with the clamped value to avoid flicker
    const clampMsg = `Value must be between -${MAX_INPUT_VALUE} and ${MAX_INPUT_VALUE}.`
    if (n === MAX_INPUT_VALUE && errors.value === clampMsg) {
      setValue(val)
      return
    }
    if (n === -MAX_INPUT_VALUE && errors.value === clampMsg) {
      setValue(val)
      return
    }

    // Replace transient input errors while typing with a single error state
    setErrors({})
    setValue(val)
  }

  const clearAll = () => {
    setCategory("length")
    setValue("")
    setFromUnit("meter")
    setToUnit("kilometer")
    setErrors({})
    setResult(null)
    setCalculated(false)
  }

  /* ---------------------------
     SAFE, FAILURE-FREE CONVERSION
     --------------------------- */

  const toCelsiusSafe = (value: number, from: string): number => {
    if (from === "celsius") return value

    if (from === "fahrenheit") {
      return (
        safeCalc((D) => D(value).minus(32).mul(5).div(9)) ?? (value - 32) * (5 / 9)
      )
    }

    if (from === "kelvin") {
      return safeCalc((D) => D(value).minus(273.15)) ?? value - 273.15
    }

    return value
  }

  const fromCelsiusSafe = (celsius: number, to: string): number => {
    if (to === "celsius") return celsius

    if (to === "fahrenheit") {
      return (
        safeCalc((D) => D(celsius).mul(9).div(5).plus(32)) ??
        celsius * (9 / 5) + 32
      )
    }

    if (to === "kelvin") {
      return safeCalc((D) => D(celsius).plus(273.15)) ?? celsius + 273.15
    }

    return celsius
  }

  const convertSafe = (
    numeric: number,
    from: string,
    to: string,
    cat: Category
  ): number | null => {
    if (cat === "temperature") {
      const c = toCelsiusSafe(numeric, from)
      const out = fromCelsiusSafe(c, to)
      return Number.isFinite(out) ? out : null
    }

    const factors =
      cat === "length"
        ? LENGTH_FACTORS
        : cat === "weight"
        ? WEIGHT_FACTORS
        : null

    const f = factors?.[from]
    const t = factors?.[to]

    if (!f || !t || f <= 0 || t <= 0) return null

    const base =
      safeCalc((D) => D(numeric).div(f)) ??
      numeric / f

    const out =
      safeCalc((D) => D(base).mul(t)) ??
      base * t

    return Number.isFinite(out) ? out : null
  }

  const onCalculate = () => {
    setCalculated(false)
    setResult(null)

    const newErrors: UnitErrors = {}

    if (!value.trim()) {
      newErrors.value = "Value is required."
      setErrors(newErrors)
      return
    }

    const numericValue = safeNumber(value, {
      min: -MAX_INPUT_VALUE,
      max: MAX_INPUT_VALUE,
    })

    if (numericValue === null) {
      newErrors.value = `Value must be a valid number between -${MAX_INPUT_VALUE} and ${MAX_INPUT_VALUE}.`
      setErrors(newErrors)
      return
    }

    if (category !== "temperature" && numericValue < 0) {
      newErrors.value = "Value cannot be negative for this category."
      setErrors(newErrors)
      return
    }

    const converted = convertSafe(numericValue, fromUnit, toUnit, category)

    if (converted === null) {
      newErrors.value =
        "Conversion failed unexpectedly. Try using smaller values or different units."
      setErrors(newErrors)
      return
    }

    setErrors({})
    setResult({
      input: numericValue,
      output: converted,
      from: fromUnit,
      to: toUnit,
      category,
    })
    setCalculated(true)
  }

  const handleCategoryChange = (newCat: string) => {
    const coerced = coerceCategory(newCat)
    setCategory(coerced)

    const units = CONVERSION_UNITS[coerced]
    setFromUnit(units[0])
    setToUnit(units[1] ?? units[0])

    setErrors({})
    setResult(null)
    setCalculated(false)
  }

  const unitsForCategory = CONVERSION_UNITS[category]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Unit Converter</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* CATEGORY SELECT */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="length">Length</SelectItem>
                <SelectItem value="weight">Weight</SelectItem>
                <SelectItem value="temperature">Temperature</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* VALUE INPUT */}
          <div className="space-y-2">
            <Label>Value</Label>
            <SafeNumberInput
              value={value}
              onChange={handleValueChange}
              sanitizeOptions={{
                max: MAX_INPUT_VALUE,
                allowDecimal: true,
                maxLength: String(MAX_INPUT_VALUE).length,
              }}
              inputMode="decimal"
              aria-invalid={errors.value ? "true" : "false"}
              aria-describedby={errors.value ? "unit-value-err" : undefined}
              className={errors.value ? "border-red-500" : ""}
              placeholder="Enter value"
            />
            <p className="text-xs text-muted-foreground">
              Max absolute value: {MAX_INPUT_VALUE}
            </p>
          </div>

          {/* FROM / TO UNITS */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>From</Label>
              <Select
                value={fromUnit}
                onValueChange={(v) => {
                  setFromUnit(v)
                  setCalculated(false)
                  setResult(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {unitsForCategory.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To</Label>
              <Select
                value={toUnit}
                onValueChange={(v) => {
                  setToUnit(v)
                  setCalculated(false)
                  setResult(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {unitsForCategory.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ERRORS */}
          {errors.value && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              <div id="unit-value-err">{errors.value}</div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={onCalculate} className="w-full">
              Convert
            </Button>
            <Button
              onClick={clearAll}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULT */}
      {calculated && result && !hasError && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary break-all px-2">
              {result.output.toFixed(4)}
            </div>
            <p className="text-sm text-muted-foreground break-words px-2">
              {result.input} {result.from} ={" "}
              <strong>{result.output.toFixed(4)}</strong> {result.to}
            </p>
            <p className="text-xs text-muted-foreground">
              Category:{" "}
              {result.category.charAt(0).toUpperCase() +
                result.category.slice(1)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

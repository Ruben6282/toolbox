import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SafeNumberInput } from "@/components/ui/safe-number-input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RotateCcw, AlertCircle } from "lucide-react"
import { safeNumber } from "@/lib/safe-number"
import { safeCalc } from "@/lib/safe-math"
import { validateRange } from "@/lib/validators"
import { notify } from "@/lib/notify"

/* LIMITS */
const MAX_DISTANCE = 1_000_000 // 1M km / miles
const MAX_EFFICIENCY = 1000 // L/100km or MPG
const MAX_PRICE = 1000 // per liter / gallon

/* TYPES & ENUMS */
const ALLOWED_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR"] as const
const ALLOWED_UNITS = ["metric", "imperial"] as const

type Currency = (typeof ALLOWED_CURRENCIES)[number]
type UnitSystem = (typeof ALLOWED_UNITS)[number]

type FuelErrors = {
  distance?: string
  efficiency?: string
  price?: string
}

type FuelResult = {
  distance: number
  efficiency: number
  price: number
  fuelNeeded: number
  totalCost: number
  costPerKm: number
  costPerMile: number
  unitSystem: UnitSystem
}

/* COERCERS */
const coerceCurrency = (value: string): Currency =>
  ALLOWED_CURRENCIES.includes(value as Currency) ? (value as Currency) : "USD"

const coerceUnitSystem = (value: string): UnitSystem =>
  ALLOWED_UNITS.includes(value as UnitSystem) ? (value as UnitSystem) : "metric"

export const FuelCostCalculator = () => {
  const [distance, setDistance] = useState("")
  const [fuelEfficiency, setFuelEfficiency] = useState("")
  const [fuelPrice, setFuelPrice] = useState("")
  const [currency, setCurrency] = useState<Currency>("USD")
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric")

  const [errors, setErrors] = useState<FuelErrors>({})
  const [result, setResult] = useState<FuelResult | null>(null)
  const [calculated, setCalculated] = useState(false)

  /* CURRENCY SYMBOLS */
  const currencySymbol = useMemo(() => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      CAD: "C$",
      AUD: "A$",
      JPY: "¥",
      INR: "₹",
    }
    return symbols[currency] ?? "$"
  }, [currency])

  const clearFieldError = (field: keyof FuelErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev, [field]: undefined }
      if (!next.distance && !next.efficiency && !next.price) return {}
      return next
    })
  }

  /* INPUT HANDLERS WITH UI-CLAMP */

  const handleDistanceChange = (val: string) => {
    const raw = val.trim()
    const n = raw === "" ? null : Number(raw)

    if (n !== null && !Number.isNaN(n)) {
      if (n > MAX_DISTANCE) {
        const msg = `Distance cannot exceed ${MAX_DISTANCE.toLocaleString()} ${
          unitSystem === "metric" ? "km" : "miles"
        }.`
        setErrors({ distance: msg })
        setDistance(String(MAX_DISTANCE))
        return
      }
      if (n < 0) {
        const msg = "Distance cannot be negative."
        setErrors({ distance: msg })
        setDistance("0")
        return
      }
    }

    // Preserve clamp error when value equals the max/min we just applied to avoid flicker
    const maxMsg = `Distance cannot exceed ${MAX_DISTANCE.toLocaleString()} ${
      unitSystem === "metric" ? "km" : "miles"
    }.`
    const minMsg = "Distance cannot be negative."
    if (n === MAX_DISTANCE && errors.distance === maxMsg) {
      setDistance(val)
      return
    }
    if (n === 0 && errors.distance === minMsg) {
      setDistance(val)
      return
    }

    // Replace transient input errors while typing with a single error state
    setErrors({})
    setDistance(val)
  }

  const handleEfficiencyChange = (val: string) => {
    const raw = val.trim()
    const n = raw === "" ? null : Number(raw)

    if (n !== null && !Number.isNaN(n)) {
      if (n > MAX_EFFICIENCY) {
        setErrors({
          efficiency: `Fuel efficiency cannot exceed ${MAX_EFFICIENCY} ${
            unitSystem === "metric" ? "L/100km" : "MPG"
          }.`,
        })
        setFuelEfficiency(String(MAX_EFFICIENCY))
        return
      }
      if (n < 0) {
        setErrors({
          efficiency: "Fuel efficiency cannot be negative.",
        })
        setFuelEfficiency("0")
        return
      }
    }

    clearFieldError("efficiency")
    setFuelEfficiency(val)
  }

  const handlePriceChange = (val: string) => {
    const raw = val.trim()
    const n = raw === "" ? null : Number(raw)

    if (n !== null && !Number.isNaN(n)) {
      if (n > MAX_PRICE) {
        setErrors({
          price: `Fuel price cannot exceed ${currencySymbol}${MAX_PRICE}.`,
        })
        setFuelPrice(String(MAX_PRICE))
        return
      }
      if (n < 0) {
        setErrors({
          price: "Fuel price cannot be negative.",
        })
        setFuelPrice("0")
        return
      }
    }

    clearFieldError("price")
    setFuelPrice(val)
  }

  /* MAIN CALCULATE BUTTON HANDLER */

  const onCalculate = () => {
    setCalculated(false)
    setResult(null)

    const newErrors: FuelErrors = {}

    // Required field checks
    if (!distance.trim()) newErrors.distance = "Distance is required."
    if (!fuelEfficiency.trim()) newErrors.efficiency = "Fuel efficiency is required."
    if (!fuelPrice.trim()) newErrors.price = "Fuel price is required."

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      notify.error("Please fix the highlighted fields before calculating.")
      return
    }

    // Parse with safeNumber
    const distanceNum = safeNumber(distance, { min: 0, max: MAX_DISTANCE })
    const efficiencyNum = safeNumber(fuelEfficiency, { min: 0, max: MAX_EFFICIENCY })
    const priceNum = safeNumber(fuelPrice, { min: 0, max: MAX_PRICE })

    // Distance validation
    if (distanceNum === null) {
      newErrors.distance = `Distance must be between 0 and ${MAX_DISTANCE.toLocaleString()} ${
        unitSystem === "metric" ? "km" : "miles"
      }.`
    } else {
      const distanceRange = validateRange(distanceNum, 0, MAX_DISTANCE)
      if (distanceRange !== true) {
        newErrors.distance =
          typeof distanceRange === "string"
            ? distanceRange
            : `Distance must be between 0 and ${MAX_DISTANCE.toLocaleString()} ${
                unitSystem === "metric" ? "km" : "miles"
              }.`
      }
    }

    // Efficiency validation
    if (efficiencyNum === null) {
      newErrors.efficiency = `Fuel efficiency must be between 0 and ${MAX_EFFICIENCY} ${
        unitSystem === "metric" ? "L/100km" : "MPG"
      }.`
    } else {
      const effRange = validateRange(efficiencyNum, 0, MAX_EFFICIENCY)
      if (effRange !== true) {
        newErrors.efficiency =
          typeof effRange === "string"
            ? effRange
            : `Fuel efficiency must be between 0 and ${MAX_EFFICIENCY} ${
                unitSystem === "metric" ? "L/100km" : "MPG"
              }.`
      }
    }

    // Price validation
    if (priceNum === null) {
      newErrors.price = `Fuel price must be between 0 and ${currencySymbol}${MAX_PRICE}.`
    } else {
      const priceRange = validateRange(priceNum, 0, MAX_PRICE)
      if (priceRange !== true) {
        newErrors.price =
          typeof priceRange === "string"
            ? priceRange
            : `Fuel price must be between 0 and ${currencySymbol}${MAX_PRICE}.`
      }
    }

    // Additional logical checks: must be strictly > 0 to compute
    if (distanceNum !== null && distanceNum <= 0) {
      newErrors.distance = "Distance must be greater than 0."
    }
    if (efficiencyNum !== null && efficiencyNum <= 0) {
      newErrors.efficiency = "Fuel efficiency must be greater than 0."
    }
    if (priceNum !== null && priceNum <= 0) {
      newErrors.price = "Fuel price must be greater than 0."
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      notify.error("Please fix the highlighted fields before calculating.")
      return
    }

    // Now safe and valid
    const d = distanceNum!
    const eff = efficiencyNum!
    const p = priceNum!

    let fuelNeeded = 0
    let totalCost = 0
    let costPerKm = 0
    let costPerMile = 0

    if (unitSystem === "metric") {
      // Distance in km, fuel efficiency in L/100km
      fuelNeeded = safeCalc((D) => D(d).mul(eff).div(100))!
      totalCost = safeCalc((D) => D(fuelNeeded).mul(p))!
      costPerKm = safeCalc((D) => D(totalCost).div(d))!
      costPerMile = safeCalc((D) => D(costPerKm).mul(1.609))! // convert cost per km → per mile
    } else {
      // Distance in miles, fuel efficiency in MPG
      fuelNeeded = safeCalc((D) => D(d).div(eff))!
      totalCost = safeCalc((D) => D(fuelNeeded).mul(p))!
      costPerMile = safeCalc((D) => D(totalCost).div(d))!
      costPerKm = safeCalc((D) => D(costPerMile).div(1.609))! // convert cost per mile → per km
    }

    setErrors({})
    setResult({
      distance: d,
      efficiency: eff,
      price: p,
      fuelNeeded,
      totalCost,
      costPerKm,
      costPerMile,
      unitSystem,
    })
    setCalculated(true)
    notify.success("Fuel cost calculation completed.")
  }

  const onClear = () => {
    setDistance("")
    setFuelEfficiency("")
    setFuelPrice("")
    setCurrency("USD")
    setUnitSystem("metric")
    setErrors({})
    setResult(null)
    setCalculated(false)
  }

  const hasError = Boolean(errors.distance || errors.efficiency || errors.price)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fuel Cost Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* UNIT SYSTEM */}
          <div className="space-y-2">
            <Label htmlFor="unit-system">Unit System</Label>
            <Select
              value={unitSystem}
              onValueChange={(value) => setUnitSystem(coerceUnitSystem(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (km, L/100km)</SelectItem>
                <SelectItem value="imperial">Imperial (miles, MPG)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* INPUT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Distance */}
            <div className="space-y-2">
              <Label htmlFor="distance">
                Distance ({unitSystem === "metric" ? "km" : "miles"})
              </Label>
              <SafeNumberInput
                id="distance"
                placeholder="0"
                value={distance}
                onChange={handleDistanceChange}
                sanitizeOptions={{
                  min: 0,
                  max: MAX_DISTANCE,
                  allowDecimal: true,
                  maxLength: String(MAX_DISTANCE).length,
                }}
                aria-invalid={errors.distance ? "true" : "false"}
                aria-describedby={errors.distance ? "fuel-distance-err" : undefined}
                className={errors.distance ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Max: {MAX_DISTANCE.toLocaleString()} {unitSystem === "metric" ? "km" : "miles"}
              </p>
            </div>

            {/* Fuel efficiency */}
            <div className="space-y-2">
              <Label htmlFor="fuel-efficiency">
                Fuel Efficiency ({unitSystem === "metric" ? "L/100km" : "MPG"})
              </Label>
              <SafeNumberInput
                id="fuel-efficiency"
                placeholder="0"
                value={fuelEfficiency}
                onChange={handleEfficiencyChange}
                sanitizeOptions={{
                  min: 0,
                  max: MAX_EFFICIENCY,
                  allowDecimal: true,
                  maxLength: 6,
                }}
                aria-invalid={errors.efficiency ? "true" : "false"}
                aria-describedby={errors.efficiency ? "fuel-efficiency-err" : undefined}
                className={errors.efficiency ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Max: {MAX_EFFICIENCY} {unitSystem === "metric" ? "L/100km" : "MPG"}
              </p>
            </div>

            {/* Fuel price */}
            <div className="space-y-2">
              <Label htmlFor="fuel-price">
                Fuel Price ({currencySymbol}/{unitSystem === "metric" ? "L" : "gallon"})
              </Label>
              <SafeNumberInput
                id="fuel-price"
                placeholder="0"
                value={fuelPrice}
                onChange={handlePriceChange}
                sanitizeOptions={{
                  min: 0,
                  max: MAX_PRICE,
                  allowDecimal: true,
                  maxLength: 8,
                }}
                aria-invalid={errors.price ? "true" : "false"}
                aria-describedby={errors.price ? "fuel-price-err" : undefined}
                className={errors.price ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Max: {currencySymbol}
                {MAX_PRICE.toFixed(2)} per {unitSystem === "metric" ? "liter" : "gallon"}
              </p>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={currency}
                onValueChange={(value) => setCurrency(coerceCurrency(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ERRORS */}
          {(errors.distance || errors.efficiency || errors.price) && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              <div className="space-y-1">
                {errors.distance && <div id="fuel-distance-err">{errors.distance}</div>}
                {errors.efficiency && (
                  <div id="fuel-efficiency-err">{errors.efficiency}</div>
                )}
                {errors.price && <div id="fuel-price-err">{errors.price}</div>}
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={onCalculate} className="w-full">
              Calculate
            </Button>
            <Button onClick={onClear} variant="outline" className="w-full">
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
            <CardTitle>Fuel Cost Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" aria-live="polite">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 break-words px-2">
                  {result.fuelNeeded.toFixed(2)}{" "}
                  {result.unitSystem === "metric" ? "L" : "gal"}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Fuel Needed
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 break-words px-2">
                  {currencySymbol}
                  {result.totalCost.toFixed(2)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Total Cost
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 break-words px-2">
                  {currencySymbol}
                  {result.costPerKm.toFixed(3)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Cost per km
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Trip Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-medium">
                      {result.distance}{" "}
                      {result.unitSystem === "metric" ? "km" : "miles"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Efficiency:</span>
                    <span className="font-medium">
                      {result.efficiency}{" "}
                      {result.unitSystem === "metric" ? "L/100km" : "MPG"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Price:</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {result.price.toFixed(2)}/
                      {result.unitSystem === "metric" ? "L" : "gal"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Needed:</span>
                    <span className="font-medium">
                      {result.fuelNeeded.toFixed(2)}{" "}
                      {result.unitSystem === "metric" ? "L" : "gal"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost per km:</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {result.costPerKm.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost per mile:</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {result.costPerMile.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Trip Summary</h4>
              <div className="text-sm space-y-1">
                <p>
                  For a {result.distance}{" "}
                  {result.unitSystem === "metric" ? "km" : "mile"} trip, you'll
                  need{" "}
                  <strong>
                    {result.fuelNeeded.toFixed(2)}{" "}
                    {result.unitSystem === "metric" ? "liters" : "gallons"}
                  </strong>{" "}
                  of fuel.
                </p>
                <p>
                  The total cost will be{" "}
                  <strong>
                    {currencySymbol}
                    {result.totalCost.toFixed(2)}
                  </strong>
                  .
                </p>
                <p>
                  Your fuel cost is{" "}
                  <strong>
                    {currencySymbol}
                    {result.costPerKm.toFixed(3)} per km
                  </strong>{" "}
                  or{" "}
                  <strong>
                    {currencySymbol}
                    {result.costPerMile.toFixed(3)} per mile
                  </strong>
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TIPS */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Efficiency Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Drive at steady speeds to improve fuel efficiency.</li>
            <li>• Remove unnecessary weight from your vehicle.</li>
            <li>• Keep your tires properly inflated.</li>
            <li>• Use cruise control on highways when possible.</li>
            <li>• Avoid aggressive acceleration and braking.</li>
            <li>• Plan your route to avoid traffic and construction.</li>
            <li>• Regular maintenance helps maintain fuel efficiency.</li>
            <li>• Consider carpooling or public transportation for long commutes.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

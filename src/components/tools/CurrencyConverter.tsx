import { useEffect, useMemo, useState } from "react"
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
import { RotateCcw, ArrowUpDown, AlertCircle } from "lucide-react"
import { notify } from "@/lib/notify"
import { safeNumber } from "@/lib/safe-number"
import { safeCalc } from "@/lib/safe-math"
import { validateRange } from "@/lib/validators"

interface ExchangeRates {
  [key: string]: number
}

interface CachedRates {
  base: string
  rates: ExchangeRates
  date: string
  timestamp: number
}

/* LIMITS */
const MAX_AMOUNT = 1e12 // 1,000,000,000,000
const MIN_AMOUNT = 0
const MAX_AMOUNT_DIGITS = String(MAX_AMOUNT).length

// 🪙 Default fallback exchange rates (USD-based)
const defaultRates: ExchangeRates = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
  INR: 74.0,
  BRL: 5.2,
  KRW: 1180.0,
  MXN: 20.0,
  SGD: 1.35,
  HKD: 7.8,
  NZD: 1.4,
  SEK: 8.5,
  NOK: 8.8,
  DKK: 6.3,
  PLN: 3.9,
}

type CurrencyErrors = {
  amount?: string
  rate?: string
}

type CurrencyResult = {
  converted: number
  input: number
  inputRaw: string
  from: string
  to: string
}

export const CurrencyConverter = () => {
  const [amount, setAmount] = useState("")
  const [fromCurrency, setFromCurrency] = useState("USD")
  const [toCurrency, setToCurrency] = useState("EUR")

  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({})
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [errors, setErrors] = useState<CurrencyErrors>({})
  const [result, setResult] = useState<CurrencyResult | null>(null)
  const [calculated, setCalculated] = useState(false)

  const currencies = useMemo(
    () => [
      { code: "USD", name: "US Dollar", symbol: "$" },
      { code: "EUR", name: "Euro", symbol: "€" },
      { code: "GBP", name: "British Pound", symbol: "£" },
      { code: "JPY", name: "Japanese Yen", symbol: "¥" },
      { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
      { code: "AUD", name: "Australian Dollar", symbol: "A$" },
      { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
      { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
      { code: "INR", name: "Indian Rupee", symbol: "₹" },
      { code: "BRL", name: "Brazilian Real", symbol: "R$" },
      { code: "KRW", name: "South Korean Won", symbol: "₩" },
      { code: "MXN", name: "Mexican Peso", symbol: "$" },
      { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
      { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
      { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
      { code: "SEK", name: "Swedish Krona", symbol: "kr" },
      { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
      { code: "DKK", name: "Danish Krone", symbol: "kr" },
      { code: "PLN", name: "Polish Zloty", symbol: "zł" },
    ],
    []
  )

  // Security helpers
  const isAllowedCode = (v: string) => currencies.some((c) => c.code === v)
  const coerceCurrency = (v: string) => (isAllowedCode(v) ? v : "USD")

  const getSymbol = (code: string) =>
    currencies.find((c) => c.code === code)?.symbol || code

  const getName = (code: string) =>
    currencies.find((c) => c.code === code)?.name || code

  const formattedMaxAmount = useMemo(
    () =>
      MAX_AMOUNT.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      }),
    []
  )

  const hasError = Boolean(errors.amount || errors.rate)

  // --- Fetch & cache rates for current base currency ---
  useEffect(() => {
    const fetchRates = async () => {
      const allowed = new Set(currencies.map((c) => c.code))
      setIsLoading(true)
      setErrors((prev) => ({ ...prev, rate: undefined }))

      const cacheKey = `rates_${fromCurrency}`

      // Local storage only in browser
      const hasWindow = typeof window !== "undefined"
      const hasStorage = hasWindow && typeof window.localStorage !== "undefined"

      if (hasStorage) {
        const cachedData = window.localStorage.getItem(cacheKey)

        if (cachedData) {
          try {
            const parsed: CachedRates = JSON.parse(cachedData)
            const now = Date.now()

            if (
              parsed &&
              typeof parsed === "object" &&
              typeof parsed.timestamp === "number" &&
              parsed.rates &&
              typeof parsed.rates === "object" &&
              typeof parsed.date === "string" &&
              now - parsed.timestamp < 24 * 60 * 60 * 1000
            ) {
              const safeRates: ExchangeRates = {}
              Object.entries(parsed.rates).forEach(([k, v]) => {
                if (allowed.has(k) && Number.isFinite(v)) {
                  safeRates[k] = v
                }
              })

              setExchangeRates(safeRates)
              setLastUpdated(
                new Date(parsed.date).toLocaleString(undefined, {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  second: "numeric",
                })
              )
              setIsLoading(false)
              return
            }
          } catch {
            // Ignore corrupted cache
          }
        }
      }

      // Live fetch with timeout & robust fallback
      try {
        if (!hasWindow) {
          throw new Error("No window context for fetch")
        }

        const controller = new AbortController()
        const timeoutId = window.setTimeout(() => controller.abort(), 10000)

        const res = await fetch(
          `https://api.frankfurter.app/latest?from=${encodeURIComponent(
            fromCurrency
          )}`,
          { signal: controller.signal }
        )

        window.clearTimeout(timeoutId)

        if (!res.ok) {
          throw new Error("Bad response from rate API")
        }

        const data = await res.json()

        if (data?.rates && typeof data.rates === "object") {
          const safeRates: ExchangeRates = {}
          Object.entries(data.rates as Record<string, number>).forEach(
            ([k, v]) => {
              if (allowed.has(k) && Number.isFinite(v)) {
                safeRates[k] = v
              }
            }
          )

          setExchangeRates(safeRates)
          setLastUpdated(
            new Date(data.date).toLocaleString(undefined, {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
            })
          )

          if (hasStorage) {
            window.localStorage.setItem(
              cacheKey,
              JSON.stringify({
                base: fromCurrency,
                rates: safeRates,
                date: data.date,
                timestamp: Date.now(),
              })
            )
          }
        } else {
          throw new Error("Invalid data structure")
        }
      } catch {
        console.warn("⚠️ Using fallback exchange rates.")
        notify.warning("Using fallback exchange rates (offline data).")

        // Convert USD-based defaultRates to be relative to fromCurrency
        const baseRate = defaultRates[fromCurrency] || 1
        const convertedRates: ExchangeRates = {}

        Object.keys(defaultRates).forEach((currency) => {
          if (currency !== fromCurrency && allowed.has(currency)) {
            convertedRates[currency] =
              defaultRates[currency] / baseRate
          }
        })

        setExchangeRates(convertedRates)

        const fallbackTime = new Date().toLocaleString(undefined, {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
        })
        setLastUpdated(`Offline data (updated manually on ${fallbackTime})`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRates()
  }, [fromCurrency, currencies])

  // --- Input handler (BMI-style: allow empty, clamp only max) ---
  const handleAmountChange = (val: string) => {
    const raw = val.trim()
    const n = raw === "" ? null : Number(raw)

    // Allow empty while typing
    if (n === null || Number.isNaN(n)) {
      setErrors((prev) => ({ ...prev, amount: undefined }))
      setAmount(val)
      return
    }

    // Clamp max only at UI level
    if (n > MAX_AMOUNT) {
      const msg = `Amount must be less than or equal to ${formattedMaxAmount}.`
      setErrors((prev) => ({ ...prev, amount: msg }))
      const clamped = String(MAX_AMOUNT)
      setAmount(clamped)
      return
    }

    // Disallow negative numbers at the UI level
    if (n < MIN_AMOUNT) {
      const msg = `Amount cannot be negative.`
      setErrors((prev) => ({ ...prev, amount: msg }))
      setAmount(String(MIN_AMOUNT))
      return
    }

    // Within allowed max, don't enforce min while typing
    // Preserve clamp/min error when the handler runs again with the clamped value to avoid flicker
    const maxMsg = `Amount must be less than or equal to ${formattedMaxAmount}.`
    const minMsg = `Amount cannot be negative.`
    if (n === MAX_AMOUNT && errors.amount === maxMsg) {
      setAmount(val)
      return
    }
    if (n === MIN_AMOUNT && errors.amount === minMsg) {
      setAmount(val)
      return
    }

    setErrors((prev) => ({ ...prev, amount: undefined }))
    setAmount(val)
  }

  const swapCurrencies = () => {
    const prevFrom = fromCurrency
    const prevTo = toCurrency
    setFromCurrency(prevTo)
    setToCurrency(prevFrom)
    // Keep displayed result until user explicitly converts again,
    // but attempt to update the snapshot using available cached rates.
    setErrors((prev) => ({ ...prev, rate: undefined }))

    // Try to compute the swapped conversion using current cached rates
    // exchangeRates are relative to the current `fromCurrency` (prevFrom).
    // To compute prevTo -> prevFrom we can invert the prevFrom -> prevTo rate.
    const amountNum = safeNumber(amount, { min: MIN_AMOUNT, max: MAX_AMOUNT })
    if (amountNum === null) return

    const rateForward = exchangeRates[prevTo]
    if (rateForward === undefined || !Number.isFinite(rateForward)) {
      // Can't compute swapped rate from cached data
      setErrors((prev) => ({ ...prev, rate: "Exchange rate not available for the selected pair." }))
      return
    }

    // Compute swapped conversion: amount (prevTo) -> prevFrom = amount / rateForward
    let swapped: number | null = safeCalc((D) => D(amountNum).div(rateForward))
    if (swapped === null || !Number.isFinite(swapped)) {
      swapped = amountNum / rateForward
      if (!Number.isFinite(swapped)) {
        setErrors((prev) => ({ ...prev, rate: "Conversion failed. Please try a different amount." }))
        return
      }
    }

    setResult({
      converted: swapped,
      input: amountNum,
      inputRaw: amount.trim(),
      from: prevTo,
      to: prevFrom,
    })
    setCalculated(true)
  }

  const clearAll = () => {
    setAmount("")
    setFromCurrency("USD")
    setToCurrency("EUR")
    setResult(null)
    setCalculated(false)
    setErrors({})
  }

  const getDisplayAmount = () => (amount.trim() === "" ? "0" : amount.trim())

  const onConvert = () => {
    setCalculated(false)
    setResult(null)
    setErrors({})

    // Required check
    if (!amount.trim()) {
      setErrors({ amount: "Amount is required." })
      notify.error("Please enter an amount before converting.")
      return
    }

    // Parse with safeNumber & validate range
    const amountNum = safeNumber(amount, {
      min: MIN_AMOUNT,
      max: MAX_AMOUNT,
    })

    const newErrors: CurrencyErrors = {}

    if (amountNum === null) {
      newErrors.amount = `Amount must be between ${MIN_AMOUNT.toLocaleString()} and ${formattedMaxAmount}.`
    } else {
      const rangeCheck = validateRange(amountNum, MIN_AMOUNT, MAX_AMOUNT)
      if (rangeCheck !== true) {
        newErrors.amount =
          typeof rangeCheck === "string"
            ? rangeCheck
            : `Amount must be between ${MIN_AMOUNT.toLocaleString()} and ${formattedMaxAmount}.`
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      notify.error("Please fix the highlighted fields before converting.")
      return
    }

    const safeAmount = amountNum!

    // If same currency, conversion is trivial
    if (fromCurrency === toCurrency) {
      setResult({
        converted: safeAmount,
        input: safeAmount,
        inputRaw: amount.trim(),
        from: fromCurrency,
        to: toCurrency,
      })
      setCalculated(true)
      return
    }

    // Ensure rate exists and is finite
    const rate = exchangeRates[toCurrency]
    if (rate === undefined || !Number.isFinite(rate)) {
      setErrors({
        rate: "Exchange rate not available for the selected pair.",
      })
      notify.error("Exchange rate not available. Please try again later.")
      return
    }

    // Perform conversion with safeCalc; guard against failure
    let converted: number | null = safeCalc((D) =>
      D(safeAmount).mul(rate)
    )

    if (converted === null || !Number.isFinite(converted)) {
      // Fallback to plain JS arithmetic as a last resort
      converted = safeAmount * rate
      if (!Number.isFinite(converted)) {
        setErrors({
          rate:
            "Conversion failed due to an unexpected numeric error. Please adjust the amount.",
        })
        notify.error("Conversion failed. Please try a smaller amount.")
        return
      }
    }

    setErrors({})
    setResult({
      converted: converted,
      input: safeAmount,
      inputRaw: amount.trim(),
      from: fromCurrency,
      to: toCurrency,
    })
    setCalculated(true)
  }

  const formattedConverted =
    calculated && result !== null
      ? result.converted.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })
      : "0.00"

  return (
    <div className="space-y-6">
      {/* Converter Card */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <SafeNumberInput
              id="amount"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              sanitizeOptions={{
                max: MAX_AMOUNT,
                maxLength: MAX_AMOUNT_DIGITS,
                allowDecimal: true,
              }}
              inputMode="decimal"
              aria-invalid={errors.amount ? "true" : "false"}
              aria-describedby={errors.amount ? "cc-amount-error" : undefined}
              className={errors.amount ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Min: {MIN_AMOUNT.toLocaleString()} • Max: {formattedMaxAmount}
            </p>
          </div>

          {/* From / To selects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From */}
            <div className="space-y-2">
              <Label>From</Label>
              <Select
                value={fromCurrency}
                onValueChange={(v) => {
                    setFromCurrency(coerceCurrency(v))
                    setErrors((prev) => ({ ...prev, rate: undefined }))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To */}
            <div className="space-y-2">
              <Label>To</Label>
              <Select
                value={toCurrency}
                onValueChange={(v) => {
                    setToCurrency(coerceCurrency(v))
                    setErrors((prev) => ({ ...prev, rate: undefined }))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onConvert}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              Convert
            </Button>
            <Button
              onClick={swapCurrencies}
              variant="outline"
              disabled={isLoading}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <Button onClick={clearAll} variant="outline">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Error display */}
          {hasError && (
            <div
              className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                {errors.amount && (
                  <div id="cc-amount-error">{errors.amount}</div>
                )}
                {errors.rate && <div id="cc-rate-error">{errors.rate}</div>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Result */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Result</CardTitle>
        </CardHeader>
        <CardContent className="text-center" aria-live="polite">
          {isLoading ? (
            <div className="py-4">
              <div className="text-lg text-muted-foreground mb-2">
                Loading exchange rates...
              </div>
              <div className="text-sm text-muted-foreground">Please wait</div>
            </div>
          ) : calculated && !hasError && result !== null ? (
            <>
              <div className="text-2xl sm:text-3xl font-bold mb-2 break-all px-2">
                {getSymbol(result.to)}
                {formattedConverted}
              </div>
              <p className="text-muted-foreground break-words px-2">
                {result.inputRaw} {getName(result.from)} ={" "}
                {formattedConverted} {getName(result.to)}
              </p>
            </>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">
              Enter an amount and click <strong>Convert</strong> to see the
              result.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Exchange Rate Info */}
      {lastUpdated && (
        <Card>
          <CardHeader>
            <CardTitle>Exchange Rate Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Currency Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Conversion Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Exchange rates fluctuate constantly throughout the day.</li>
            <li>• Banks and currency exchange services may charge fees.</li>
            <li>
              • Consider using credit cards with no foreign transaction fees
              when traveling.
            </li>
            <li>
              • Some currencies have different rates for buying and selling.
            </li>
            <li>
              • Always check the current rate before making large exchanges.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

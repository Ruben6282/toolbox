import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { notify } from "@/lib/notify"

/* =============================================================
   BASE LIMITS (derived from JS MAX_SAFE_INTEGER = 2^53 − 1)
   ============================================================= */

const MAX_DECIMAL = BigInt("9007199254740991") // 2^53 − 1
const MAX_BINARY = MAX_DECIMAL.toString(2) // 53 digits
const MAX_OCTAL = MAX_DECIMAL.toString(8) // 18 digits
const MAX_HEX = MAX_DECIMAL.toString(16).toUpperCase() // 14 digits

/* Digit caps */
const MAX_DIGITS = {
  binary: MAX_BINARY.length, // 53
  octal: MAX_OCTAL.length,   // 18
  hex: MAX_HEX.length,       // 14
  decimal: MAX_DECIMAL.toString().length, // 16
}

/* Helper for formatting bigints with commas */
const formatNumber = (n: bigint) =>
  n.toLocaleString("en-US")

export const BinaryConverter = () => {
  const [binary, setBinary] = useState("")
  const [decimal, setDecimal] = useState("")
  const [hex, setHex] = useState("")
  const [octal, setOctal] = useState("")

  type ConverterErrors = {
    binary?: string
    decimal?: string
    hex?: string
    octal?: string
  }

  const [errors, setErrors] = useState<ConverterErrors>({})
  const clearFieldError = (field: keyof ConverterErrors) =>
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev, [field]: undefined }
      // remove empty keys
      if (!next.binary && !next.decimal && !next.hex && !next.octal) return {}
      return next
    })
  const setFieldError = (field: keyof ConverterErrors, msg: string) =>
    setErrors((prev) => ({ ...prev, [field]: msg }))

  /* =============================================================
     GENERIC VALIDATION HELPERS
     ============================================================= */

  const ensureWithinLimit = (
    valueStr: string,
    base: number,
    maxValue: bigint,
    maxDigits: number,
    field: keyof ConverterErrors
  ): bigint | null => {
    if (!valueStr.trim()) {
      setFieldError(field, "Input cannot be empty.")
      return null
    }

    if (valueStr.length > maxDigits) {
      setFieldError(field, `Maximum allowed digits for this base is ${maxDigits}.`)
      return null
    }

    let parsed: bigint
    try {
      parsed = BigInt(parseInt(valueStr, base))
    } catch {
      setFieldError(field, "Invalid number.")
      return null
    }

    if (parsed > maxValue) {
      setFieldError(
        field,
        `Value exceeds maximum representable safe integer.\nMax allowed in this base: ${maxValue
          .toString(base)
          .toUpperCase()}`
      )
      return null
    }

    clearFieldError(field)
    return parsed
  }

  /* =============================================================
     INPUT HANDLERS — allow empty while typing
     ============================================================= */

  const handleBinaryChange = (v: string) => {
    clearFieldError("binary")
    setBinary(v.replace(/[^01]/g, "").slice(0, MAX_DIGITS.binary))
  }

  const handleDecimalChange = (v: string) => {
    clearFieldError("decimal")
    setDecimal(v.replace(/[^0-9]/g, "").slice(0, MAX_DIGITS.decimal))
  }

  const handleHexChange = (v: string) => {
    clearFieldError("hex")
    setHex(
      v.replace(/[^0-9a-fA-F]/g, "")
        .slice(0, MAX_DIGITS.hex)
        .toUpperCase()
    )
  }

  const handleOctalChange = (v: string) => {
    clearFieldError("octal")
    setOctal(v.replace(/[^0-7]/g, "").slice(0, MAX_DIGITS.octal))
  }

  /* =============================================================
     CONVERSION FUNCTIONS (BigInt-safe)
     ============================================================= */

  const convertAndSetAll = (num: bigint) => {
    // Clear any field errors now that conversion succeeded
    setErrors({})
    setDecimal(num.toString(10))
    setBinary(num.toString(2))
    setOctal(num.toString(8))
    setHex(num.toString(16).toUpperCase())
    notify.success("Converted successfully!")
  }

  const fromBinary = () => {
    const val = ensureWithinLimit(binary, 2, MAX_DECIMAL, MAX_DIGITS.binary, "binary")
    if (val !== null) convertAndSetAll(val)
  }

  const fromDecimal = () => {
    if (!decimal.trim()) {
      setFieldError("decimal", "Decimal value cannot be empty.")
      return
    }
    try {
      const num = BigInt(decimal)
      if (num < 0) {
        setFieldError("decimal", "Negative numbers are not supported.")
        return
      }
      if (num > MAX_DECIMAL) {
        setFieldError("decimal", `Decimal exceeds limit.\nMax: ${formatNumber(MAX_DECIMAL)}`)
        return
      }
      clearFieldError("decimal")
      convertAndSetAll(num)
    } catch {
      setFieldError("decimal", "Invalid decimal number.")
    }
  }

  const fromHex = () => {
    const val = ensureWithinLimit(hex, 16, MAX_DECIMAL, MAX_DIGITS.hex, "hex")
    if (val !== null) convertAndSetAll(val)
  }

  const fromOctal = () => {
    const val = ensureWithinLimit(octal, 8, MAX_DECIMAL, MAX_DIGITS.octal, "octal")
    if (val !== null) convertAndSetAll(val)
  }

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      notify.success(`${label} copied!`)
    } catch {
      notify.error("Failed to copy.")
    }
  }

  /* =============================================================
     RENDER
     ============================================================= */

  const InlineError = ({ msg }: { msg?: string }) =>
    msg ? (
      <div className="p-2 border border-red-200 bg-red-50 text-red-800 rounded-md text-sm whitespace-pre-line mt-1">
        {msg}
      </div>
    ) : null

  return (
    <div className="space-y-6">
      {/* BINARY -------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Binary (Base 2)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={binary}
            onChange={(e) => handleBinaryChange(e.target.value)}
            placeholder="Enter binary..."
            className="font-mono"
          />
          <InlineError msg={errors.binary} />
          <p className="text-xs text-muted-foreground">
            Max: {MAX_BINARY}
          </p>

          <div className="flex gap-2">
            <Button onClick={fromBinary} className="flex-1">Convert</Button>
            {binary && (
              <Button variant="outline" onClick={() => copy(binary, "Binary")}>
                Copy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DECIMAL ------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Decimal (Base 10)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={decimal}
            onChange={(e) => handleDecimalChange(e.target.value)}
            placeholder="Enter decimal..."
          />
          <InlineError msg={errors.decimal} />
          <p className="text-xs text-muted-foreground">
            Max: {formatNumber(MAX_DECIMAL)}
          </p>

          <div className="flex gap-2">
            <Button onClick={fromDecimal} className="flex-1">Convert</Button>
            {decimal && (
              <Button variant="outline" onClick={() => copy(decimal, "Decimal")}>
                Copy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* OCTAL --------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Octal (Base 8)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            className="font-mono"
            value={octal}
            onChange={(e) => handleOctalChange(e.target.value)}
            placeholder="Enter octal..."
          />
          <InlineError msg={errors.octal} />
          <p className="text-xs text-muted-foreground">Max: {MAX_OCTAL}</p>

          <div className="flex gap-2">
            <Button onClick={fromOctal} className="flex-1">Convert</Button>
            {octal && (
              <Button variant="outline" onClick={() => copy(octal, "Octal")}>
                Copy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* HEXADECIMAL -------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Hexadecimal (Base 16)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            className="font-mono"
            value={hex}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="Enter hex..."
          />
          <InlineError msg={errors.hex} />
          <p className="text-xs text-muted-foreground">Max: {MAX_HEX}</p>

          <div className="flex gap-2">
            <Button onClick={fromHex} className="flex-1">Convert</Button>
            {hex && (
              <Button variant="outline" onClick={() => copy(hex, "Hexadecimal")}>
                Copy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

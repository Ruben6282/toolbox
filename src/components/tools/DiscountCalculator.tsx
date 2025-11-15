import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, RotateCcw } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatCurrency } from "@/lib/safe-math";
import { validateRange } from "@/lib/validators";
import { notify } from "@/lib/notify";

/* LIMITS */
const PRICE_MAX = 1e9; // $1,000,000,000
const DISCOUNT_PERCENT_MIN = 0;
const DISCOUNT_PERCENT_MAX = 100;
const TAX_MIN = 0;
const TAX_MAX = 100;

/* TYPES */
type DiscountErrors = {
  price?: string;
  discount?: string;
  tax?: string;
};

type DiscountResult = {
  price: number;
  discountAmount: number;
  discountedPrice: number;
  taxRate: number;
  taxAmount: number;
  finalPrice: number;
  savings: number;
  effectivePercent: number;
};

export const DiscountCalculator = () => {
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountType, setDiscountType] =
    useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [taxRate, setTaxRate] = useState("");

  const [errors, setErrors] = useState<DiscountErrors>({});
  const [result, setResult] = useState<DiscountResult | null>(null);
  const [calculated, setCalculated] = useState(false);

  /* Currency formatter */
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

  const clearFieldError = (field: keyof DiscountErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev, [field]: undefined };
      if (!next.price && !next.discount && !next.tax) return {};
      return next;
    });
  };

  /* INPUT HANDLERS WITH UI-CLAMP LOGIC */

  const handlePriceChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (n > PRICE_MAX) {
        const msg = `Original price cannot exceed ${currencyFormatter.format(
          PRICE_MAX
        )}`;
        setErrors({ price: msg });
        setOriginalPrice(String(PRICE_MAX));
        return;
      }
      if (n < 0) {
        const msg = "Original price cannot be negative.";
        setErrors({ price: msg });
        setOriginalPrice("0");
        return;
      }
    }

    // Preserve clamp error when value equals the max we just applied to avoid flicker
    const priceMaxMsg = `Original price cannot exceed ${currencyFormatter.format(
      PRICE_MAX
    )}`;
    if (n === PRICE_MAX && errors.price === priceMaxMsg) {
      setOriginalPrice(val);
      return;
    }

    setErrors({});
    setOriginalPrice(val);
  };

  const handleDiscountChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (discountType === "percentage") {
      if (n !== null && !Number.isNaN(n)) {
        if (n > DISCOUNT_PERCENT_MAX) {
          const msg = `Discount percentage cannot exceed ${DISCOUNT_PERCENT_MAX}%`;
          setErrors({ discount: msg });
          setDiscountValue(String(DISCOUNT_PERCENT_MAX));
          return;
        }
        if (n < DISCOUNT_PERCENT_MIN) {
          const msg = `Discount percentage cannot be less than ${DISCOUNT_PERCENT_MIN}%`;
          setErrors({ discount: msg });
          setDiscountValue(String(DISCOUNT_PERCENT_MIN));
          return;
        }
      }
    } else {
      // Fixed amount
      if (n !== null && !Number.isNaN(n)) {
        if (n > PRICE_MAX) {
          const msg = `Discount amount cannot exceed ${currencyFormatter.format(
            PRICE_MAX
          )}`;
          setErrors({ discount: msg });
          setDiscountValue(String(PRICE_MAX));
          return;
        }
        if (n < 0) {
          const msg = "Discount amount cannot be negative.";
          setErrors({ discount: msg });
          setDiscountValue("0");
          return;
        }
      }
    }

    // Preserve clamp error when value equals the max/min we just applied to avoid flicker
    if (discountType === "percentage") {
      const maxMsg = `Discount percentage cannot exceed ${DISCOUNT_PERCENT_MAX}%`;
      const minMsg = `Discount percentage cannot be less than ${DISCOUNT_PERCENT_MIN}%`;
      if (n === DISCOUNT_PERCENT_MAX && errors.discount === maxMsg) {
        setDiscountValue(val);
        return;
      }
      if (n === DISCOUNT_PERCENT_MIN && errors.discount === minMsg) {
        setDiscountValue(val);
        return;
      }
    } else {
      const maxMsg = `Discount amount cannot exceed ${currencyFormatter.format(
        PRICE_MAX
      )}`;
      const minMsg = "Discount amount cannot be negative.";
      if (n === PRICE_MAX && errors.discount === maxMsg) {
        setDiscountValue(val);
        return;
      }
      if (n === 0 && errors.discount === minMsg) {
        setDiscountValue(val);
        return;
      }
    }

    setErrors({});
    setDiscountValue(val);
  };

  const handleTaxChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (n !== null && !Number.isNaN(n)) {
      if (n > TAX_MAX) {
        const msg = `Tax rate cannot exceed ${TAX_MAX}%`;
        setErrors({ tax: msg });
        setTaxRate(String(TAX_MAX));
        return;
      }
      if (n < TAX_MIN) {
        const msg = `Tax rate cannot be less than ${TAX_MIN}%`;
        setErrors({ tax: msg });
        setTaxRate(String(TAX_MIN));
        return;
      }
    }

    // Preserve clamp error when value equals the max/min we just applied to avoid flicker
    const taxMaxMsg = `Tax rate cannot exceed ${TAX_MAX}%`;
    const taxMinMsg = `Tax rate cannot be less than ${TAX_MIN}%`;
    if (n === TAX_MAX && errors.tax === taxMaxMsg) {
      setTaxRate(val);
      return;
    }
    if (n === TAX_MIN && errors.tax === taxMinMsg) {
      setTaxRate(val);
      return;
    }

    setErrors({});
    setTaxRate(val);
  };

  /* MAIN CALCULATE BUTTON HANDLER */

  const onCalculate = () => {
    setCalculated(false);
    setResult(null);

    const newErrors: DiscountErrors = {};

    // Empty checks first
    if (!originalPrice.trim()) newErrors.price = "Original price is required.";
    if (!discountValue.trim())
      newErrors.discount = "Discount value is required.";
    if (!taxRate.trim()) newErrors.tax = "Tax rate is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    // Parse with safeNumber
    const priceNum = safeNumber(originalPrice, { min: 0, max: PRICE_MAX });
    const taxNum = safeNumber(taxRate, { min: TAX_MIN, max: TAX_MAX });

    const discountNum = safeNumber(discountValue, {
      min: 0,
      max:
        discountType === "percentage" ? DISCOUNT_PERCENT_MAX : PRICE_MAX,
    });

    if (priceNum === null) {
      newErrors.price = `Original price must be between 0 and ${currencyFormatter.format(
        PRICE_MAX
      )}`;
    } else {
      const priceRange = validateRange(priceNum, 0, PRICE_MAX);
      if (priceRange !== true) {
        newErrors.price =
          typeof priceRange === "string"
            ? priceRange
            : `Original price must be between 0 and ${currencyFormatter.format(
                PRICE_MAX
              )}`;
      }
    }

    if (discountNum === null) {
      newErrors.discount =
        discountType === "percentage"
          ? `Discount percentage must be between ${DISCOUNT_PERCENT_MIN}% and ${DISCOUNT_PERCENT_MAX}%`
          : `Discount amount must be between 0 and ${currencyFormatter.format(
              PRICE_MAX
            )}`;
    }

    if (taxNum === null) {
      newErrors.tax = `Tax rate must be between ${TAX_MIN}% and ${TAX_MAX}%`;
    }

    // Additional check: fixed discount cannot exceed price
    if (
      discountType === "amount" &&
      priceNum !== null &&
      discountNum !== null &&
      discountNum > priceNum
    ) {
      newErrors.discount =
        "Discount amount cannot exceed the original price.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    // Now safe and valid
    const price = priceNum!;
    const taxRateValue = taxNum!;
    const discValue = discountNum!;

    let discountAmount = 0;
    let effectivePercent = 0;

    if (discountType === "percentage") {
      discountAmount = safeCalc((D) =>
        D(price).mul(discValue).div(100)
      )!;
      effectivePercent = discValue;
    } else {
      discountAmount = discValue;
      effectivePercent = price
        ? safeCalc((D) =>
            D(discountAmount).div(price).mul(100)
          )!
        : 0;
    }

    const discountedPrice = safeCalc((D) =>
      D(price).minus(discountAmount)
    )!;

    const taxAmount = safeCalc((D) =>
      D(discountedPrice).mul(taxRateValue).div(100)
    )!;

    const finalPrice = safeCalc((D) =>
      D(discountedPrice).plus(taxAmount)
    )!;

    const savings = safeCalc((D) =>
      D(price).minus(discountedPrice)
    )!;

    setErrors({});
    setResult({
      price,
      discountAmount,
      discountedPrice,
      taxRate: taxRateValue,
      taxAmount,
      finalPrice,
      savings,
      effectivePercent,
    });

    setCalculated(true);
    notify.success("Discount calculation completed.");
  };

  const onClear = () => {
    setOriginalPrice("");
    setDiscountType("percentage");
    setDiscountValue("");
    setTaxRate("");
    setErrors({});
    setCalculated(false);
    setResult(null);
  };

  const hasError = Boolean(errors.price || errors.discount || errors.tax);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Discount Calculator</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ORIGINAL PRICE */}
          <div className="space-y-2">
            <Label htmlFor="orig">Original Price</Label>
            <SafeNumberInput
              id="orig"
              placeholder="0.00"
              value={originalPrice}
              onChange={handlePriceChange}
              sanitizeOptions={{
                min: 0,
                max: PRICE_MAX,
                allowDecimal: true,
                maxLength: String(PRICE_MAX).length,
              }}
              aria-invalid={errors.price ? "true" : "false"}
              aria-describedby={errors.price ? "disc-price-err" : undefined}
              className={errors.price ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Max: {currencyFormatter.format(PRICE_MAX)}
            </p>
          </div>

          {/* DISCOUNT TYPE + VALUE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={discountType}
                onValueChange={(v) =>
                  setDiscountType(
                    v === "percentage" || v === "amount"
                      ? v
                      : "percentage"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="amount">Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disc-val">
                {discountType === "percentage"
                  ? "Discount (%)"
                  : "Discount Amount"}
              </Label>
              <SafeNumberInput
                id="disc-val"
                placeholder={discountType === "percentage" ? "0" : "0.00"}
                value={discountValue}
                onChange={handleDiscountChange}
                sanitizeOptions={{
                  min: 0,
                  max:
                    discountType === "percentage"
                      ? DISCOUNT_PERCENT_MAX
                      : PRICE_MAX,
                  allowDecimal: true,
                  maxLength:
                    discountType === "percentage"
                      ? 5
                      : String(PRICE_MAX).length,
                }}
                aria-invalid={errors.discount ? "true" : "false"}
                aria-describedby={
                  errors.discount ? "disc-discount-err" : undefined
                }
                className={errors.discount ? "border-red-500" : ""}
              />
            </div>
          </div>

          {/* TAX RATE */}
          <div className="space-y-2">
            <Label htmlFor="tax">Tax Rate (%)</Label>
            <SafeNumberInput
              id="tax"
              placeholder="0"
              value={taxRate}
              onChange={handleTaxChange}
              sanitizeOptions={{
                min: TAX_MIN,
                max: TAX_MAX,
                allowDecimal: true,
                maxLength: 5,
              }}
              aria-invalid={errors.tax ? "true" : "false"}
              aria-describedby={errors.tax ? "disc-tax-err" : undefined}
              className={errors.tax ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Range: {TAX_MIN}% – {TAX_MAX}%
            </p>
          </div>

          {/* ERRORS */}
          {(errors.price || errors.discount || errors.tax) && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              <div className="space-y-1">
                {errors.price && (
                  <div id="disc-price-err">{errors.price}</div>
                )}
                {errors.discount && (
                  <div id="disc-discount-err">{errors.discount}</div>
                )}
                {errors.tax && <div id="disc-tax-err">{errors.tax}</div>}
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
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULTS */}
      {calculated && result && !hasError && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" aria-live="polite">
            <div className="flex justify-between text-sm">
              <span>Original Price:</span>
              <span className="font-medium">
                {formatCurrency(result.price)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Discount Amount:</span>
              <span className="font-medium text-green-600">
                –{formatCurrency(result.discountAmount)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Discounted Price:</span>
              <span className="font-medium">
                {formatCurrency(result.discountedPrice)}
              </span>
            </div>

            {result.taxRate > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Tax ({result.taxRate.toFixed(2)}%):</span>
                  <span className="font-medium">
                    +{formatCurrency(result.taxAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-semibold">Final Price:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(result.finalPrice)}
                  </span>
                </div>
              </>
            )}

            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <div className="flex justify-between font-medium text-green-700 mb-1">
                <span>You Save:</span>
                <span>{formatCurrency(result.savings)}</span>
              </div>
              <div className="text-xs text-green-600">
                Effective Discount: {result.effectivePercent.toFixed(2)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TIPS SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>Discount Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Compare prices before applying discounts.</li>
            <li>• Check if discounts stack with other offers.</li>
            <li>• Remember shipping costs.</li>
            <li>• Look for minimum purchase requirements.</li>
            <li>• Factor in taxes when calculating final price.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

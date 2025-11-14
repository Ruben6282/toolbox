/**
 * DiscountCalculator - Enterprise-grade discount calculation tool
 *
 * Security & UX Features:
 * - Explicit Range Validation: Price, discount, and tax are rejected when out of bounds
 * - Input Sanitization: All inputs trimmed and validated with sanitizeNumber()
 * - NaN/Infinity Guards: Verifies all derived numbers are finite before rendering
 * - Error Handling UI: Role alert banner with aria-live announcements
 * - Accessibility: aria-invalid + aria-describedby on invalid fields; targeted aria-live regions
 * - Localization: Intl.NumberFormat for currency-safe, locale-aware formatting
 * - Robustness: Percentage and amount discounts validated; discount cannot exceed price
 * - Precision: All monetary values rounded to 2 decimal places
 * 
 * IMPORTANT SECURITY NOTES:
 * - This is CLIENT-SIDE validation only. Backend MUST re-validate all inputs
 * - Deploy with Content-Security-Policy headers to prevent XSS
 * - Consider rate limiting on backend if this data is submitted to a server
 * - All calculations are synchronous and run on every input change (no debouncing
 *   to avoid race conditions between validation display and calculations)
 */

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, RotateCcw } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatCurrency } from "@/lib/safe-math";
import { validateRange } from "@/lib/validators";

const PRICE_MAX = 1e9; // $1,000,000,000
const DISCOUNT_PERCENT_MIN = 0;
const DISCOUNT_PERCENT_MAX = 100;
const TAX_MIN = 0;
const TAX_MAX = 100;

export type DiscountComputation = {
  error: string | null;
  errorField: "price" | "discount" | "tax" | null;
  price?: number;
  discountAmount?: number;
  discountedPrice?: number;
  taxRate?: number;
  taxAmount?: number;
  finalPrice?: number;
  savings?: number;
  effectivePercent?: number;
};

// eslint-disable-next-line react-refresh/only-export-components
export function validateAndComputeDiscount(params: {
  originalPrice: string;
  discountType: "percentage" | "amount";
  discountValue: string;
  taxRate: string;
}): DiscountComputation {
  try {
    const { originalPrice, discountType, discountValue, taxRate } = params;

    // --- Original Price Validation ---
    let price = 0;

    const trimmedPrice = originalPrice.trim();
    if (trimmedPrice !== "") {
      const sanP = safeNumber(trimmedPrice, { min: 0, max: PRICE_MAX });
      
      if (sanP === null) {
        return {
          error: "Invalid original price. Please enter a valid number.",
          errorField: "price",
        };
      }

      const rangeError = validateRange(sanP, 0, PRICE_MAX);
      if (rangeError !== true) {
        return {
          error: typeof rangeError === 'string' ? rangeError : `Original price must be between $0 and $${PRICE_MAX.toLocaleString()}.`,
          errorField: "price",
        };
      }

      price = sanP;
    }

  // --- Discount Validation ---
  let discountNumeric = 0;

  const trimmedDiscount = discountValue.trim();
  if (trimmedDiscount !== "") {
    if (discountType === "percentage") {
      const sanD = safeNumber(trimmedDiscount, { min: DISCOUNT_PERCENT_MIN, max: DISCOUNT_PERCENT_MAX });
      
      if (sanD === null) {
        return {
          error: "Invalid discount percentage. Please enter a valid number between 0% and 100%.",
          errorField: "discount",
        };
      }

      const rangeError = validateRange(sanD, DISCOUNT_PERCENT_MIN, DISCOUNT_PERCENT_MAX);
      if (rangeError !== true) {
        return {
          error: typeof rangeError === 'string' ? rangeError : `Discount percentage must be between ${DISCOUNT_PERCENT_MIN}% and ${DISCOUNT_PERCENT_MAX}%.`,
          errorField: "discount",
        };
      }
      discountNumeric = sanD;
    } else {
      // Fixed amount
      const sanD = safeNumber(trimmedDiscount, { min: 0, max: PRICE_MAX });
      
      if (sanD === null) {
        return {
          error: "Invalid discount amount. Please enter a valid number.",
          errorField: "discount",
        };
      }

      const rangeError = validateRange(sanD, 0, PRICE_MAX);
      if (rangeError !== true) {
        return {
          error: typeof rangeError === 'string' ? rangeError : `Discount amount must be between $0 and $${PRICE_MAX.toLocaleString()}.`,
          errorField: "discount",
        };
      }
      discountNumeric = sanD;

      // Prevent discount > price when price is set
      if (price > 0 && discountNumeric > price) {
        return {
          error: "Discount amount cannot exceed the original price.",
          errorField: "discount",
        };
      }
    }
  } else {
    // No discount input -> treat as 0 discount
    discountNumeric = 0;
  }

  // --- Tax Validation ---
  let taxRateNum = 0;

  const trimmedTax = taxRate.trim();
  if (trimmedTax !== "") {
    const sanT = safeNumber(trimmedTax, { min: TAX_MIN, max: TAX_MAX });
    
    if (sanT === null) {
      return {
        error: "Invalid tax rate. Please enter a valid number between 0% and 100%.",
        errorField: "tax",
      };
    }

    const rangeError = validateRange(sanT, TAX_MIN, TAX_MAX);
    if (rangeError !== true) {
      return {
        error: typeof rangeError === 'string' ? rangeError : `Tax rate must be between ${TAX_MIN}% and ${TAX_MAX}%.`,
        errorField: "tax",
      };
    }

    taxRateNum = sanT;
  }

  // --- Computation using safeCalc ---
  let discountAmount: number | null;
  let effectivePercent: number | null;

  if (discountType === "percentage") {
    discountAmount = safeCalc(D => D(price).mul(discountNumeric).div(100));
    effectivePercent = discountNumeric;
  } else {
    discountAmount = discountNumeric;
    effectivePercent = price > 0 
      ? safeCalc(D => D(discountNumeric).div(price).mul(100))
      : 0;
  }

  if (discountAmount === null || effectivePercent === null) {
    return {
      error: "Calculation error. Please check your inputs.",
      errorField: null,
    };
  }

  const discountedPrice = safeCalc(D => D(price).minus(discountAmount!));
  const taxAmount = safeCalc(D => D(discountedPrice ?? 0).mul(taxRateNum).div(100));
  const finalPrice = safeCalc(D => D(discountedPrice ?? 0).plus(taxAmount ?? 0));
  const savings = safeCalc(D => D(price).minus(discountedPrice ?? 0));

  if (
    discountedPrice === null ||
    taxAmount === null ||
    finalPrice === null ||
    savings === null
  ) {
    return {
      error: "Calculation error. Please check your inputs.",
      errorField: null,
    };
  }

  return {
    error: null,
    errorField: null,
    price,
    discountAmount,
    discountedPrice,
    taxRate: taxRateNum,
    taxAmount,
    finalPrice,
    savings,
    effectivePercent,
  };
  } catch (error) {
    // Catch any unexpected errors to prevent component crash
    // In production, this should be logged to monitoring service
    console.error("DiscountCalculator: Unexpected error in validateAndComputeDiscount", error);
    return {
      error: "An unexpected error occurred. Please refresh and try again.",
      errorField: null,
    };
  }
}

export const DiscountCalculator = () => {
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [taxRate, setTaxRate] = useState("");



  const coerceDiscountType = (v: string): "percentage" | "amount" =>
    v === "percentage" || v === "amount" ? v : "percentage";

  // Locale-aware currency formatter (default locale, USD)
  // Note: Currency is hardcoded to USD for consistency. For multi-currency support,
  // add a currency selector and pass the selected currency here.
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

  // Calculate directly from inputs to avoid race conditions
  // Note: Removed debouncing as it created race conditions between
  // displayed validation errors and actual calculations
  const calc = useMemo(
    () =>
      validateAndComputeDiscount({
        originalPrice,
        discountType,
        discountValue,
        taxRate,
      }),
    [originalPrice, discountType, discountValue, taxRate]
  );

  const clearAll = useCallback(() => {
    setOriginalPrice("");
    setDiscountType("percentage");
    setDiscountValue("");
    setTaxRate("");
  }, []);

  const hasResults =
    !calc.error &&
    typeof calc.price === "number" &&
    calc.price > 0 &&
    typeof calc.discountAmount === "number";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Discount Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Original Price */}
          <div className="space-y-2">
            <Label htmlFor="original-price">Original Price</Label>
            <SafeNumberInput
              id="original-price"
              placeholder="0.00"
              value={originalPrice}
              onChange={(sanitized) => setOriginalPrice(sanitized)}
              sanitizeOptions={{ min: 0, max: PRICE_MAX }}
              inputMode="decimal"
              aria-invalid={calc.errorField === "price" ? "true" : "false"}
              aria-describedby={
                calc.errorField === "price" ? "discount-error" : undefined
              }
              className={calc.errorField === "price" ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Max: {currencyFormatter.format(PRICE_MAX)}
            </p>
          </div>

          {/* Discount Type + Value */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={discountType}
                onValueChange={(val) =>
                  setDiscountType(coerceDiscountType(val))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="amount">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-value">
                {discountType === "percentage"
                  ? "Discount Percentage (%)"
                  : "Discount Amount"}
              </Label>
              <SafeNumberInput
                id="discount-value"
                placeholder={discountType === "percentage" ? "0" : "0.00"}
                value={discountValue}
                onChange={(sanitized) => setDiscountValue(sanitized)}
                sanitizeOptions={{ 
                  min: 0, 
                  max: discountType === "percentage" ? DISCOUNT_PERCENT_MAX : PRICE_MAX 
                }}
                inputMode="decimal"
                aria-invalid={calc.errorField === "discount" ? "true" : "false"}
                aria-describedby={
                  calc.errorField === "discount" ? "discount-error" : undefined
                }
                className={
                  calc.errorField === "discount" ? "border-red-500" : ""
                }
              />
            </div>
          </div>

          {/* Tax Rate */}
          <div className="space-y-2">
            <Label htmlFor="tax-rate">Tax Rate (%) (Optional)</Label>
            <SafeNumberInput
              id="tax-rate"
              placeholder="0"
              value={taxRate}
              onChange={(sanitized) => setTaxRate(sanitized)}
              sanitizeOptions={{ min: TAX_MIN, max: TAX_MAX }}
              inputMode="decimal"
              aria-invalid={calc.errorField === "tax" ? "true" : "false"}
              aria-describedby={
                calc.errorField === "tax" ? "discount-error" : undefined
              }
              className={calc.errorField === "tax" ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Range: {TAX_MIN}% to {TAX_MAX}% (0% means no tax)
            </p>
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
              id="discount-error"
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

      {/* Results */}
      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-xs sm:text-sm gap-2">
                <span className="text-muted-foreground">Original Price:</span>
                <span 
                  className="font-medium break-words text-right"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {formatCurrency(calc.price!)}
                </span>
              </div>

              <div className="flex justify-between text-xs sm:text-sm gap-2">
                <span className="text-muted-foreground">Discount Amount:</span>
                <span 
                  className="font-medium text-green-600 break-words text-right"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  –{formatCurrency(calc.discountAmount!)}
                </span>
              </div>

              <div className="flex justify-between text-xs sm:text-sm gap-2">
                <span className="text-muted-foreground">Discounted Price:</span>
                <span 
                  className="font-medium break-words text-right"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {formatCurrency(calc.discountedPrice!)}
                </span>
              </div>

              {typeof calc.taxRate === "number" && calc.taxRate > 0 && (
                <>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground">
                      Tax ({calc.taxRate.toFixed(2)}%):
                    </span>
                    <span 
                      className="font-medium break-words text-right"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      +{formatCurrency(calc.taxAmount!)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t pt-2 text-xs sm:text-sm gap-2">
                    <span className="font-semibold">Final Price:</span>
                    <span 
                      className="font-bold text-base sm:text-lg break-words text-right"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {formatCurrency(calc.finalPrice!)}
                    </span>
                  </div>
                </>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-green-800 font-medium text-xs sm:text-sm">
                    You Save:
                  </span>
                  <span 
                    className="text-green-800 font-bold text-base sm:text-lg break-words"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {formatCurrency(calc.savings!)}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-green-700 mt-1">
                  {(calc.effectivePercent ?? 0).toFixed(2)}% off
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Discount Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              • Compare prices before applying discounts to ensure you're
              getting the best deal.
            </li>
            <li>• Check if discounts can be combined with other offers.</li>
            <li>• Consider shipping costs when calculating final price.</li>
            <li>• Some discounts may have minimum purchase requirements.</li>
            <li>• Don't forget to factor in taxes and fees.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

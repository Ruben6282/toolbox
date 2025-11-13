/**
 * DiscountCalculator - Enterprise-grade discount calculation tool
 *
 * Security & UX Features:
 * - Explicit Range Validation: Price, discount, and tax are rejected when out of bounds
 * - Input Sanitization: sanitizeNumber() used as a final guard against NaN/Infinity
 * - NaN/Infinity Guards: Verifies all derived numbers are finite before rendering
 * - Error Handling UI: Role alert banner with aria-live announcements
 * - Accessibility: aria-invalid + aria-describedby on invalid fields; aria-live on results
 * - Localization: Intl.NumberFormat for currency-safe, locale-aware formatting
 * - Robustness: Percentage and amount discounts validated; discount cannot exceed price
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, RotateCcw } from "lucide-react";
import { sanitizeNumber } from "@/lib/security";

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
  const { originalPrice, discountType, discountValue, taxRate } = params;

  // --- Original Price Validation ---
  let price = 0;

  if (originalPrice.trim() !== "") {
    const rawP = parseFloat(originalPrice);

    if (isNaN(rawP) || !isFinite(rawP)) {
      return {
        error: "Invalid original price. Please enter a valid number.",
        errorField: "price",
      };
    }

    if (rawP < 0 || rawP > PRICE_MAX) {
      return {
        error: `Original price must be between $0 and $${PRICE_MAX.toLocaleString()}.`,
        errorField: "price",
      };
    }

    const sanP = sanitizeNumber(rawP, 0, PRICE_MAX);
    if (sanP === null) {
      return {
        error: "Original price is invalid.",
        errorField: "price",
      };
    }

    price = sanP;
  }

  // --- Discount Validation ---
  let discountNumeric = 0;

  if (discountValue.trim() !== "") {
    const rawD = parseFloat(discountValue);

    if (isNaN(rawD) || !isFinite(rawD)) {
      return {
        error:
          discountType === "percentage"
            ? "Invalid discount percentage. Please enter a valid number."
            : "Invalid discount amount. Please enter a valid number.",
        errorField: "discount",
      };
    }

    if (discountType === "percentage") {
      if (rawD < DISCOUNT_PERCENT_MIN || rawD > DISCOUNT_PERCENT_MAX) {
        return {
          error: `Discount percentage must be between ${DISCOUNT_PERCENT_MIN}% and ${DISCOUNT_PERCENT_MAX}%.`,
          errorField: "discount",
        };
      }

      const sanD = sanitizeNumber(
        rawD,
        DISCOUNT_PERCENT_MIN,
        DISCOUNT_PERCENT_MAX
      );
      if (sanD === null) {
        return {
          error: "Discount percentage is invalid.",
          errorField: "discount",
        };
      }
      discountNumeric = sanD;
    } else {
      // Fixed amount
      if (rawD < 0 || rawD > PRICE_MAX) {
        return {
          error: `Discount amount must be between $0 and $${PRICE_MAX.toLocaleString()}.`,
          errorField: "discount",
        };
      }

      const sanD = sanitizeNumber(rawD, 0, PRICE_MAX);
      if (sanD === null) {
        return {
          error: "Discount amount is invalid.",
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

  if (taxRate.trim() !== "") {
    const rawT = parseFloat(taxRate);

    if (isNaN(rawT) || !isFinite(rawT)) {
      return {
        error: "Invalid tax rate. Please enter a valid number.",
        errorField: "tax",
      };
    }

    if (rawT < TAX_MIN || rawT > TAX_MAX) {
      return {
        error: `Tax rate must be between ${TAX_MIN}% and ${TAX_MAX}%.`,
        errorField: "tax",
      };
    }

    const sanT = sanitizeNumber(rawT, TAX_MIN, TAX_MAX);
    if (sanT === null) {
      return {
        error: "Tax rate is invalid.",
        errorField: "tax",
      };
    }

    taxRateNum = sanT;
  }

  // --- Computation ---
  let discountAmount: number;
  let effectivePercent: number;

  if (discountType === "percentage") {
    discountAmount = (price * discountNumeric) / 100;
    effectivePercent = discountNumeric;
  } else {
    discountAmount = discountNumeric;
    effectivePercent = price > 0 ? (discountAmount / price) * 100 : 0;
  }

  const discountedPrice = price - discountAmount;
  const taxAmount = (discountedPrice * taxRateNum) / 100;
  const finalPrice = discountedPrice + taxAmount;
  const savings = price - discountedPrice;

  // Finite guards
  if (
    !Number.isFinite(discountAmount) ||
    !Number.isFinite(discountedPrice) ||
    !Number.isFinite(taxAmount) ||
    !Number.isFinite(finalPrice) ||
    !Number.isFinite(savings) ||
    !Number.isFinite(effectivePercent)
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
}

export const DiscountCalculator = () => {
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [taxRate, setTaxRate] = useState("");

  // Locale-aware currency formatter (default locale, USD)
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

  const clearAll = () => {
    setOriginalPrice("");
    setDiscountType("percentage");
    setDiscountValue("");
    setTaxRate("");
  };

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
            <Input
              id="original-price"
              type="number"
              placeholder="0.00"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              min="0"
              step="0.01"
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
                  setDiscountType(val as "percentage" | "amount")
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
              <Input
                id="discount-value"
                type="number"
                placeholder={discountType === "percentage" ? "0" : "0.00"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                min="0"
                max={discountType === "percentage" ? "100" : undefined}
                step={discountType === "percentage" ? "0.1" : "0.01"}
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
            <Input
              id="tax-rate"
              type="number"
              placeholder="0"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              min="0"
              max="100"
              step="0.1"
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
          <CardContent
            className="space-y-4"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="space-y-3">
              <div className="flex justify-between text-xs sm:text-sm gap-2">
                <span className="text-muted-foreground">Original Price:</span>
                <span className="font-medium break-words text-right">
                  {currencyFormatter.format(calc.price!)}
                </span>
              </div>

              <div className="flex justify-between text-xs sm:text-sm gap-2">
                <span className="text-muted-foreground">Discount Amount:</span>
                <span className="font-medium text-green-600 break-words text-right">
                  –{currencyFormatter.format(calc.discountAmount!)}
                </span>
              </div>

              <div className="flex justify-between text-xs sm:text-sm gap-2">
                <span className="text-muted-foreground">Discounted Price:</span>
                <span className="font-medium break-words text-right">
                  {currencyFormatter.format(calc.discountedPrice!)}
                </span>
              </div>

              {typeof calc.taxRate === "number" && calc.taxRate > 0 && (
                <>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground">
                      Tax ({calc.taxRate.toFixed(1)}%):
                    </span>
                    <span className="font-medium break-words text-right">
                      +{currencyFormatter.format(calc.taxAmount!)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t pt-2 text-xs sm:text-sm gap-2">
                    <span className="font-semibold">Final Price:</span>
                    <span className="font-bold text-base sm:text-lg break-words text-right">
                      {currencyFormatter.format(calc.finalPrice!)}
                    </span>
                  </div>
                </>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-green-800 font-medium text-xs sm:text-sm">
                    You Save:
                  </span>
                  <span className="text-green-800 font-bold text-base sm:text-lg break-words">
                    {currencyFormatter.format(calc.savings!)}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-green-700 mt-1">
                  {(calc.effectivePercent ?? 0).toFixed(1)}% off
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

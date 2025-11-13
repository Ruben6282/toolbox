/**
 * TipCalculator - Enterprise-grade tip calculation tool
 *
 * Security & UX Features:
 * - Input Sanitization: sanitizeNumber() for bill, tip, and people with sensible ranges
 * - NaN/Infinity Guards: Verifies all derived numbers are finite before rendering
 * - Error Handling UI: Role alert banner with aria-live announcements
 * - Accessibility: aria-invalid + aria-describedby on invalid fields; aria-live on results
 * - Localization: Intl.NumberFormat for currency-safe, locale-aware formatting
 * - Robustness: Custom tip validated when selected; people clamped to integer range
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { sanitizeNumber } from "@/lib/security";

const BILL_MAX = 1e9; // $1,000,000,000
const TIP_MIN = 0;
const TIP_MAX = 100;
const PEOPLE_MIN = 1;
const PEOPLE_MAX = 1000;

export type TipComputation = {
  error: string | null;
  errorField: "bill" | "tip" | "people" | null;
  bill?: number;
  tipPercent?: number;
  people?: number;
  tipAmount?: number;
  totalBill?: number;
  tipPerPerson?: number;
  totalPerPerson?: number;
};

/**
 * Pure validator + computation logic for unit testing and reuse
 */
// eslint-disable-next-line react-refresh/only-export-components
export function validateAndComputeTip(params: {
  billAmount: string;
  useCustomTip: boolean;
  tipPercentage: string;
  customTip: string;
  people: string;
}): TipComputation {
  const { billAmount, useCustomTip, tipPercentage, customTip, people } = params;

  // Bill validation
  const billRaw = billAmount.trim() === "" ? NaN : parseFloat(billAmount);
  const billSan = isNaN(billRaw) ? null : sanitizeNumber(billRaw, 0, BILL_MAX);
  if (billAmount.trim() !== "" && billSan === null) {
    return { error: `Bill must be between $0 and $${BILL_MAX.toLocaleString()}`, errorField: "bill" };
  }
  const bill = billSan ?? 0;

  // Tip validation (custom or preset)
  const tipString = useCustomTip ? customTip : tipPercentage;
  if (useCustomTip && tipString.trim() === "") {
    return { error: "Please enter a custom tip percentage (0-100)", errorField: "tip" };
  }
  const tipRaw = tipString.trim() === "" ? NaN : parseFloat(tipString);
  const tipSan = isNaN(tipRaw) ? null : sanitizeNumber(tipRaw, TIP_MIN, TIP_MAX);
  if (tipString.trim() !== "" && tipSan === null) {
    return { error: `Tip percentage must be between ${TIP_MIN}% and ${TIP_MAX}%`, errorField: "tip" };
  }
  const tipPercent = tipSan ?? 0;

  // People validation
  const peopleRaw = people.trim() === "" ? NaN : parseFloat(people);
  const peopleSan0 = isNaN(peopleRaw) ? null : sanitizeNumber(peopleRaw, PEOPLE_MIN, PEOPLE_MAX);
  if (people.trim() !== "" && peopleSan0 === null) {
    return { error: `Number of people must be ${PEOPLE_MIN}-${PEOPLE_MAX}`, errorField: "people" };
  }
  const peopleInt = Math.round(peopleSan0 ?? 1);

  // Compute
  const tipAmount = (bill * tipPercent) / 100;
  const totalBill = bill + tipAmount;
  const tipPerPerson = tipAmount / peopleInt;
  const totalPerPerson = totalBill / peopleInt;

  // Finite guards
  if (!Number.isFinite(tipAmount) || !Number.isFinite(totalBill) || !Number.isFinite(tipPerPerson) || !Number.isFinite(totalPerPerson)) {
    return { error: "Calculation error. Please check your inputs.", errorField: null };
  }

  return {
    error: null,
    errorField: null,
    bill,
    tipPercent,
    people: peopleInt,
    tipAmount,
    totalBill,
    tipPerPerson,
    totalPerPerson,
  };
}

export const TipCalculator = () => {
  const [billAmount, setBillAmount] = useState("");
  const [tipPercentage, setTipPercentage] = useState("15");
  const [customTip, setCustomTip] = useState("");
  const [people, setPeople] = useState("1");
  const [useCustomTip, setUseCustomTip] = useState(false);

  // Locale-aware currency formatter (default locale, USD)
  const currencyFormatter = useMemo(() => new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  // Centralized validation + calculation
  const calc = useMemo(() => validateAndComputeTip({ billAmount, useCustomTip, tipPercentage, customTip, people }), [billAmount, useCustomTip, tipPercentage, customTip, people]);

  const presetTips = [
    { label: "10%", value: "10" },
    { label: "15%", value: "15" },
    { label: "18%", value: "18" },
    { label: "20%", value: "20" },
    { label: "25%", value: "25" },
  ];

  const clearAll = () => {
    setBillAmount("");
    setTipPercentage("15");
    setCustomTip("");
    setPeople("1");
    setUseCustomTip(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tip Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bill-amount">Bill Amount</Label>
            <Input
              id="bill-amount"
              type="number"
              placeholder="0.00"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              min="0"
              step="0.01"
              aria-invalid={calc.errorField === "bill" ? "true" : "false"}
              aria-describedby={calc.errorField === "bill" ? "tipcalc-error" : undefined}
              className={calc.errorField === "bill" ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">Max: {currencyFormatter.format(BILL_MAX)}</p>
          </div>

          <div className="space-y-2">
            <Label>Tip Percentage</Label>
            <div className="flex gap-2">
              <Select
                value={useCustomTip ? "custom" : tipPercentage}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setUseCustomTip(true);
                    setCustomTip("");
                  } else {
                    setUseCustomTip(false);
                    setTipPercentage(value);
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select tip percentage" />
                </SelectTrigger>
                <SelectContent>
                  {presetTips.map((tip) => (
                    <SelectItem key={tip.value} value={tip.value}>
                      {tip.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {useCustomTip && (
              <Input
                type="number"
                placeholder="Enter custom percentage"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                min="0"
                max="100"
                step="0.1"
                aria-invalid={calc.errorField === "tip" ? "true" : "false"}
                aria-describedby={calc.errorField === "tip" ? "tipcalc-error" : undefined}
                className={calc.errorField === "tip" ? "border-red-500" : ""}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="people">Number of People</Label>
            <Input
              id="people"
              type="number"
              placeholder="1"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              min="1"
              max={PEOPLE_MAX}
              aria-invalid={calc.errorField === "people" ? "true" : "false"}
              aria-describedby={calc.errorField === "people" ? "tipcalc-error" : undefined}
              className={calc.errorField === "people" ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">Range: {PEOPLE_MIN}-{PEOPLE_MAX}</p>
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full" aria-label="Clear all fields">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>

          {calc.error && (
            <div
              id="tipcalc-error"
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

      {!calc.error && (calc.bill ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" aria-live="polite" aria-atomic="true">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm gap-2">
                  <span className="text-muted-foreground">Tip Amount:</span>
                  <span className="font-medium break-words text-right">{currencyFormatter.format(calc.tipAmount!)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm gap-2">
                  <span className="text-muted-foreground">Total Bill:</span>
                  <span className="font-medium break-words text-right">{currencyFormatter.format(calc.totalBill!)}</span>
                </div>
              </div>

              {(calc.people ?? 1) > 1 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground">Tip per Person:</span>
                    <span className="font-medium break-words text-right">{currencyFormatter.format(calc.tipPerPerson!)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground">Total per Person:</span>
                    <span className="font-medium break-words text-right">{currencyFormatter.format(calc.totalPerPerson!)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted p-3 sm:p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-sm sm:text-base">Summary</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {(calc.people ?? 1) === 1 ? (
                  <>
                    You should tip <strong>{currencyFormatter.format(calc.tipAmount!)}</strong> ({(calc.tipPercent ?? 0).toFixed(0)}% of {currencyFormatter.format(calc.bill!)}),
                    making your total <strong>{currencyFormatter.format(calc.totalBill!)}</strong>.
                  </>
                ) : (
                  <>
                    Each person should pay <strong>{currencyFormatter.format(calc.totalPerPerson!)}</strong>
                    (including <strong>{currencyFormatter.format(calc.tipPerPerson!)}</strong> tip each).
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tip Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Restaurants:</strong> 15-20% for good service, 18-25% for excellent service
            </div>
            <div>
              <strong>Delivery:</strong> 10-15% of the order total
            </div>
            <div>
              <strong>Bar/Drinks:</strong> $1-2 per drink or 15-20% of the tab
            </div>
            <div>
              <strong>Hair Salon:</strong> 15-20% of the service cost
            </div>
            <div>
              <strong>Taxi/Rideshare:</strong> 10-15% of the fare
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


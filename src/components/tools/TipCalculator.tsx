/**
 * TipCalculator - Enterprise-grade tip calculation tool
 *
 * Security & UX Features:
 * - No real-time calculations: explicit "Calculate" button to control validation flow
 * - Input Sanitization: safeNumber + SafeNumberInput with sensible ranges per field
 * - NaN/Infinity Guards: Verifies all derived numbers before using them
 * - Range Handling:
 *    - Bill: 0 – 1,000,000,000
 *    - Tip:  0 – 100%
 *    - People: 1 – 1000 (whole numbers only)
 * - Error Handling UI: Clear per-field messages + consolidated alert
 * - Accessibility: aria-invalid, aria-describedby, aria-live on errors/results
 * - Localization: Uses currency formatter + formatCurrency for readable output
 */

import { useMemo, useState } from "react";
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
import { notify } from "@/lib/notify";

const BILL_MAX = 1e9; // $1,000,000,000
const TIP_MIN = 0;
const TIP_MAX = 100;
const PEOPLE_MIN = 1;
const PEOPLE_MAX = 1000;

type TipErrors = {
  bill?: string;
  tip?: string;
  people?: string;
};

type TipResult = {
  bill: number;
  tipPercent: number;
  people: number;
  tipAmount: number;
  totalBill: number;
  tipPerPerson: number;
  totalPerPerson: number;
};

export const TipCalculator = () => {
  const [billAmount, setBillAmount] = useState("");
  const [tipPercentage, setTipPercentage] = useState("15");
  const [customTip, setCustomTip] = useState("");
  const [people, setPeople] = useState("1");
  const [useCustomTip, setUseCustomTip] = useState(false);

  const [errors, setErrors] = useState<TipErrors>({});
  const [result, setResult] = useState<TipResult | null>(null);
  const [calculated, setCalculated] = useState(false);
  const [autoClamped, setAutoClamped] = useState<
    null | { field: "bill" | "tip" | "people"; clampedTo: string }
  >(null);

  // Locale-aware currency formatter (for helper text like "Max:")
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

  const BILL_MAX_LENGTH = String(BILL_MAX).length;
  const TIP_MAX_LENGTH = 5; // enough for "100.0"
  const PEOPLE_MAX_LENGTH = String(PEOPLE_MAX).length;

  const presetTips = [
    { label: "10%", value: "10" },
    { label: "15%", value: "15" },
    { label: "18%", value: "18" },
    { label: "20%", value: "20" },
    { label: "25%", value: "25" },
  ];

  const clearFieldError = (field: keyof TipErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev, [field]: undefined };
      if (!next.bill && !next.tip && !next.people) {
        return {};
      }
      return next;
    });
  };

  // --- Input handlers with clamping where appropriate ---

  const handleBillChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (autoClamped?.field === "bill" && val === autoClamped.clampedTo) {
      return;
    }

    if (n !== null && !Number.isNaN(n)) {
      if (n > BILL_MAX) {
        const clamped = String(BILL_MAX);
        setErrors({
          bill: `Bill amount exceeds maximum allowed of ${currencyFormatter.format(
            BILL_MAX
          )}`,
        });
        setBillAmount(clamped);
        setAutoClamped({ field: "bill", clampedTo: clamped });
        return;
      }
      if (n < 0) {
        const clamped = "0";
        setErrors({
          bill: "Bill amount cannot be negative.",
        });
        setBillAmount(clamped);
        setAutoClamped({ field: "bill", clampedTo: clamped });
        return;
      }
    }

    if (autoClamped?.field === "bill") {
      setAutoClamped(null);
    }

    clearFieldError("bill");
    setBillAmount(val);
  };

  const handleCustomTipChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (autoClamped?.field === "tip" && val === autoClamped.clampedTo) {
      return;
    }

    if (n !== null && !Number.isNaN(n)) {
      if (n > TIP_MAX) {
        const clamped = String(TIP_MAX);
        setErrors({
          tip: `Tip percentage must be less than or equal to ${TIP_MAX}%`,
        });
        setCustomTip(clamped);
        setAutoClamped({ field: "tip", clampedTo: clamped });
        return;
      }
      if (n < TIP_MIN) {
        const clamped = String(TIP_MIN);
        setErrors({
          tip: `Tip percentage must be at least ${TIP_MIN}%`,
        });
        setCustomTip(clamped);
        setAutoClamped({ field: "tip", clampedTo: clamped });
        return;
      }
    }

    if (autoClamped?.field === "tip") {
      setAutoClamped(null);
    }

    clearFieldError("tip");
    setCustomTip(val);
  };

  const handlePeopleChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    if (autoClamped?.field === "people" && val === autoClamped.clampedTo) {
      return;
    }

    if (n !== null && !Number.isNaN(n)) {
      if (!Number.isInteger(n)) {
        setErrors({
          people: "Number of people must be a whole number.",
        });
      } else {
        clearFieldError("people");
      }

      if (n > PEOPLE_MAX) {
        const clamped = String(PEOPLE_MAX);
        setErrors({
          people: `Number of people must be less than or equal to ${PEOPLE_MAX}`,
        });
        setPeople(clamped);
        setAutoClamped({ field: "people", clampedTo: clamped });
        return;
      }
      if (n < PEOPLE_MIN) {
        const clamped = String(PEOPLE_MIN);
        setErrors({
          people: `Number of people must be at least ${PEOPLE_MIN}`,
        });
        setPeople(clamped);
        setAutoClamped({ field: "people", clampedTo: clamped });
        return;
      }
    } else {
      clearFieldError("people");
    }

    if (autoClamped?.field === "people") {
      setAutoClamped(null);
    }

    setPeople(val);
  };

  // --- Calculation ---

  const onCalculate = () => {
    setCalculated(false);
    setResult(null);

    const newErrors: TipErrors = {};

    // Required checks
    if (!billAmount.trim()) {
      newErrors.bill = "Bill amount is required.";
    }
    const tipSource = useCustomTip ? customTip : tipPercentage;
    if (!tipSource.trim()) {
      newErrors.tip = "Tip percentage is required.";
    }
    if (!people.trim()) {
      newErrors.people = "Number of people is required.";
    }

    // If any required empty, short-circuit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    // Parse with safeNumber
    const billVal = safeNumber(billAmount, { min: 0, max: BILL_MAX });
    const tipVal = safeNumber(tipSource, { min: TIP_MIN, max: TIP_MAX });
    const peopleVal = safeNumber(people, {
      min: PEOPLE_MIN,
      max: PEOPLE_MAX,
      allowDecimal: false,
    });

    if (billVal === null) {
      newErrors.bill = `Bill must be a valid number between $0 and ${currencyFormatter.format(
        BILL_MAX
      )}.`;
    } else {
      const billRange = validateRange(billVal, 0, BILL_MAX);
      if (billRange !== true) {
        newErrors.bill =
          typeof billRange === "string"
            ? billRange
            : `Bill must be between $0 and ${currencyFormatter.format(
                BILL_MAX
              )}.`;
      }
    }

    if (tipVal === null) {
      newErrors.tip = `Tip percentage must be a valid number between ${TIP_MIN}% and ${TIP_MAX}%.`;
    } else {
      const tipRange = validateRange(tipVal, TIP_MIN, TIP_MAX);
      if (tipRange !== true) {
        newErrors.tip =
          typeof tipRange === "string"
            ? tipRange
            : `Tip percentage must be between ${TIP_MIN}% and ${TIP_MAX}%.`;
      }
    }

    if (peopleVal === null) {
      newErrors.people = `Number of people must be a whole number between ${PEOPLE_MIN} and ${PEOPLE_MAX}.`;
    } else {
      const peopleRange = validateRange(
        peopleVal,
        PEOPLE_MIN,
        PEOPLE_MAX
      );
      if (peopleRange !== true) {
        newErrors.people =
          typeof peopleRange === "string"
            ? peopleRange
            : `Number of people must be between ${PEOPLE_MIN} and ${PEOPLE_MAX}.`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix the highlighted fields before calculating.");
      return;
    }

    // At this point, non-null & valid
    const billNum = billVal as number;
    const tipPercentNum = tipVal as number;
    const peopleNum = peopleVal as number;

    // Compute using safeCalc
    const tipAmount = safeCalc((D) =>
      D(billNum).mul(tipPercentNum).div(100)
    );
    const totalBill = safeCalc((D) => D(billNum).plus(tipAmount ?? 0));
    const tipPerPerson = safeCalc((D) =>
      D(tipAmount ?? 0).div(peopleNum)
    );
    const totalPerPerson = safeCalc((D) =>
      D(totalBill ?? 0).div(peopleNum)
    );

    if (
      tipAmount === null ||
      totalBill === null ||
      tipPerPerson === null ||
      totalPerPerson === null ||
      !Number.isFinite(tipAmount) ||
      !Number.isFinite(totalBill) ||
      !Number.isFinite(tipPerPerson) ||
      !Number.isFinite(totalPerPerson)
    ) {
      setErrors({
        bill: "Calculation failed due to invalid numeric result. Please adjust your inputs.",
      });
      notify.error("Calculation failed: invalid numeric result.");
      setResult(null);
      return;
    }

    setErrors({});
    setResult({
      bill: billNum,
      tipPercent: tipPercentNum,
      people: peopleNum,
      tipAmount,
      totalBill,
      tipPerPerson,
      totalPerPerson,
    });
    setCalculated(true);
    notify.success("Tip calculation successful");
  };

  const onClear = () => {
    setBillAmount("");
    setTipPercentage("15");
    setCustomTip("");
    setPeople("1");
    setUseCustomTip(false);
    setErrors({});
    setResult(null);
    setCalculated(false);
    setAutoClamped(null);
  };

  const hasError = Boolean(errors.bill || errors.tip || errors.people);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tip Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bill Amount */}
          <div className="space-y-2">
            <Label htmlFor="bill-amount">Bill Amount</Label>
            <SafeNumberInput
              id="bill-amount"
              placeholder="0.00"
              value={billAmount}
              onChange={handleBillChange}
              sanitizeOptions={{
                min: 0,
                max: BILL_MAX,
                maxLength: BILL_MAX_LENGTH,
                allowDecimal: true,
              }}
              inputMode="decimal"
              aria-label="Bill amount"
              aria-invalid={errors.bill ? "true" : "false"}
              aria-describedby={errors.bill ? "tip-bill-error" : undefined}
              className={errors.bill ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Max: {currencyFormatter.format(BILL_MAX)}
            </p>
          </div>

          {/* Tip Percentage */}
          <div className="space-y-2">
            <Label>Tip Percentage</Label>
            <div className="flex gap-2">
              <Select
                value={useCustomTip ? "custom" : tipPercentage}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setUseCustomTip(true);
                    setCustomTip("");
                    clearFieldError("tip");
                  } else {
                    setUseCustomTip(false);
                    setTipPercentage(value);
                    clearFieldError("tip");
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
              <SafeNumberInput
                placeholder="Enter custom percentage"
                value={customTip}
                onChange={handleCustomTipChange}
                sanitizeOptions={{
                  min: TIP_MIN,
                  max: TIP_MAX,
                  maxLength: TIP_MAX_LENGTH,
                  allowDecimal: true,
                }}
                inputMode="decimal"
                aria-label="Custom tip percentage"
                aria-invalid={errors.tip ? "true" : "false"}
                aria-describedby={errors.tip ? "tip-tip-error" : undefined}
                className={errors.tip ? "border-red-500" : ""}
              />
            )}
            {!useCustomTip && (
              <p className="text-xs text-muted-foreground">
                Selected tip: {tipPercentage}%
              </p>
            )}
          </div>

          {/* Number of People */}
          <div className="space-y-2">
            <Label htmlFor="people">Number of People</Label>
            <SafeNumberInput
              id="people"
              placeholder="1"
              value={people}
              onChange={handlePeopleChange}
              sanitizeOptions={{
                min: PEOPLE_MIN,
                max: PEOPLE_MAX,
                maxLength: PEOPLE_MAX_LENGTH,
                allowDecimal: false,
              }}
              inputMode="numeric"
              aria-label="Number of people"
              aria-invalid={errors.people ? "true" : "false"}
              aria-describedby={errors.people ? "tip-people-error" : undefined}
              className={errors.people ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Range: {PEOPLE_MIN}-{PEOPLE_MAX}
            </p>
          </div>

          {/* Error Display */}
          {(errors.bill || errors.tip || errors.people) && (
            <div
              className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
              id="tipcalc-error"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {errors.bill && (
                    <div id="tip-bill-error">{errors.bill}</div>
                  )}
                  {errors.tip && <div id="tip-tip-error">{errors.tip}</div>}
                  {errors.people && (
                    <div id="tip-people-error">{errors.people}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              onClick={onCalculate}
              className="w-full"
              aria-label="Calculate tip"
            >
              Calculate
            </Button>
            <Button
              onClick={onClear}
              variant="outline"
              className="w-full"
              aria-label="Clear all fields"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {calculated && result && !hasError && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
          </CardHeader>
          <CardContent
            className="space-y-4"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm gap-2">
                  <span className="text-muted-foreground">Tip Amount:</span>
                  <span className="font-medium break-words text-right">
                    {formatCurrency(result.tipAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm gap-2">
                  <span className="text-muted-foreground">Total Bill:</span>
                  <span className="font-medium break-words text-right">
                    {formatCurrency(result.totalBill)}
                  </span>
                </div>
              </div>

              {result.people > 1 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground">
                      Tip per Person:
                    </span>
                    <span className="font-medium break-words text-right">
                      {formatCurrency(result.tipPerPerson)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground">
                      Total per Person:
                    </span>
                    <span className="font-medium break-words text-right">
                      {formatCurrency(result.totalPerPerson)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted p-3 sm:p-4 rounded-lg text-xs sm:text-sm text-muted-foreground">
              {result.people === 1 ? (
                <>
                  You should tip{" "}
                  <strong>{formatCurrency(result.tipAmount)}</strong> (
                  {result.tipPercent.toFixed(0)}% of{" "}
                  {formatCurrency(result.bill)}), making your total{" "}
                  <strong>{formatCurrency(result.totalBill)}</strong>.
                </>
              ) : (
                <>
                  Each person should pay{" "}
                  <strong>{formatCurrency(result.totalPerPerson)}</strong>{" "}
                  (including{" "}
                  <strong>{formatCurrency(result.tipPerPerson)}</strong> tip
                  each).
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tip Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <strong>Restaurants:</strong> 15–20% for good service, 18–25% for
              excellent service
            </div>
            <div>
              <strong>Delivery:</strong> 10–15% of the order total
            </div>
            <div>
              <strong>Bar/Drinks:</strong> $1–2 per drink or 15–20% of the tab
            </div>
            <div>
              <strong>Hair Salon:</strong> 15–20% of the service cost
            </div>
            <div>
              <strong>Taxi/Rideshare:</strong> 10–15% of the fare
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

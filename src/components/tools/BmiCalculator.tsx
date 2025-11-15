/**
 * BmiCalculator - Enterprise-grade BMI calculation tool
 *
 * Security & Reliability Features:
 * - Input Sanitization: safeNumber() validates numeric input and rejects NaN/Infinity
 * - Per-unit Range Limits:
 *   - Metric: 1–500 kg, 30–300 cm
 *   - Imperial: 2–1100 lbs, 12–120 in
 * - Safe Math: Guards against division by zero and non-finite BMI results
 * - Type Safety: Explicit numeric parsing with validation
 * - Error Handling UI: Clear, per-field error messages for invalid input
 * - Localization: Intl.NumberFormat for human-friendly BMI display (1 decimal)
 * - Accessibility: aria-live, aria-invalid, and aria-describedby for screen readers (WCAG 2.1 AA)
 * - Medical Disclaimer: Clearly states this is not medical advice
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatNumber } from "@/lib/safe-math";
import { validateRange, ValidationErrors } from "@/lib/validators";

type UnitSystem = "metric" | "imperial";

// Metric limits
const MIN_WEIGHT_KG = 1;
const MAX_WEIGHT_KG = 500;
const MIN_HEIGHT_CM = 30;
const MAX_HEIGHT_CM = 300;

// Imperial limits
const MIN_WEIGHT_LB = 2;
const MAX_WEIGHT_LB = 1100;
const MIN_HEIGHT_IN = 12;
const MAX_HEIGHT_IN = 120;

// Max length based on largest allowed values
const MAX_WEIGHT_DIGITS = String(MAX_WEIGHT_LB).length; // worst case across systems
const MAX_HEIGHT_DIGITS = String(MAX_HEIGHT_IN).length;

type BmiErrors = {
  weight?: string;
  height?: string;
};

export const BmiCalculator = () => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<BmiErrors>({});

  const getWeightLimits = () => {
    return unit === "metric"
      ? { min: MIN_WEIGHT_KG, max: MAX_WEIGHT_KG, labelUnit: "kg" }
      : { min: MIN_WEIGHT_LB, max: MAX_WEIGHT_LB, labelUnit: "lbs" };
  };

  const getHeightLimits = () => {
    return unit === "metric"
      ? { min: MIN_HEIGHT_CM, max: MAX_HEIGHT_CM, labelUnit: "cm" }
      : { min: MIN_HEIGHT_IN, max: MAX_HEIGHT_IN, labelUnit: "inches" };
  };

  const handleWeightChange = (val: string) => {
    const { max } = getWeightLimits();
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    // Allow empty while typing
    if (n === null || Number.isNaN(n)) {
      // Clear transient input errors (show no lingering errors while typing)
      setErrors({});
      setWeight(val);
      return;
    }

    // Clamp only the maximum at UI level
    if (n > max) {
      // Replace errors with only this weight clamp error while typing
      setErrors({ weight: `Weight must be less than or equal to ${max}.` });
      setWeight(String(max));
      return;
    }

    // Within allowed max, don't enforce min while typing
    // Preserve clamp error when value equals the max we just applied to avoid flicker
    const weightMaxMsg = `Weight must be less than or equal to ${max}.`;
    if (n === max && errors.weight === weightMaxMsg) {
      setWeight(val);
      return;
    }
    setErrors({});
    setWeight(val);
  };

  const handleHeightChange = (val: string) => {
    const { max } = getHeightLimits();
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    // Allow empty while typing
    if (n === null || Number.isNaN(n)) {
      // Clear transient input errors
      setErrors({});
      setHeight(val);
      return;
    }

    // Clamp only the maximum at UI level
    if (n > max) {
      // Replace errors with only this height clamp error while typing
      setErrors({ height: `Height must be less than or equal to ${max}.` });
      setHeight(String(max));
      return;
    }

    // Within allowed max, don't enforce min while typing
    // Preserve clamp error when value equals the max we just applied to avoid flicker
    const heightMaxMsg = `Height must be less than or equal to ${max}.`;
    if (n === max && errors.height === heightMaxMsg) {
      setHeight(val);
      return;
    }
    setErrors({});
    setHeight(val);
  };

  const calculate = () => {
    // Clear previous BMI result and errors on new attempt
    setBmi(null);
    setCategory("");
    setErrors({});

    const hasWeight = weight.trim().length > 0;
    const hasHeight = height.trim().length > 0;

    // If any field is missing, clear result and show specific errors
    if (!hasWeight || !hasHeight) {
      const newErrors: BmiErrors = {};
      if (!hasWeight) newErrors.weight = "Weight is required.";
      if (!hasHeight) newErrors.height = "Height is required.";
      setErrors(newErrors);
      return;
    }

    // Parse and validate inputs using unified system
    const weightVal = safeNumber(weight);
    const heightVal = safeNumber(height);

    if (weightVal === null) {
      setErrors({ weight: ValidationErrors.INVALID_NUMBER + " (weight)" });
      return;
    }

    if (heightVal === null) {
      setErrors({ height: ValidationErrors.INVALID_NUMBER + " (height)" });
      return;
    }

    const { min: wMin, max: wMax } = getWeightLimits();
    const { min: hMin, max: hMax } = getHeightLimits();

    // Unit-specific range validation using validateRange
    if (!validateRange(weightVal, wMin, wMax)) {
      setErrors({
        weight: `Weight must be between ${wMin} and ${wMax}.`,
      });
      return;
    }

    if (!validateRange(heightVal, hMin, hMax)) {
      setErrors({
        height: `Height must be between ${hMin} and ${hMax}.`,
      });
      return;
    }

    // Calculate BMI using safe math
    let bmiValue: number | null;

    if (unit === "metric") {
      // BMI = weight(kg) / (height(m))^2
      bmiValue = safeCalc((D) => {
        const heightMeters = D(heightVal).div(100);
        return D(weightVal).div(heightMeters.pow(2));
      });
    } else {
      // BMI = (weight(lbs) / (height(in))^2) * 703
      bmiValue = safeCalc((D) => {
        return D(weightVal).div(D(heightVal).pow(2)).mul(703);
      });
    }

    if (bmiValue === null || !Number.isFinite(bmiValue) || bmiValue <= 0) {
      setErrors({
        weight: "BMI calculation failed. Please check your inputs.",
      });
      return;
    }

    // Round to 1 decimal place
    const roundedBmi = Math.round(bmiValue * 10) / 10;
    setBmi(roundedBmi);
    setErrors({});

    // Determine category
    let cat: string;
    if (roundedBmi < 18.5) cat = "Underweight";
    else if (roundedBmi < 25) cat = "Normal weight";
    else if (roundedBmi < 30) cat = "Overweight";
    else cat = "Obese";

    setCategory(cat);
  };

  const handleUnitChange = (value: string) => {
    if (value === "metric" || value === "imperial") {
      setUnit(value);
      // Clear previous error and result when switching units
      setErrors({});
      setBmi(null);
      setCategory("");
    }
  };

  const getBmiColor = () => {
    if (bmi === null) return "";
    if (bmi < 18.5) return "text-blue-500";
    if (bmi < 25) return "text-green-500";
    if (bmi < 30) return "text-yellow-500";
    return "text-red-500";
  };

  const hasError = Boolean(errors.weight || errors.height);

  const weightLimits = getWeightLimits();
  const heightLimits = getHeightLimits();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Calculate BMI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Unit System</Label>
            <RadioGroup
              value={unit}
              onValueChange={handleUnitChange}
              className="flex gap-4 mt-2"
              aria-label="Select unit system"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="metric" id="metric" />
                <Label htmlFor="metric">Metric (kg, cm)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="imperial" id="imperial" />
                <Label htmlFor="imperial">Imperial (lbs, in)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Weight */}
          <div>
            <Label htmlFor="weight-input">
              Weight ({weightLimits.labelUnit})
            </Label>
            <SafeNumberInput
              id="weight-input"
              placeholder={
                unit === "metric" ? "e.g., 70" : "e.g., 154"
              }
              value={weight}
              onChange={handleWeightChange}
              sanitizeOptions={{
                // Only constrain max & length at the input level; min is enforced on Calculate
                max: weightLimits.max,
                maxLength: MAX_WEIGHT_DIGITS,
                allowDecimal: true,
              }}
              inputMode="decimal"
              aria-label="Body weight"
              aria-invalid={errors.weight ? "true" : "false"}
              aria-describedby={errors.weight ? "bmi-weight-error" : undefined}
              className={errors.weight ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Range: {weightLimits.min}–{weightLimits.max}{" "}
              {weightLimits.labelUnit}
            </p>
          </div>

          {/* Height */}
          <div>
            <Label htmlFor="height-input">
              Height ({heightLimits.labelUnit})
            </Label>
            <SafeNumberInput
              id="height-input"
              placeholder={
                unit === "metric" ? "e.g., 175" : "e.g., 69"
              }
              value={height}
              onChange={handleHeightChange}
              sanitizeOptions={{
                // Only constrain max & length at the input level; min is enforced on Calculate
                max: heightLimits.max,
                maxLength: MAX_HEIGHT_DIGITS,
                allowDecimal: true,
              }}
              inputMode="decimal"
              aria-label="Body height"
              aria-invalid={errors.height ? "true" : "false"}
              aria-describedby={errors.height ? "bmi-height-error" : undefined}
              className={errors.height ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Range: {heightLimits.min}–{heightLimits.max}{" "}
              {heightLimits.labelUnit}
            </p>
          </div>

          {/* Error Display */}
          {hasError && (
            <div
              className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                {errors.weight && (
                  <div id="bmi-weight-error" className="mb-1">
                    {errors.weight}
                  </div>
                )}
                {errors.height && (
                  <div id="bmi-height-error">
                    {errors.height}
                  </div>
                )}
              </div>
            </div>
          )}

          <Button onClick={calculate} className="w-full">
            Calculate BMI
          </Button>

          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
            This tool is for informational purposes only and does not provide
            medical advice. For personal health guidance, please consult a
            qualified healthcare professional.
          </p>
        </CardContent>
      </Card>

      {bmi !== null && !hasError && (
        <Card>
          <CardHeader>
            <CardTitle>Your Results</CardTitle>
          </CardHeader>
          <CardContent
            className="text-center"
            aria-live="polite"
            aria-atomic="true"
          >
            <div
              className={`text-4xl sm:text-5xl md:text-6xl font-bold mb-2 break-all px-2 ${getBmiColor()}`}
            >
              {formatNumber(bmi, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </div>
            <div className="text-xl sm:text-2xl font-semibold mb-4 break-words px-2">
              {category}
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Underweight:</span>
                <span>&lt; 18.5</span>
              </div>
              <div className="flex justify-between">
                <span>Normal weight:</span>
                <span>18.5 - 24.9</span>
              </div>
              <div className="flex justify-between">
                <span>Overweight:</span>
                <span>25 - 29.9</span>
              </div>
              <div className="flex justify-between">
                <span>Obese:</span>
                <span>≥ 30</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

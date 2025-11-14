/**
 * BmiCalculator - Enterprise-grade BMI calculation tool
 *
 * Security & Reliability Features:
 * - Input Sanitization: sanitizeNumber() validates numeric input and rejects NaN/Infinity
 * - Per-unit Range Clamping:
 *   - Metric: 1–500 kg, 30–300 cm
 *   - Imperial: 2–1100 lbs, 12–120 in
 * - Safe Math: Guards against division by zero and non-finite BMI results
 * - Type Safety: Explicit numeric parsing with validation and clamping
 * - Error Handling UI: Clear, accessible error messages for invalid input
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
import { validateRange, validateResult, ValidationErrors } from "@/lib/validators";

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

export const BmiCalculator = () => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  const calculate = () => {
    setError(null);

    const hasWeight = weight.trim().length > 0;
    const hasHeight = height.trim().length > 0;

    // If any field is missing, clear result and show no error
    if (!hasWeight || !hasHeight) {
      setBmi(null);
      setCategory("");
      return;
    }

    // Parse and validate inputs using unified system
    const weightVal = safeNumber(weight);
    const heightVal = safeNumber(height);

    if (weightVal === null) {
      setError(ValidationErrors.INVALID_NUMBER + " (weight)");
      setBmi(null);
      setCategory("");
      return;
    }

    if (heightVal === null) {
      setError(ValidationErrors.INVALID_NUMBER + " (height)");
      setBmi(null);
      setCategory("");
      return;
    }

    // Unit-specific range validation
    if (unit === "metric") {
      if (!validateRange(weightVal, MIN_WEIGHT_KG, MAX_WEIGHT_KG)) {
        setError(`Weight must be between ${MIN_WEIGHT_KG} kg and ${MAX_WEIGHT_KG} kg.`);
        setBmi(null);
        setCategory("");
        return;
      }
      if (!validateRange(heightVal, MIN_HEIGHT_CM, MAX_HEIGHT_CM)) {
        setError(`Height must be between ${MIN_HEIGHT_CM} cm and ${MAX_HEIGHT_CM} cm.`);
        setBmi(null);
        setCategory("");
        return;
      }
    } else {
      if (!validateRange(weightVal, MIN_WEIGHT_LB, MAX_WEIGHT_LB)) {
        setError(`Weight must be between ${MIN_WEIGHT_LB} lbs and ${MAX_WEIGHT_LB} lbs.`);
        setBmi(null);
        setCategory("");
        return;
      }
      if (!validateRange(heightVal, MIN_HEIGHT_IN, MAX_HEIGHT_IN)) {
        setError(`Height must be between ${MIN_HEIGHT_IN} inches and ${MAX_HEIGHT_IN} inches.`);
        setBmi(null);
        setCategory("");
        return;
      }
    }

    // Calculate BMI using safe math
    let bmiValue: number | null;

    if (unit === "metric") {
      // BMI = weight(kg) / (height(m))^2
      bmiValue = safeCalc(D => {
        const heightMeters = D(heightVal).div(100);
        return D(weightVal).div(heightMeters.pow(2));
      });
    } else {
      // BMI = (weight(lbs) / (height(in))^2) * 703
      bmiValue = safeCalc(D => {
        return D(weightVal).div(D(heightVal).pow(2)).mul(703);
      });
    }

    if (bmiValue === null || bmiValue <= 0) {
      setError("BMI calculation failed. Please check your inputs.");
      setBmi(null);
      setCategory("");
      return;
    }

    if (!validateResult(bmiValue)) {
      setError(ValidationErrors.RESULT_TOO_LARGE);
      setBmi(null);
      setCategory("");
      return;
    }

    // Round to 1 decimal place
    const roundedBmi = Math.round(bmiValue * 10) / 10;
    setBmi(roundedBmi);

    // Determine category
    let cat: string;
    if (roundedBmi < 18.5) cat = "Underweight";
    else if (roundedBmi < 25) cat = "Normal weight";
    else if (roundedBmi < 30) cat = "Overweight";
    else cat = "Obese";

    setCategory(cat);
  };

  const handleUnitChange = (value: string) => {
    // Only allow valid unit values
    if (value === "metric" || value === "imperial") {
      setUnit(value);
      // Clear previous error and result when switching units
      setError(null);
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

  const hasError = Boolean(error);

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

          <div>
            <Label htmlFor="weight-input">
              Weight {unit === "metric" ? "(kg)" : "(lbs)"}
            </Label>
            <SafeNumberInput
              id="weight-input"
              placeholder={unit === "metric" ? "e.g., 70" : "e.g., 154"}
              value={weight}
              onChange={setWeight}
              aria-label="Body weight"
              aria-invalid={hasError ? "true" : "false"}
              aria-describedby={hasError ? "bmi-error" : undefined}
              className={hasError ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {unit === "metric"
                ? `Range: ${MIN_WEIGHT_KG}–${MAX_WEIGHT_KG} kg`
                : `Range: ${MIN_WEIGHT_LB}–${MAX_WEIGHT_LB} lbs`}
            </p>
          </div>

          <div>
            <Label htmlFor="height-input">
              Height {unit === "metric" ? "(cm)" : "(inches)"}
            </Label>
            <SafeNumberInput
              id="height-input"
              placeholder={unit === "metric" ? "e.g., 175" : "e.g., 69"}
              value={height}
              onChange={setHeight}
              aria-label="Body height"
              aria-invalid={hasError ? "true" : "false"}
              aria-describedby={hasError ? "bmi-error" : undefined}
              className={hasError ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {unit === "metric"
                ? `Range: ${MIN_HEIGHT_CM}–${MAX_HEIGHT_CM} cm`
                : `Range: ${MIN_HEIGHT_IN}–${MAX_HEIGHT_IN} inches`}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div
              id="bmi-error"
              className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
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

      {bmi !== null && !error && (
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
              {formatNumber(bmi, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
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

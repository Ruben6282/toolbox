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

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle } from "lucide-react";
import { sanitizeNumber } from "@/lib/security";

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

/**
 * Safe numeric parser with validation and clamping
 */
function safeParseNumber(input: string, min: number, max: number): number | null {
  if (!input || input.trim() === "") return null;

  const raw = parseFloat(input);
  const sanitized = sanitizeNumber(raw, min, max);

  // sanitizeNumber returns null for invalid values
  if (sanitized === null) return null;

  return sanitized;
}

export const BmiCalculator = () => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Prevent UI freeze and odd number formats (e.g., scientific notation)
  const MAX_INPUT_LEN = 8; // generous for both unit systems

  const sanitizeNumericInput = (val: string) => {
    // Allow only digits and one decimal dot; strip other characters including e/E/+-
    const cleaned = val.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const normalized = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
    return normalized.slice(0, MAX_INPUT_LEN);
  };

  // BMI formatter (locale-aware, 1 decimal)
  const bmiFormatter = useMemo(() => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }, []);

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

    // Raw parse for detailed error feedback
    const rawW = parseFloat(weight);
    const rawH = parseFloat(height);

    if (isNaN(rawW) || !isFinite(rawW)) {
      setError("Invalid weight. Please enter a valid number.");
      setBmi(null);
      setCategory("");
      return;
    }

    if (isNaN(rawH) || !isFinite(rawH)) {
      setError("Invalid height. Please enter a valid number.");
      setBmi(null);
      setCategory("");
      return;
    }

    // Unit-specific range validation
    if (unit === "metric") {
      if (rawW < MIN_WEIGHT_KG || rawW > MAX_WEIGHT_KG) {
        setError(
          `Weight must be between ${MIN_WEIGHT_KG} kg and ${MAX_WEIGHT_KG} kg.`
        );
        setBmi(null);
        setCategory("");
        return;
      }
      if (rawH < MIN_HEIGHT_CM || rawH > MAX_HEIGHT_CM) {
        setError(
          `Height must be between ${MIN_HEIGHT_CM} cm and ${MAX_HEIGHT_CM} cm.`
        );
        setBmi(null);
        setCategory("");
        return;
      }
    } else {
      if (rawW < MIN_WEIGHT_LB || rawW > MAX_WEIGHT_LB) {
        setError(
          `Weight must be between ${MIN_WEIGHT_LB} lbs and ${MAX_WEIGHT_LB} lbs.`
        );
        setBmi(null);
        setCategory("");
        return;
      }
      if (rawH < MIN_HEIGHT_IN || rawH > MAX_HEIGHT_IN) {
        setError(
          `Height must be between ${MIN_HEIGHT_IN} inches and ${MAX_HEIGHT_IN} inches.`
        );
        setBmi(null);
        setCategory("");
        return;
      }
    }

    // Safe parsing + clamping
    const weightVal =
      unit === "metric"
        ? safeParseNumber(weight, MIN_WEIGHT_KG, MAX_WEIGHT_KG)
        : safeParseNumber(weight, MIN_WEIGHT_LB, MAX_WEIGHT_LB);

    const heightVal =
      unit === "metric"
        ? safeParseNumber(height, MIN_HEIGHT_CM, MAX_HEIGHT_CM)
        : safeParseNumber(height, MIN_HEIGHT_IN, MAX_HEIGHT_IN);

    if (weightVal === null || heightVal === null) {
      setError("One or more inputs are invalid. Please check your values.");
      setBmi(null);
      setCategory("");
      return;
    }

    let bmiValue: number;

    try {
      if (unit === "metric") {
        const heightMeters = heightVal / 100;
        if (heightMeters <= 0) {
          setError("Height must be greater than zero.");
          setBmi(null);
          setCategory("");
          return;
        }
        bmiValue = weightVal / (heightMeters * heightMeters);
      } else {
        if (heightVal <= 0) {
          setError("Height must be greater than zero.");
          setBmi(null);
          setCategory("");
          return;
        }
        bmiValue = (weightVal / (heightVal * heightVal)) * 703;
      }

      if (!isFinite(bmiValue) || bmiValue <= 0) {
        setError("BMI calculation resulted in an invalid value.");
        setBmi(null);
        setCategory("");
        return;
      }

      const normalizedBmi = parseFloat(bmiValue.toFixed(1));
      setBmi(normalizedBmi);

      let cat: string;
      if (normalizedBmi < 18.5) cat = "Underweight";
      else if (normalizedBmi < 25) cat = "Normal weight";
      else if (normalizedBmi < 30) cat = "Overweight";
      else cat = "Obese";

      setCategory(cat);
    } catch (err) {
      console.error("BMI calculation error:", err);
      setError("An unexpected error occurred during BMI calculation.");
      setBmi(null);
      setCategory("");
    }
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
            <Input
              id="weight-input"
              type="number"
              inputMode="decimal"
              placeholder={unit === "metric" ? "e.g., 70" : "e.g., 154"}
              value={weight}
              onChange={(e) => setWeight(sanitizeNumericInput(e.target.value))}
              min={unit === "metric" ? MIN_WEIGHT_KG : MIN_WEIGHT_LB}
              max={unit === "metric" ? MAX_WEIGHT_KG : MAX_WEIGHT_LB}
              step={0.1}
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
            <Input
              id="height-input"
              type="number"
              inputMode="decimal"
              placeholder={unit === "metric" ? "e.g., 175" : "e.g., 69"}
              value={height}
              onChange={(e) => setHeight(sanitizeNumericInput(e.target.value))}
              min={unit === "metric" ? MIN_HEIGHT_CM : MIN_HEIGHT_IN}
              max={unit === "metric" ? MAX_HEIGHT_CM : MAX_HEIGHT_IN}
              step={0.1}
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
              {bmiFormatter.format(bmi)}
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

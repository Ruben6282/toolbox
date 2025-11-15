import { useState } from "react";
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
import { RotateCcw, AlertCircle } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc } from "@/lib/safe-math";
import { validateRange } from "@/lib/validators";

/* LIMITS */
const MIN_AGE = 1;
const MAX_AGE = 120;

const METRIC = {
  MIN_W: 1,
  MAX_W: 500,
  MIN_H: 30,
  MAX_H: 300,
};

const IMPERIAL = {
  MIN_W: 2,
  MAX_W: 1100,
  MIN_H: 12,
  MAX_H: 120,
};

// Max length helpers (match BMI-style behavior)
const MAX_AGE_DIGITS = String(MAX_AGE).length;
const MAX_WEIGHT_DIGITS = String(IMPERIAL.MAX_W).length; // worst case across systems
const MAX_HEIGHT_DIGITS = String(IMPERIAL.MAX_H).length;

type UnitSystem = "metric" | "imperial";
type Gender = "male" | "female";

const ACTIVITY_LEVELS = {
  sedentary: {
    label: "Sedentary",
    multiplier: 1.2,
    description: "Little or no exercise",
  },
  light: {
    label: "Light Activity",
    multiplier: 1.375,
    description: "Light exercise 1–3 days/week",
  },
  moderate: {
    label: "Moderate Activity",
    multiplier: 1.55,
    description: "Moderate exercise 3–5 days/week",
  },
  active: {
    label: "Active",
    multiplier: 1.725,
    description: "Heavy exercise 6–7 days/week",
  },
  very_active: {
    label: "Very Active",
    multiplier: 1.9,
    description: "Very heavy exercise, physical job",
  },
} as const;

type ActivityLevel = keyof typeof ACTIVITY_LEVELS;

const GOALS = {
  maintain: { label: "Maintain Weight", deficit: 0 },
  lose_0_5: { label: "Lose 0.5 lb/week", deficit: 250 },
  lose_1: { label: "Lose 1 lb/week", deficit: 500 },
  lose_1_5: { label: "Lose 1.5 lb/week", deficit: 750 },
  lose_2: { label: "Lose 2 lb/week", deficit: 1000 },
  gain_0_5: { label: "Gain 0.5 lb/week", deficit: -250 },
  gain_1: { label: "Gain 1 lb/week", deficit: -500 },
} as const;

type GoalKey = keyof typeof GOALS;

type CalorieErrors = {
  age?: string;
  weight?: string;
  height?: string;
};

type CalorieResult = {
  bmr: number;
  tdee: number;
  calorieNeeds: number;
  bmi: number;
  bmiCategory: string;
  bmiColor: string;
};

const coerceUnit = (v: string): UnitSystem =>
  v === "metric" || v === "imperial" ? v : "metric";

const coerceGender = (v: string): Gender =>
  v === "male" || v === "female" ? v : "male";

const coerceActivity = (v: string): ActivityLevel =>
  v in ACTIVITY_LEVELS ? (v as ActivityLevel) : "moderate";

const coerceGoal = (v: string): GoalKey =>
  v in GOALS ? (v as GoalKey) : "maintain";

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { category: "Underweight", color: "text-blue-600" };
  if (bmi < 25) return { category: "Normal weight", color: "text-green-600" };
  if (bmi < 30) return { category: "Overweight", color: "text-yellow-600" };
  return { category: "Obese", color: "text-red-600" };
};

export const CalorieCalculator = () => {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<GoalKey>("maintain");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");

  const [errors, setErrors] = useState<CalorieErrors>({});
  const [result, setResult] = useState<CalorieResult | null>(null);
  const [calculated, setCalculated] = useState(false);

  const hasError = Boolean(errors.age || errors.weight || errors.height);

  // Helpers to get unit-specific limits
  const getWeightLimits = () =>
    unitSystem === "metric"
      ? { min: METRIC.MIN_W, max: METRIC.MAX_W, labelUnit: "kg" }
      : { min: IMPERIAL.MIN_W, max: IMPERIAL.MAX_W, labelUnit: "lbs" };

  const getHeightLimits = () =>
    unitSystem === "metric"
      ? { min: METRIC.MIN_H, max: METRIC.MAX_H, labelUnit: "cm" }
      : { min: IMPERIAL.MIN_H, max: IMPERIAL.MAX_H, labelUnit: "inches" };

  // --- INPUT HANDLERS (BMI-style: allow empty & below-min, clamp max only) ---

  const handleAgeChange = (val: string) => {
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    // Allow empty while typing
    if (n === null || Number.isNaN(n)) {
      // Clear age error (show no other lingering input errors)
      setErrors({});
      setAge(val);
      return;
    }

    // Clamp only maximum at UI level
    if (n > MAX_AGE) {
      // Replace errors with only the current age error
      setErrors({ age: `Age must be less than or equal to ${MAX_AGE}.` });
      setAge(String(MAX_AGE));
      return;
    }

    // Within allowed max, don't enforce min while typing
    // If the value equals the max and the existing error is the clamp message,
    // keep showing that clamp error to avoid flicker when we auto-set the max.
    const ageMaxMsg = `Age must be less than or equal to ${MAX_AGE}.`;
    if (n === MAX_AGE && errors.age === ageMaxMsg) {
      setAge(val);
      return;
    }
    setErrors({});
    setAge(val);
  };

  const handleWeightChange = (val: string) => {
    const { max } = getWeightLimits();
    const raw = val.trim();
    const n = raw === "" ? null : Number(raw);

    // Allow empty while typing
    if (n === null || Number.isNaN(n)) {
      // Clear weight error and any other transient input errors
      setErrors({});
      setWeight(val);
      return;
    }

    // Clamp only maximum at UI level
    if (n > max) {
      // Show only this weight error while typing
      setErrors({ weight: `Weight must be less than or equal to ${max}.` });
      setWeight(String(max));
      return;
    }

    // Within allowed max, don't enforce min while typing
    // Preserve clamp error if the value equals the max we just applied.
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
      // Clear height error and any other transient input errors
      setErrors({});
      setHeight(val);
      return;
    }

    // Clamp only maximum at UI level
    if (n > max) {
      // Replace errors with only this height error while typing
      setErrors({ height: `Height must be less than or equal to ${max}.` });
      setHeight(String(max));
      return;
    }

    // Within allowed max, don't enforce min while typing
    // Preserve clamp error if the value equals the max we just applied.
    const heightMaxMsg = `Height must be less than or equal to ${max}.`;
    if (n === max && errors.height === heightMaxMsg) {
      setHeight(val);
      return;
    }
    setErrors({});
    setHeight(val);
  };

  const clearAll = () => {
    setAge("");
    setGender("male");
    setWeight("");
    setHeight("");
    setActivityLevel("moderate");
    setGoal("maintain");
    setUnitSystem("metric");
    setErrors({});
    setResult(null);
    setCalculated(false);
  };

  const onCalculate = () => {
    setCalculated(false);
    setResult(null);

    const newErrors: CalorieErrors = {};

    // --- REQUIRED FIELD CHECKS (allow empty while typing, enforce on submit) ---
    if (!age.trim()) newErrors.age = "Age is required.";
    if (!weight.trim()) newErrors.weight = "Weight is required.";
    if (!height.trim()) newErrors.height = "Height is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // --- PARSE + RANGE VALIDATION ---

    // Age (integer-only, 1–120)
    const ageNum = safeNumber(age, {
      min: MIN_AGE,
      max: MAX_AGE,
      allowDecimal: false,
    });

    if (ageNum === null) {
      newErrors.age = `Age must be a whole number between ${MIN_AGE} and ${MAX_AGE}.`;
    } else {
      const ageRange = validateRange(ageNum, MIN_AGE, MAX_AGE);
      if (ageRange !== true) {
        newErrors.age =
          typeof ageRange === "string"
            ? ageRange
            : `Age must be between ${MIN_AGE} and ${MAX_AGE}.`;
      }
    }

    // Weight & Height limits depend on unit system
    const weightLimits =
      unitSystem === "metric"
        ? { min: METRIC.MIN_W, max: METRIC.MAX_W }
        : { min: IMPERIAL.MIN_W, max: IMPERIAL.MAX_W };

    const heightLimits =
      unitSystem === "metric"
        ? { min: METRIC.MIN_H, max: METRIC.MAX_H }
        : { min: IMPERIAL.MIN_H, max: IMPERIAL.MAX_H };

    const weightNum = safeNumber(weight, {
      min: weightLimits.min,
      max: weightLimits.max,
    });

    if (weightNum === null) {
      newErrors.weight =
        unitSystem === "metric"
          ? `Weight must be between ${METRIC.MIN_W}kg and ${METRIC.MAX_W}kg.`
          : `Weight must be between ${IMPERIAL.MIN_W}lbs and ${IMPERIAL.MAX_W}lbs.`;
    } else {
      const weightRange = validateRange(
        weightNum,
        weightLimits.min,
        weightLimits.max
      );
      if (weightRange !== true) {
        newErrors.weight =
          typeof weightRange === "string"
            ? weightRange
            : unitSystem === "metric"
            ? `Weight must be between ${METRIC.MIN_W}kg and ${METRIC.MAX_W}kg.`
            : `Weight must be between ${IMPERIAL.MIN_W}lbs and ${IMPERIAL.MAX_W}lbs.`;
      }
    }

    const heightNum = safeNumber(height, {
      min: heightLimits.min,
      max: heightLimits.max,
    });

    if (heightNum === null) {
      newErrors.height =
        unitSystem === "metric"
          ? `Height must be between ${METRIC.MIN_H}cm and ${METRIC.MAX_H}cm.`
          : `Height must be between ${IMPERIAL.MIN_H}in and ${IMPERIAL.MAX_H}in.`;
    } else {
      const heightRange = validateRange(
        heightNum,
        heightLimits.min,
        heightLimits.max
      );
      if (heightRange !== true) {
        newErrors.height =
          typeof heightRange === "string"
            ? heightRange
            : unitSystem === "metric"
            ? `Height must be between ${METRIC.MIN_H}cm and ${METRIC.MAX_H}cm.`
            : `Height must be between ${IMPERIAL.MIN_H}in and ${IMPERIAL.MAX_H}in.`;
      }
    }

    // If any errors, stop here
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Safe numeric values
    const ageSafe = ageNum!;
    const weightSafe = weightNum!;
    const heightSafe = heightNum!;

    // --- BMR CALCULATION (Harris-Benedict) ---
    let bmrRaw: number | null;

    if (gender === "male") {
      if (unitSystem === "metric") {
        bmrRaw = safeCalc((D) =>
          D(88.362)
            .plus(D(13.397).mul(weightSafe))
            .plus(D(4.799).mul(heightSafe))
            .minus(D(5.677).mul(ageSafe))
        );
      } else {
        // lbs -> kg, in -> cm
        bmrRaw = safeCalc((D) =>
          D(88.362)
            .plus(D(13.397).mul(weightSafe).mul(0.453592))
            .plus(D(4.799).mul(heightSafe).mul(2.54))
            .minus(D(5.677).mul(ageSafe))
        );
      }
    } else {
      if (unitSystem === "metric") {
        bmrRaw = safeCalc((D) =>
          D(447.593)
            .plus(D(9.247).mul(weightSafe))
            .plus(D(3.098).mul(heightSafe))
            .minus(D(4.33).mul(ageSafe))
        );
      } else {
        bmrRaw = safeCalc((D) =>
          D(447.593)
            .plus(D(9.247).mul(weightSafe).mul(0.453592))
            .plus(D(3.098).mul(heightSafe).mul(2.54))
            .minus(D(4.33).mul(ageSafe))
        );
      }
    }

    const bmr = bmrRaw ? Math.round(bmrRaw) : 0;

    // --- TDEE ---
    const activity = ACTIVITY_LEVELS[activityLevel];
    const tdeeRaw = safeCalc((D) => D(bmr).mul(activity.multiplier));
    const tdee = tdeeRaw ? Math.round(tdeeRaw) : 0;

    // --- CALORIE NEEDS (TDEE +/- deficit/surplus) ---
    const goalData = GOALS[goal];
    const needsRaw = safeCalc((D) => D(tdee).minus(goalData.deficit));
    const calorieNeeds = needsRaw ? Math.round(needsRaw) : 0;

    // --- BMI ---
    let bmiRaw: number | null;
    if (unitSystem === "metric") {
      bmiRaw = safeCalc((D) =>
        D(weightSafe).div(D(heightSafe).div(100).pow(2))
      );
    } else {
      bmiRaw = safeCalc((D) =>
        D(weightSafe).mul(703).div(D(heightSafe).pow(2))
      );
    }
    const bmi = bmiRaw || 0;
    const { category, color } = getBMICategory(bmi);

    setErrors({});
    setResult({
      bmr,
      tdee,
      calorieNeeds,
      bmi,
      bmiCategory: category,
      bmiColor: color,
    });
    setCalculated(true);
  };

  const weightLimits = getWeightLimits();
  const heightLimits = getHeightLimits();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calorie Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* UNIT SYSTEM */}
          <div className="space-y-2">
            <Label htmlFor="unit-system">Unit System</Label>
            <Select
              value={unitSystem}
              onValueChange={(v) => setUnitSystem(coerceUnit(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                <SelectItem value="imperial">Imperial (lbs, inches)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* INPUT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <SafeNumberInput
                id="age"
                placeholder="0"
                value={age}
                onChange={handleAgeChange}
                inputMode="numeric"
                sanitizeOptions={{
                  allowDecimal: false,
                  max: MAX_AGE,
                  maxLength: MAX_AGE_DIGITS,
                }}
                aria-invalid={errors.age ? "true" : "false"}
                aria-describedby={errors.age ? "cal-age-err" : undefined}
                className={errors.age ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Range: {MIN_AGE}–{MAX_AGE} years
              </p>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={gender}
                onValueChange={(v) => setGender(coerceGender(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">
                Weight ({weightLimits.labelUnit})
              </Label>
              <SafeNumberInput
                id="weight"
                placeholder="0"
                value={weight}
                onChange={handleWeightChange}
                sanitizeOptions={{
                  max: weightLimits.max,
                  maxLength: MAX_WEIGHT_DIGITS,
                  allowDecimal: true,
                }}
                aria-invalid={errors.weight ? "true" : "false"}
                aria-describedby={errors.weight ? "cal-weight-err" : undefined}
                className={errors.weight ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                {unitSystem === "metric"
                  ? `Range: ${METRIC.MIN_W}–${METRIC.MAX_W} kg`
                  : `Range: ${IMPERIAL.MIN_W}–${IMPERIAL.MAX_W} lbs`}
              </p>
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label htmlFor="height">
                Height ({heightLimits.labelUnit})
              </Label>
              <SafeNumberInput
                id="height"
                placeholder="0"
                value={height}
                onChange={handleHeightChange}
                sanitizeOptions={{
                  max: heightLimits.max,
                  maxLength: MAX_HEIGHT_DIGITS,
                  allowDecimal: true,
                }}
                aria-invalid={errors.height ? "true" : "false"}
                aria-describedby={errors.height ? "cal-height-err" : undefined}
                className={errors.height ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                {unitSystem === "metric"
                  ? `Range: ${METRIC.MIN_H}–${METRIC.MAX_H} cm`
                  : `Range: ${IMPERIAL.MIN_H}–${IMPERIAL.MAX_H} in`}
              </p>
            </div>
          </div>

          {/* ACTIVITY LEVEL */}
          <div className="space-y-2">
            <Label htmlFor="activity-level">Activity Level</Label>
            <Select
              value={activityLevel}
              onValueChange={(v) => setActivityLevel(coerceActivity(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_LEVELS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label} – {value.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* GOAL */}
          <div className="space-y-2">
            <Label htmlFor="goal">Weight Goal</Label>
            <Select
              value={goal}
              onValueChange={(v) => setGoal(coerceGoal(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select weight goal" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GOALS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ERRORS */}
          {(errors.age || errors.weight || errors.height) && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              <div className="space-y-1">
                {errors.age && <div id="cal-age-err">{errors.age}</div>}
                {errors.weight && (
                  <div id="cal-weight-err">{errors.weight}</div>
                )}
                {errors.height && (
                  <div id="cal-height-err">{errors.height}</div>
                )}
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={onCalculate} className="w-full">
              Calculate
            </Button>
            <Button
              onClick={clearAll}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULTS */}
      {calculated && result && !hasError && (
        <Card>
          <CardHeader>
            <CardTitle>Calorie Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" aria-live="polite">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 break-words px-2">
                  {result.bmr}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  BMR (Basal Metabolic Rate)
                </div>
                <div className="text-xs text-muted-foreground">
                  Calories at rest
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 break-words px-2">
                  {result.tdee}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  TDEE (Total Daily Energy Expenditure)
                </div>
                <div className="text-xs text-muted-foreground">
                  Calories with activity
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 break-words px-2">
                  {result.calorieNeeds}
                </div>
                <div className="text-sm text-muted-foreground">
                  Daily Calorie Target
                </div>
                <div className="text-xs text-muted-foreground">
                  For your goal
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Body Composition</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">BMI:</span>
                    <span className={`font-medium ${result.bmiColor}`}>
                      {result.bmi.toFixed(1)} ({result.bmiCategory})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Activity Level:
                    </span>
                    <span className="font-medium">
                      {ACTIVITY_LEVELS[activityLevel].label}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight Goal:</span>
                    <span className="font-medium">
                      {GOALS[goal].label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Daily Deficit/Surplus:
                    </span>
                    <span className="font-medium">
                      {GOALS[goal].deficit > 0 ? "-" : "+"}
                      {Math.abs(GOALS[goal].deficit)} calories
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Calorie Breakdown</h4>
              <div className="text-sm space-y-1">
                <p>
                  Your <strong>BMR</strong> is{" "}
                  <strong>{result.bmr} calories</strong> – this is how many
                  calories you burn at rest.
                </p>
                <p>
                  With your activity level, you burn{" "}
                  <strong>{result.tdee} calories</strong> per day.
                </p>
                <p>
                  To {GOALS[goal].label.toLowerCase()}, aim for{" "}
                  <strong>{result.calorieNeeds} calories</strong> per day.
                </p>
                {GOALS[goal].deficit > 0 && (
                  <p>
                    This creates a{" "}
                    <strong>{GOALS[goal].deficit} calorie deficit</strong> per
                    day.
                  </p>
                )}
                {GOALS[goal].deficit < 0 && (
                  <p>
                    This creates a{" "}
                    <strong>
                      {Math.abs(GOALS[goal].deficit)} calorie surplus
                    </strong>{" "}
                    per day.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nutrition Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• BMR is the minimum calories needed for basic bodily functions</li>
            <li>• TDEE includes your daily activities and exercise</li>
            <li>• A 500-calorie daily deficit equals about 1 lb weight loss per week</li>
            <li>• Don't go below 1200 calories per day without medical supervision</li>
            <li>• Focus on nutrient-dense foods for better health</li>
            <li>• Stay hydrated – aim for 8 glasses of water per day</li>
            <li>• Combine diet with regular exercise for best results</li>
            <li>• Consult a healthcare provider before making major dietary changes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

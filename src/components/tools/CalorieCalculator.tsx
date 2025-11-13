import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, Activity } from "lucide-react";

export const CalorieCalculator = () => {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [goal, setGoal] = useState("maintain");
  const [unitSystem, setUnitSystem] = useState("metric");

  // Guardrails and sanitizers
  const MIN_AGE = 1;
  const MAX_AGE = 120;
  const METRIC = { MIN_W: 1, MAX_W: 500, MIN_H: 30, MAX_H: 300 };
  const IMPERIAL = { MIN_W: 2, MAX_W: 1100, MIN_H: 12, MAX_H: 120 };
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  const sanitizeIntInput = (v: string, maxLen = 3) => v.replace(/[^0-9]/g, "").slice(0, maxLen);
  const sanitizeDecimalInput = (v: string, maxLen = 8) => {
    const cleaned = v.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const normalized = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
    return normalized.slice(0, maxLen);
  };
  const coerceUnit = (v: string) => (v === "metric" || v === "imperial" ? v : "metric");
  const coerceGender = (v: string) => (v === "male" || v === "female" ? v : "male");
  const coerceActivity = (v: string) => (v in activityLevels ? v : "moderate");
  const coerceGoal = (v: string) => (v in goals ? v : "maintain");

  const ageNum = parseFloat(age) || 0;
  const weightNum = parseFloat(weight) || 0;
  const heightNum = parseFloat(height) || 0;

  const activityLevels = {
    sedentary: { label: "Sedentary", multiplier: 1.2, description: "Little or no exercise" },
    light: { label: "Light Activity", multiplier: 1.375, description: "Light exercise 1-3 days/week" },
    moderate: { label: "Moderate Activity", multiplier: 1.55, description: "Moderate exercise 3-5 days/week" },
    active: { label: "Active", multiplier: 1.725, description: "Heavy exercise 6-7 days/week" },
    very_active: { label: "Very Active", multiplier: 1.9, description: "Very heavy exercise, physical job" }
  };

  const goals = {
    maintain: { label: "Maintain Weight", deficit: 0 },
    lose_0_5: { label: "Lose 0.5 lb/week", deficit: 250 },
    lose_1: { label: "Lose 1 lb/week", deficit: 500 },
    lose_1_5: { label: "Lose 1.5 lb/week", deficit: 750 },
    lose_2: { label: "Lose 2 lb/week", deficit: 1000 },
    gain_0_5: { label: "Gain 0.5 lb/week", deficit: -250 },
    gain_1: { label: "Gain 1 lb/week", deficit: -500 }
  };

  const calculateBMR = () => {
    if (ageNum < MIN_AGE || ageNum > MAX_AGE) return 0;
    if (weightNum <= 0 || heightNum <= 0) return 0;

    // Validate unit-specific ranges defensively
    if (unitSystem === "metric") {
      if (weightNum < METRIC.MIN_W || weightNum > METRIC.MAX_W) return 0;
      if (heightNum < METRIC.MIN_H || heightNum > METRIC.MAX_H) return 0;
    } else {
      if (weightNum < IMPERIAL.MIN_W || weightNum > IMPERIAL.MAX_W) return 0;
      if (heightNum < IMPERIAL.MIN_H || heightNum > IMPERIAL.MAX_H) return 0;
    }

    let bmr: number;
    
    if (gender === "male") {
      if (unitSystem === "metric") {
        bmr = 88.362 + (13.397 * weightNum) + (4.799 * heightNum) - (5.677 * ageNum);
      } else {
        bmr = 88.362 + (13.397 * weightNum * 0.453592) + (4.799 * heightNum * 2.54) - (5.677 * ageNum);
      }
    } else {
      if (unitSystem === "metric") {
        bmr = 447.593 + (9.247 * weightNum) + (3.098 * heightNum) - (4.330 * ageNum);
      } else {
        bmr = 447.593 + (9.247 * weightNum * 0.453592) + (3.098 * heightNum * 2.54) - (4.330 * ageNum);
      }
    }
    
    return Math.round(bmr);
  };

  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const activity = activityLevels[activityLevel as keyof typeof activityLevels];
    return Math.round(bmr * activity.multiplier);
  };

  const calculateCalorieNeeds = () => {
    const tdee = calculateTDEE();
    const goalData = goals[goal as keyof typeof goals];
    return Math.round(tdee - goalData.deficit);
  };

  const bmr = calculateBMR();
  const tdee = calculateTDEE();
  const calorieNeeds = calculateCalorieNeeds();

  const clearAll = () => {
    setAge("");
    setGender("male");
    setWeight("");
    setHeight("");
    setActivityLevel("moderate");
    setGoal("maintain");
    setUnitSystem("metric");
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-600" };
    if (bmi < 25) return { category: "Normal weight", color: "text-green-600" };
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-600" };
    return { category: "Obese", color: "text-red-600" };
  };

  const calculateBMI = () => {
    if (weightNum <= 0 || heightNum <= 0) return 0;
    
    if (unitSystem === "metric") {
      return weightNum / Math.pow(heightNum / 100, 2);
    } else {
      return (weightNum * 703) / Math.pow(heightNum, 2);
    }
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calorie Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unit-system">Unit System</Label>
            <Select value={unitSystem} onValueChange={(v) => setUnitSystem(coerceUnit(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                <SelectItem value="imperial">Imperial (lbs, inches)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="0"
                value={age}
                onChange={(e) => setAge(sanitizeIntInput(e.target.value))}
                inputMode="numeric"
                min={MIN_AGE}
                max={MAX_AGE}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={(v) => setGender(coerceGender(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">
                Weight ({unitSystem === "metric" ? "kg" : "lbs"})
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder="0"
                value={weight}
                onChange={(e) => setWeight(sanitizeDecimalInput(e.target.value))}
                inputMode="decimal"
                min={unitSystem === "metric" ? METRIC.MIN_W : IMPERIAL.MIN_W}
                max={unitSystem === "metric" ? METRIC.MAX_W : IMPERIAL.MAX_W}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">
                Height ({unitSystem === "metric" ? "cm" : "inches"})
              </Label>
              <Input
                id="height"
                type="number"
                placeholder="0"
                value={height}
                onChange={(e) => setHeight(sanitizeDecimalInput(e.target.value))}
                inputMode="decimal"
                min={unitSystem === "metric" ? METRIC.MIN_H : IMPERIAL.MIN_H}
                max={unitSystem === "metric" ? METRIC.MAX_H : IMPERIAL.MAX_H}
                step={0.1}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-level">Activity Level</Label>
            <Select value={activityLevel} onValueChange={(v) => setActivityLevel(coerceActivity(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(activityLevels).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label} - {value.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Weight Goal</Label>
            <Select value={goal} onValueChange={(v) => setGoal(coerceGoal(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select weight goal" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(goals).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {ageNum > 0 && weightNum > 0 && heightNum > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Calorie Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 break-words px-2">
                  {bmr}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">BMR (Basal Metabolic Rate)</div>
                <div className="text-xs text-muted-foreground">Calories at rest</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 break-words px-2">
                  {tdee}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">TDEE (Total Daily Energy Expenditure)</div>
                <div className="text-xs text-muted-foreground">Calories with activity</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 break-words px-2">
                  {calorieNeeds}
                </div>
                <div className="text-sm text-muted-foreground">Daily Calorie Target</div>
                <div className="text-xs text-muted-foreground">For your goal</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Body Composition</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">BMI:</span>
                    <span className={`font-medium ${bmiCategory.color}`}>
                      {bmi.toFixed(1)} ({bmiCategory.category})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Activity Level:</span>
                    <span className="font-medium">
                      {activityLevels[activityLevel as keyof typeof activityLevels].label}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight Goal:</span>
                    <span className="font-medium">
                      {goals[goal as keyof typeof goals].label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Deficit/Surplus:</span>
                    <span className="font-medium">
                      {goals[goal as keyof typeof goals].deficit > 0 ? '-' : '+'}
                      {Math.abs(goals[goal as keyof typeof goals].deficit)} calories
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Calorie Breakdown</h4>
              <div className="text-sm space-y-1">
                <p>
                  Your <strong>BMR</strong> is <strong>{bmr} calories</strong> - this is how many calories you burn at rest.
                </p>
                <p>
                  With your activity level, you burn <strong>{tdee} calories</strong> per day.
                </p>
                <p>
                  To {goals[goal as keyof typeof goals].label.toLowerCase()}, aim for <strong>{calorieNeeds} calories</strong> per day.
                </p>
                {goals[goal as keyof typeof goals].deficit > 0 && (
                  <p>
                    This creates a <strong>{goals[goal as keyof typeof goals].deficit} calorie deficit</strong> per day.
                  </p>
                )}
                {goals[goal as keyof typeof goals].deficit < 0 && (
                  <p>
                    This creates a <strong>{Math.abs(goals[goal as keyof typeof goals].deficit)} calorie surplus</strong> per day.
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
            <li>• Stay hydrated - aim for 8 glasses of water per day</li>
            <li>• Combine diet with regular exercise for best results</li>
            <li>• Consult a healthcare provider before making major dietary changes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

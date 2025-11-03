import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const BmiCalculator = () => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState("metric");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState("");

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (!w || !h || w <= 0 || h <= 0) return;

    let bmiValue: number;
    if (unit === "metric") {
      bmiValue = w / ((h / 100) * (h / 100));
    } else {
      bmiValue = (w / (h * h)) * 703;
    }

    setBmi(parseFloat(bmiValue.toFixed(1)));

    if (bmiValue < 18.5) setCategory("Underweight");
    else if (bmiValue < 25) setCategory("Normal weight");
    else if (bmiValue < 30) setCategory("Overweight");
    else setCategory("Obese");
  };

  const getBmiColor = () => {
    if (!bmi) return "";
    if (bmi < 18.5) return "text-blue-500";
    if (bmi < 25) return "text-green-500";
    if (bmi < 30) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Calculate BMI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Unit System</Label>
            <RadioGroup value={unit} onValueChange={setUnit} className="flex gap-4 mt-2">
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
            <Label>Weight {unit === "metric" ? "(kg)" : "(lbs)"}</Label>
            <Input
              type="number"
              placeholder={unit === "metric" ? "e.g., 70" : "e.g., 154"}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <div>
            <Label>Height {unit === "metric" ? "(cm)" : "(inches)"}</Label>
            <Input
              type="number"
              placeholder={unit === "metric" ? "e.g., 175" : "e.g., 69"}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>

          <Button onClick={calculate} className="w-full">Calculate BMI</Button>
        </CardContent>
      </Card>

      {bmi !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Your Results</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`text-4xl sm:text-5xl md:text-6xl font-bold mb-2 break-all px-2 ${getBmiColor()}`}>{bmi}</div>
            <div className="text-xl sm:text-2xl font-semibold mb-4 break-words px-2">{category}</div>
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

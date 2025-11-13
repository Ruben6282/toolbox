import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";

// Max safe integer for calculations to prevent overflow
const MAX_NUMBER = 1e9;
const MIN_NUMBER = 1;

// Sanitize: strip non-digit chars, clamp to safe range
const sanitizeInteger = (val: string): string => {
  const cleaned = val.replace(/[^0-9]/g, "");
  if (cleaned === "") return "";
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return "";
  const clamped = Math.max(MIN_NUMBER, Math.min(MAX_NUMBER, num));
  return clamped.toString();
};

export const LcmGcdCalculator = () => {
  const [number1, setNumber1] = useState("");
  const [number2, setNumber2] = useState("");
  const [additionalNumbers, setAdditionalNumbers] = useState("");

  const num1 = parseInt(number1) || 0;
  const num2 = parseInt(number2) || 0;
  const additional = additionalNumbers
    .split(",")
    .map(n => parseInt(n.trim()))
    .filter(n => !isNaN(n) && n > 0);

  const gcd = (a: number, b: number): number => {
    if (b === 0) return a;
    return gcd(b, a % b);
  };

  const lcm = (a: number, b: number): number => {
    return (a * b) / gcd(a, b);
  };

  const calculateGCD = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    if (numbers.length === 1) return numbers[0];
    
    let result = gcd(numbers[0], numbers[1]);
    for (let i = 2; i < numbers.length; i++) {
      result = gcd(result, numbers[i]);
    }
    return result;
  };

  const calculateLCM = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    if (numbers.length === 1) return numbers[0];
    
    let result = lcm(numbers[0], numbers[1]);
    for (let i = 2; i < numbers.length; i++) {
      result = lcm(result, numbers[i]);
    }
    return result;
  };

  const allNumbers = [num1, num2, ...additional].filter(n => n > 0);
  const gcdResult = calculateGCD(allNumbers);
  const lcmResult = calculateLCM(allNumbers);

  const clearAll = () => {
    setNumber1("");
    setNumber2("");
    setAdditionalNumbers("");
  };

  const getPrimeFactors = (num: number): number[] => {
    const factors: number[] = [];
    let divisor = 2;
    
    while (num > 1) {
      while (num % divisor === 0) {
        factors.push(divisor);
        num /= divisor;
      }
      divisor++;
    }
    
    return factors;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LCM & GCD Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number1">First Number</Label>
              <Input
                id="number1"
                type="text"
                inputMode="numeric"
                placeholder="Enter first number"
                value={number1}
                onChange={(e) => setNumber1(sanitizeInteger(e.target.value))}
                min={MIN_NUMBER}
                max={MAX_NUMBER}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number2">Second Number</Label>
              <Input
                id="number2"
                type="text"
                inputMode="numeric"
                placeholder="Enter second number"
                value={number2}
                onChange={(e) => setNumber2(sanitizeInteger(e.target.value))}
                min={MIN_NUMBER}
                max={MAX_NUMBER}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-numbers">Additional Numbers (comma-separated)</Label>
            <Input
              id="additional-numbers"
              type="text"
              inputMode="numeric"
              placeholder="e.g., 12, 18, 24"
              value={additionalNumbers}
              onChange={(e) => {
                // Allow digits, commas, and spaces
                const val = e.target.value.replace(/[^0-9, ]/g, "");
                setAdditionalNumbers(val);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Enter additional numbers separated by commas for multiple number calculations
            </p>
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {allNumbers.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">Greatest Common Divisor (GCD)</h4>
                <div className="bg-muted p-3 sm:p-4 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-center mb-2 break-words">{gcdResult}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center break-words px-2">
                    GCD of {allNumbers.join(", ")}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">Least Common Multiple (LCM)</h4>
                <div className="bg-muted p-3 sm:p-4 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-center mb-2 break-words">{lcmResult}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center break-words px-2">
                    LCM of {allNumbers.join(", ")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm sm:text-base">Prime Factorization</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allNumbers.map((num, index) => {
                  const factors = getPrimeFactors(num);
                  return (
                    <div key={index} className="bg-muted p-3 rounded-lg">
                      <div className="font-medium text-sm sm:text-base mb-1 break-words">{num}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground break-words">
                        {factors.length > 0 ? factors.join(" × ") : "Prime number"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>GCD (Greatest Common Divisor):</strong> The largest number that divides all given numbers without remainder.</p>
                <p><strong>LCM (Least Common Multiple):</strong> The smallest number that is a multiple of all given numbers.</p>
                <p><strong>Relationship:</strong> GCD(a,b) × LCM(a,b) = a × b</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Enter at least two positive integers</li>
            <li>• Add more numbers separated by commas for multiple number calculations</li>
            <li>• GCD finds the largest number that divides all numbers evenly</li>
            <li>• LCM finds the smallest number that all numbers divide into evenly</li>
            <li>• Useful for simplifying fractions and solving math problems</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";

// Strict, safe limits
const MAX_DIGITS = 18; // max 18 digits per number
const MIN_VALUE = 1n;
const MAX_VALUE = 999_999_999_999_999_999n; // 10^18 - 1
const MAX_NUMBERS = 20; // max total numbers (including first/second + additional)

// Prime factorization limit (BigInt)
const MAX_FACTORIZE = 10_000_000n;

export const LcmGcdCalculator = () => {
  const [number1, setNumber1] = useState("");
  const [number2, setNumber2] = useState("");
  const [additionalNumbers, setAdditionalNumbers] = useState("");

  /**
   * Sanitize integer input:
   * - allow only digits
   * - enforce max digit length
   */
  const sanitizeIntegerInput = (val: string): string => {
    // Keep only digits
    const digitsOnly = val.replace(/[^0-9]/g, "");
    if (!digitsOnly) return "";
    // Enforce max digit length
    if (digitsOnly.length > MAX_DIGITS) {
      return digitsOnly.slice(0, MAX_DIGITS);
    }
    return digitsOnly;
  };

  /**
   * Parse a string to BigInt within [MIN_VALUE, MAX_VALUE]
   * Returns null if invalid or out of range
   */
  const parseBigIntOrNull = (val: string): bigint | null => {
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (trimmed.length > MAX_DIGITS) return null;

    try {
      const n = BigInt(trimmed);
      if (n < MIN_VALUE || n > MAX_VALUE) return null;
      return n;
    } catch {
      return null;
    }
  };

  /**
   * GCD using Euclidean algorithm (BigInt)
   */
  const gcd = useCallback((a: bigint, b: bigint): bigint => {
    let x = a;
    let y = b;
    while (y !== 0n) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x;
  }, []);

  /**
   * LCM using BigInt: lcm(a, b) = |a / gcd(a, b) * b|
   * (division first to reduce growth)
   */
  const lcm = useCallback((a: bigint, b: bigint): bigint => {
    if (a === 0n || b === 0n) return 0n;
    const g = gcd(a, b);
    return (a / g) * b;
  }, [gcd]);

  /**
   * Prime factorization for BigInt up to MAX_FACTORIZE.
   * Returns array of factors (BigInt). Only used for "small" numbers.
   */
  const getPrimeFactors = (num: bigint): bigint[] => {
    const factors: bigint[] = [];
    let n = num;

    // Factor 2s
    while (n % 2n === 0n) {
      factors.push(2n);
      n /= 2n;
    }

    let divisor = 3n;
    while (divisor * divisor <= n) {
      while (n % divisor === 0n) {
        factors.push(divisor);
        n /= divisor;
      }
      divisor += 2n;
    }

    if (n > 1n) {
      factors.push(n);
    }

    return factors;
  };

  /**
   * Compute all numbers, GCD, LCM, and factorization using useMemo
   * to avoid unnecessary recomputation.
   */
  const {
    allNumbers,
    gcdResult,
    lcmResult,
  } = useMemo(() => {
    const nums: bigint[] = [];

    const n1 = parseBigIntOrNull(number1);
    const n2 = parseBigIntOrNull(number2);

    if (n1 !== null) nums.push(n1);
    if (n2 !== null) nums.push(n2);

    // Parse additional comma-separated numbers
    if (additionalNumbers.trim()) {
      const tokens = additionalNumbers
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      for (const token of tokens) {
        if (nums.length >= MAX_NUMBERS) break;
        const parsed = parseBigIntOrNull(token);
        if (parsed !== null) {
          nums.push(parsed);
        }
      }
    }

    // Need at least 2 numbers to calculate GCD/LCM meaningfully
    if (nums.length < 2) {
      return {
        allNumbers: nums,
        gcdResult: null as bigint | null,
        lcmResult: null as bigint | null,
      };
    }

    // Compute GCD of all numbers
    let g = nums[0];
    for (let i = 1; i < nums.length; i++) {
      g = gcd(g, nums[i]);
    }

    // Compute LCM of all numbers
    let l = nums[0];
    for (let i = 1; i < nums.length; i++) {
      l = lcm(l, nums[i]);
    }

    return {
      allNumbers: nums,
      gcdResult: g,
      lcmResult: l,
    };
  }, [number1, number2, additionalNumbers, gcd, lcm]);

  const clearAll = () => {
    setNumber1("");
    setNumber2("");
    setAdditionalNumbers("");
  };

  const hasResults = allNumbers.length >= 2 && gcdResult !== null && lcmResult !== null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LCM &amp; GCD Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number1">
                First Number{" "}
                <span className="text-xs text-muted-foreground">
                  (1 – {MAX_VALUE.toString()})
                </span>
              </Label>
              <Input
                id="number1"
                placeholder="Enter first number"
                inputMode="numeric"
                value={number1}
                onChange={(e) => setNumber1(sanitizeIntegerInput(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number2">
                Second Number{" "}
                <span className="text-xs text-muted-foreground">
                  (1 – {MAX_VALUE.toString()})
                </span>
              </Label>
              <Input
                id="number2"
                placeholder="Enter second number"
                inputMode="numeric"
                value={number2}
                onChange={(e) => setNumber2(sanitizeIntegerInput(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-numbers">
              Additional Numbers (comma-separated)
            </Label>
            <Input
              id="additional-numbers"
              type="text"
              inputMode="numeric"
              placeholder="e.g., 12, 18, 24"
              value={additionalNumbers}
              onChange={(e) => {
                // Allow digits, commas, and spaces only
                const val = e.target.value.replace(/[^0-9, ]/g, "");
                setAdditionalNumbers(val);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Enter up to {MAX_NUMBERS} numbers total. Each must be a positive
              integer (max {MAX_DIGITS} digits).
            </p>
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">
                  Greatest Common Divisor (GCD)
                </h4>
                <div className="bg-muted p-3 sm:p-4 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-center mb-2 break-words">
                    {gcdResult!.toString()}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center break-words px-2">
                    GCD of{" "}
                    {allNumbers.map((n) => n.toString()).join(", ")}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">
                  Least Common Multiple (LCM)
                </h4>
                <div className="bg-muted p-3 sm:p-4 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-center mb-2 break-words">
                    {lcmResult!.toString()}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center break-words px-2">
                    LCM of{" "}
                    {allNumbers.map((n) => n.toString()).join(", ")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm sm:text-base">
                Prime Factorization
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allNumbers.map((num, index) => {
                  const canFactor = num <= MAX_FACTORIZE;
                  let factorsText: string;

                  if (!canFactor) {
                    factorsText = `Number too large for factorization (max ${MAX_FACTORIZE.toString()}).`;
                  } else {
                    const factors = getPrimeFactors(num);
                    if (factors.length > 0) {
                      factorsText = factors.map((f) => f.toString()).join(" × ");
                    } else {
                      factorsText = "Prime number";
                    }
                  }

                  return (
                    <div
                      key={index}
                      className="bg-muted p-3 rounded-lg space-y-1"
                    >
                      <div className="font-medium text-sm sm:text-base break-words">
                        {num.toString()}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground break-words">
                        {factorsText}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Prime factorization is performed only for numbers up to{" "}
                {MAX_FACTORIZE.toString()} to ensure fast and safe calculations.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <strong>GCD (Greatest Common Divisor):</strong> The largest
                  number that divides all given numbers without remainder.
                </p>
                <p>
                  <strong>LCM (Least Common Multiple):</strong> The smallest
                  number that is a multiple of all given numbers.
                </p>
                <p>
                  <strong>Relationship (for two numbers):</strong>{" "}
                  GCD(a, b) × LCM(a, b) = a × b
                </p>
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
            <li>• Enter at least two positive integers.</li>
            <li>
              • Each number can have up to {MAX_DIGITS} digits (1 to{" "}
              {MAX_VALUE.toString()}).
            </li>
            <li>
              • You can add more numbers separated by commas (up to{" "}
              {MAX_NUMBERS} numbers total).
            </li>
            <li>
              • GCD finds the largest number that divides all numbers evenly.
            </li>
            <li>
              • LCM finds the smallest number that all numbers divide into
              evenly.
            </li>
            <li>• Prime factorization is shown for reasonably sized inputs.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

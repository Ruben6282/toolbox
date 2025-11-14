import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";
import { RefreshCw } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";

const MAX_NUMBER = 1e12; // 1 trillion
const MIN_NUMBER = -1e12;
const MAX_COUNT = 10000;

// Secure random integer in range [min, max]
const secureRandomInRange = (min: number, max: number): number => {
  const range = max - min + 1;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return min + (arr[0] % range);
  }
  return Math.floor(Math.random() * range) + min;
};

export const RandomNumber = () => {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState("1");
  const [numbers, setNumbers] = useState<number[]>([]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const generate = () => {
    const minNum = safeNumber(min, { min: MIN_NUMBER, max: MAX_NUMBER, allowDecimal: false });
    const maxNum = safeNumber(max, { min: MIN_NUMBER, max: MAX_NUMBER, allowDecimal: false });
    const countNum = safeNumber(count, { min: 1, max: MAX_COUNT, allowDecimal: false });

    if (minNum === null || maxNum === null || countNum === null) {
      notify.error("Please enter valid numbers!");
      return;
    }

    if (minNum >= maxNum) {
      notify.error("Min must be less than Max!");
      return;
    }

    const generated = [];
    for (let i = 0; i < countNum; i++) {
      generated.push(secureRandomInRange(minNum, maxNum));
    }
    setNumbers(generated);
    notify.success("Random numbers generated!");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate Random Numbers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Minimum</Label>
              <SafeNumberInput
                value={min}
                onChange={(sanitized) => setMin(sanitized)}
                sanitizeOptions={{ min: MIN_NUMBER, max: MAX_NUMBER, allowDecimal: false }}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum</Label>
              <SafeNumberInput
                value={max}
                onChange={(sanitized) => setMax(sanitized)}
                sanitizeOptions={{ min: MIN_NUMBER, max: MAX_NUMBER, allowDecimal: false }}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label>Count</Label>
              <SafeNumberInput
                value={count}
                onChange={(sanitized) => setCount(sanitized)}
                sanitizeOptions={{ min: 1, max: MAX_COUNT, allowDecimal: false }}
                inputMode="numeric"
              />
            </div>
          </div>
          <Button onClick={generate} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Generate
          </Button>
        </CardContent>
      </Card>

      {numbers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {numbers.map((num, i) => (
                <div 
                  key={i} 
                  className="flex min-h-12 sm:min-h-16 min-w-12 sm:min-w-16 px-3 sm:px-4 py-2 sm:py-3 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 font-bold text-primary break-all"
                  style={{
                    fontSize: num.toString().length > 6 ? '0.875rem' : num.toString().length > 4 ? '1rem' : '1.5rem'
                  }}
                >
                  {formatNumber(num)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

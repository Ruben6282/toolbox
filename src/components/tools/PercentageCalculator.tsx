import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const PercentageCalculator = () => {
  const [value, setValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const calculate = (v: string, p: string) => {
    const val = parseFloat(v);
    const perc = parseFloat(p);
    if (!isNaN(val) && !isNaN(perc)) {
      setResult((val * perc) / 100);
    } else {
      setResult(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Calculate Percentage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              type="number"
              placeholder="Enter value..."
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                calculate(e.target.value, percentage);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Percentage</Label>
            <Input
              type="number"
              placeholder="Enter percentage..."
              value={percentage}
              onChange={(e) => {
                setPercentage(e.target.value);
                calculate(value, e.target.value);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {result !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary break-words px-2">{result.toFixed(2)}</div>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground break-words px-2">
                {percentage}% of {value} = {result.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Common Calculations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {value && percentage && (
              <>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Add {percentage}%:</span>
                  <span className="font-medium">{(parseFloat(value) * (1 + parseFloat(percentage) / 100)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Subtract {percentage}%:</span>
                  <span className="font-medium">{(parseFloat(value) * (1 - parseFloat(percentage) / 100)).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

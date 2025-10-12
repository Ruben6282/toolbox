import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const PrimeNumberChecker = () => {
  const [number, setNumber] = useState("");
  const [result, setResult] = useState<{
    isPrime: boolean;
    factors: number[];
  } | null>(null);

  const isPrime = (num: number): boolean => {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    
    for (let i = 5; i * i <= num; i += 6) {
      if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
  };

  const getFactors = (num: number): number[] => {
    const factors: number[] = [];
    for (let i = 1; i <= Math.sqrt(num); i++) {
      if (num % i === 0) {
        factors.push(i);
        if (i !== num / i) {
          factors.push(num / i);
        }
      }
    }
    return factors.sort((a, b) => a - b);
  };

  const checkPrime = () => {
    const num = parseInt(number);
    
    if (isNaN(num) || num < 1) {
      toast.error("Please enter a valid positive number");
      return;
    }

    const prime = isPrime(num);
    const factors = getFactors(num);
    
    setResult({ isPrime: prime, factors });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Prime Number Checker</CardTitle>
        <CardDescription>Check if a number is prime and find its factors</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="number">Enter a number</Label>
          <Input
            id="number"
            type="number"
            placeholder="Enter a positive integer"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            min="1"
          />
        </div>

        <Button onClick={checkPrime} className="w-full">
          Check Prime
        </Button>

        {result && (
          <div className="space-y-4">
            <div className={`rounded-lg border-2 p-6 text-center ${
              result.isPrime 
                ? "border-green-500 bg-green-500/10" 
                : "border-primary bg-primary/10"
            }`}>
              <div className="text-4xl font-bold mb-2">
                {number}
              </div>
              <div className={`text-xl font-semibold ${
                result.isPrime ? "text-green-500" : "text-primary"
              }`}>
                {result.isPrime ? "is a Prime Number" : "is not a Prime Number"}
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-semibold mb-2">Factors of {number}:</h3>
              <div className="flex flex-wrap gap-2">
                {result.factors.map((factor) => (
                  <span
                    key={factor}
                    className="rounded bg-primary/20 px-3 py-1 text-sm font-medium"
                  >
                    {factor}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Total factors: {result.factors.length}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
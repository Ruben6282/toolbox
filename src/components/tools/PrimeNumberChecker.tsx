import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const PrimeNumberChecker = () => {
  const [number, setNumber] = useState("");
  const [checkedNumber, setCheckedNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    isPrime: boolean;
    factors?: bigint[];
  } | null>(null);

  const MAX_SAFE_FACTORIZE = 1_000_000_000_000n; // 1 trillion limit

  const isPrime = (n: bigint): boolean => {
    if (n <= 1n) return false;
    if (n <= 3n) return true;
    if (n % 2n === 0n || n % 3n === 0n) return false;
    for (let i = 5n; i * i <= n; i += 6n) {
      if (n % i === 0n || n % (i + 2n) === 0n) return false;
    }
    return true;
  };

  const millerRabinTest = (n: bigint, k = 5): boolean => {
    if (n < 2n) return false;
    if (n % 2n === 0n) return n === 2n;

    let d = n - 1n;
    let r = 0n;
    while (d % 2n === 0n) {
      d /= 2n;
      r++;
    }

    const modPow = (base: bigint, exp: bigint, mod: bigint): bigint => {
      let result = 1n;
      base %= mod;
      while (exp > 0n) {
        if (exp % 2n === 1n) result = (result * base) % mod;
        base = (base * base) % mod;
        exp /= 2n;
      }
      return result;
    };

    for (let i = 0; i < k; i++) {
      const a = 2n + BigInt(Math.floor(Math.random() * Number(n - 4n)));
      let x = modPow(a, d, n);
      if (x === 1n || x === n - 1n) continue;

      let cont = false;
      for (let j = 0n; j < r - 1n; j++) {
        x = (x * x) % n;
        if (x === n - 1n) {
          cont = true;
          break;
        }
      }
      if (cont) continue;
      return false;
    }
    return true;
  };

  const getFactors = (n: bigint): bigint[] => {
    const factors: bigint[] = [];
    for (let i = 1n; i * i <= n; i++) {
      if (n % i === 0n) {
        factors.push(i);
        if (i !== n / i) factors.push(n / i);
      }
    }
    return factors.sort((a, b) => (a < b ? -1 : 1));
  };

  const checkPrime = async () => {
    const value = number.trim();
    if (!value) {
      toast.error("Please enter a number");
      return;
    }

    let num: bigint;
    try {
      num = BigInt(value);
    } catch {
      toast.error("Invalid number");
      return;
    }

    if (num < 1n) {
      toast.error("Please enter a positive integer");
      return;
    }

    setLoading(true);
    setResult(null);
    setCheckedNumber(value);

    await new Promise((r) => setTimeout(r, 50));

    let isPrimeResult: boolean;
    let factors: bigint[] | undefined;

    if (num > MAX_SAFE_FACTORIZE) {
      toast.info("Number too large to fully factorize — using probabilistic check.");
      isPrimeResult = millerRabinTest(num);
    } else {
      isPrimeResult = isPrime(num);
      factors = getFactors(num);
    }

    setResult({ isPrime: isPrimeResult, factors });
    setLoading(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Prime Number Checker</CardTitle>
        <CardDescription>
          Check if a number is prime and view its factors (safe for large inputs)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="number">Enter a number</Label>
          <Input
            id="number"
            type="text"
            placeholder="Enter a positive integer"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>

        <Button onClick={checkPrime} className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Prime"
          )}
        </Button>

        {result && checkedNumber && (
          <div className="space-y-4">
            <div
              className={`rounded-lg border-2 p-6 text-center ${
                result.isPrime
                  ? "border-green-500 bg-green-500/10"
                  : "border-primary bg-primary/10"
              }`}
            >
              <div className="text-4xl font-bold mb-2">{checkedNumber}</div>
              <div
                className={`text-xl font-semibold ${
                  result.isPrime ? "text-green-500" : "text-primary"
                }`}
              >
                {result.isPrime
                  ? "is a Prime Number"
                  : "is not a Prime Number"}
              </div>
            </div>

            {result.factors && (
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-semibold mb-2">Factors of {checkedNumber}:</h3>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {result.factors.map((factor) => (
                    <span
                      key={factor.toString()}
                      className="rounded bg-primary/20 px-3 py-1 text-sm font-medium"
                    >
                      {factor.toString()}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Total factors: {result.factors.length}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

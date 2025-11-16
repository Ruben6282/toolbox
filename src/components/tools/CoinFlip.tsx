import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Circle } from "lucide-react";

/* ------------------------------------------------------------------
   CONSTANTS
------------------------------------------------------------------ */

const MAX_HISTORY = 10;

/* ------------------------------------------------------------------
   SECURE RANDOM BOOLEAN (no modulo bias)
------------------------------------------------------------------ */

const secureRandomBoolean = (): boolean => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    const max = 2;
    const limit = Math.floor(0xffffffff / max) * max;

    while (true) {
      crypto.getRandomValues(arr);
      if (arr[0] < limit) return arr[0] % 2 === 0;
    }
  }

  // Fallback
  return Math.random() < 0.5;
};

/* ------------------------------------------------------------------
   COMPONENT
------------------------------------------------------------------ */

export const CoinFlip = () => {
  const [result, setResult] = useState<"Heads" | "Tails" | "">("");
  const [isFlipping, setIsFlipping] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const timeoutRef = useRef<number | null>(null);

  /* Cleanup timeout on unmount */
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const flipCoin = () => {
    if (isFlipping) return;

    setIsFlipping(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    // Simulate flipping delay
    timeoutRef.current = window.setTimeout(() => {
      const outcome = secureRandomBoolean() ? "Heads" : "Tails";

      setResult(outcome);
      setHistory((prev) => [
        outcome,
        ...prev.slice(0, MAX_HISTORY - 1),
      ]);

      setIsFlipping(false);
      timeoutRef.current = null;
    }, 500);
  };

  const headsCount = history.filter((h) => h === "Heads").length;
  const tailsCount = history.filter((h) => h === "Tails").length;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Coin Flip</CardTitle>
        <CardDescription>
          Flip a digital coin using secure randomness
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Flip Button */}
        <Button
          onClick={flipCoin}
          className="w-full"
          size="lg"
          disabled={isFlipping}
        >
          <Circle className="mr-2 h-5 w-5" />
          {isFlipping ? "Flipping..." : "Flip Coin"}
        </Button>

        {/* Result Display */}
        {result && (
          <div
            className={`rounded-lg border-2 p-12 text-center transition-colors ${
              result === "Heads"
                ? "border-primary bg-primary/10"
                : "border-secondary bg-secondary/10"
            }`}
          >
            <div className="text-6xl mb-4">
              {result === "Heads" ? "🪙" : "🪙"}
            </div>
            <div className="text-4xl font-bold">{result}</div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">History (Last {MAX_HISTORY})</h3>

            <div className="flex flex-wrap gap-2">
              {history.map((flip, index) => (
                <div
                  key={`${flip}-${index}`}
                  className={`rounded px-3 py-1 text-sm font-medium ${
                    flip === "Heads"
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/20 text-secondary-foreground"
                  }`}
                >
                  {flip}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <div className="text-2xl font-bold text-primary">
                  {headsCount}
                </div>
                <div className="text-sm text-muted-foreground">Heads</div>
              </div>

              <div className="rounded-lg bg-secondary/10 p-3 text-center">
                <div className="text-2xl font-bold">{tailsCount}</div>
                <div className="text-sm text-muted-foreground">Tails</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Circle } from "lucide-react";

export const CoinFlip = () => {
  const [result, setResult] = useState("");
  const [isFlipping, setIsFlipping] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const MAX_HISTORY = 10;

  // Cleanup any pending timeout on unmount to avoid setState on unmounted component
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const flipCoin = () => {
    if (isFlipping) return; // guard against rapid re-entrance
    setIsFlipping(true);
    
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      // Use cryptographically stronger randomness when available
      let outcome: "Heads" | "Tails";
      if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        outcome = (arr[0] & 1) === 0 ? "Heads" : "Tails";
      } else {
        outcome = Math.random() < 0.5 ? "Heads" : "Tails";
      }
      setResult(outcome);
      setHistory(prev => [outcome, ...prev.slice(0, MAX_HISTORY - 1)]);
      setIsFlipping(false);
      timeoutRef.current = null;
    }, 500);
  };

  const headsCount = history.filter(h => h === "Heads").length;
  const tailsCount = history.filter(h => h === "Tails").length;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Coin Flip</CardTitle>
        <CardDescription>Simulate flipping a coin for making decisions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button 
          onClick={flipCoin} 
          className="w-full" 
          size="lg"
          disabled={isFlipping}
        >
          <Circle className="mr-2 h-5 w-5" />
          {isFlipping ? "Flipping..." : "Flip Coin"}
        </Button>

        {result && (
          <div className={`rounded-lg border-2 p-12 text-center transition-all ${
            result === "Heads" 
              ? "border-primary bg-primary/10" 
              : "border-accent bg-accent/10"
          }`}>
            <div className="text-6xl font-bold">
              {result === "Heads" ? "🪙" : "🪙"}
            </div>
            <div className="mt-4 text-3xl font-bold">{result}</div>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">History (Last 10 flips)</h3>
            <div className="flex flex-wrap gap-2">
              {history.map((flip, index) => (
                <div
                  key={index}
                  className={`rounded px-3 py-1 text-sm font-medium ${
                    flip === "Heads"
                      ? "bg-primary/20 text-primary"
                      : "bg-accent/20 text-accent-foreground"
                  }`}
                >
                  {flip}
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <div className="text-2xl font-bold text-primary">{headsCount}</div>
                <div className="text-sm text-muted-foreground">Heads</div>
              </div>
              <div className="rounded-lg bg-accent/10 p-3 text-center">
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
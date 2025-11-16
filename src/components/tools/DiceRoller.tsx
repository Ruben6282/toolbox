import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dices } from "lucide-react";

// ------------------------------------------------------
// SECURE UNBIASED RANDOM NUMBER GENERATOR
// ------------------------------------------------------

/**
 * Returns a uniformly distributed number between 1 and `sides`.
 * Uses rejection sampling to avoid modulo bias.
 */
const fairRandom = (sides: number): number => {
  // Secure RNG available
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    const range = 0xffffffff;
    const limit = Math.floor(range / sides) * sides; // unbiased boundary

    while (true) {
      crypto.getRandomValues(arr);
      if (arr[0] < limit) {
        return (arr[0] % sides) + 1;
      }
    }
  }

  // Fallback (not cryptographically secure but uniform)
  return Math.floor(Math.random() * sides) + 1;
};

// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------

export const DiceRoller = () => {
  const [diceType, setDiceType] = useState("6");
  const [numDice, setNumDice] = useState("1");
  const [results, setResults] = useState<number[]>([]);
  const [total, setTotal] = useState(0);

  const ALLOWED_DICE = ["4", "6", "8", "10", "12", "20", "100"];
  const ALLOWED_COUNTS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

  const sanitizeDiceType = (v: string) =>
    ALLOWED_DICE.includes(v) ? v : "6";

  const sanitizeNumDice = (v: string) =>
    ALLOWED_COUNTS.includes(v) ? v : "1";

  const rollDice = () => {
    const sides = parseInt(sanitizeDiceType(diceType), 10);
    const count = parseInt(sanitizeNumDice(numDice), 10);

    const newRolls: number[] = Array.from(
      { length: count },
      () => fairRandom(sides)
    );

    setResults(newRolls);
    setTotal(newRolls.reduce((acc, n) => acc + n, 0));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Dice Roller</CardTitle>
        <CardDescription>
          Roll one or multiple dice with true uniform randomness.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="diceType">Dice Type</Label>
            <Select
              value={diceType}
              onValueChange={(v) => setDiceType(sanitizeDiceType(v))}
            >
              <SelectTrigger id="diceType">
                <SelectValue placeholder="Select dice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">D4 (4-sided)</SelectItem>
                <SelectItem value="6">D6 (6-sided)</SelectItem>
                <SelectItem value="8">D8 (8-sided)</SelectItem>
                <SelectItem value="10">D10 (10-sided)</SelectItem>
                <SelectItem value="12">D12 (12-sided)</SelectItem>
                <SelectItem value="20">D20 (20-sided)</SelectItem>
                <SelectItem value="100">D100 (100-sided)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="numDice">Number of Dice</Label>
            <Select
              value={numDice}
              onValueChange={(v) => setNumDice(sanitizeNumDice(v))}
            >
              <SelectTrigger id="numDice">
                <SelectValue placeholder="Select quantity" />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_COUNTS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n} {n === "1" ? "die" : "dice"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Roll Button */}
        <Button onClick={rollDice} className="w-full" size="lg">
          <Dices className="mr-2 h-5 w-5" />
          Roll Dice
        </Button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            {/* Individual Dice Results */}
            <div className="flex flex-wrap gap-2">
              {results.map((num, i) => (
                <div
                  key={i}
                  className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-primary bg-primary/10 text-2xl font-bold text-primary"
                >
                  {num}
                </div>
              ))}
            </div>

            {/* Total */}
            {results.length > 1 && (
              <div className="rounded-lg bg-primary/10 p-4 text-center">
                <div className="text-sm font-medium text-muted-foreground">
                  Total
                </div>
                <div className="text-3xl font-bold text-primary">{total}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

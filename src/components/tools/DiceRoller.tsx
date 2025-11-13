import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dices } from "lucide-react";

export const DiceRoller = () => {
  const [diceType, setDiceType] = useState("6");
  const [numDice, setNumDice] = useState("1");
  const [results, setResults] = useState<number[]>([]);
  const [total, setTotal] = useState(0);

  const ALLOWED_DICE = ["4", "6", "8", "10", "12", "20", "100"];
  const ALLOWED_COUNTS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  
  const coerceDiceType = (v: string) => (ALLOWED_DICE.includes(v) ? v : "6");
  const coerceNumDice = (v: string) => (ALLOWED_COUNTS.includes(v) ? v : "1");

  const rollDice = () => {
    const sides = parseInt(coerceDiceType(diceType));
    const count = parseInt(coerceNumDice(numDice));
    const rolls: number[] = [];
    
    for (let i = 0; i < count; i++) {
      // Use crypto.getRandomValues for stronger randomness when available
      let roll: number;
      if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        roll = (arr[0] % sides) + 1;
      } else {
        roll = Math.floor(Math.random() * sides) + 1;
      }
      rolls.push(roll);
    }
    
    setResults(rolls);
    setTotal(rolls.reduce((sum, roll) => sum + roll, 0));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Dice Roller</CardTitle>
        <CardDescription>Simulate rolling dice with different numbers of sides</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="diceType">Dice Type</Label>
            <Select value={diceType} onValueChange={(v) => setDiceType(coerceDiceType(v))}>
              <SelectTrigger id="diceType">
                <SelectValue />
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
            <Select value={numDice} onValueChange={(v) => setNumDice(coerceNumDice(v))}>
              <SelectTrigger id="numDice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "die" : "dice"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={rollDice} className="w-full" size="lg">
          <Dices className="mr-2 h-5 w-5" />
          Roll Dice
        </Button>

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-primary bg-primary/10 text-2xl font-bold text-primary"
                >
                  {result}
                </div>
              ))}
            </div>
            
            {results.length > 1 && (
              <div className="rounded-lg bg-primary/10 p-4 text-center">
                <div className="text-sm font-medium text-muted-foreground">Total</div>
                <div className="text-3xl font-bold text-primary">{total}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
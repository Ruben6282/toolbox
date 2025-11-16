import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shuffle } from "lucide-react";
import { notify } from "@/lib/notify";

const MAX_NAMES_LENGTH = 10000; // limit to ~10KB input
const SPIN_MIN = 12; // minimum animation steps
const SPIN_MAX = 28; // maximum animation steps
const SPIN_SPEED = 80; // ms per spin

// Remove control characters except newline, tab, carriage return
const sanitizeInput = (val: string): string =>
  Array.from(val)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      // keep tab (9), LF (10), CR (13) and printable chars (>= 32), but drop DEL (127)
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
    })
    .join("")
    .slice(0, MAX_NAMES_LENGTH);

// Strong random integer (uniform)
const secureRandom = (max: number): number => {
  if (crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / max) * max;
    while (true) {
      crypto.getRandomValues(arr);
      if (arr[0] < limit) return arr[0] % max;
    }
  }
  return Math.floor(Math.random() * max);
};

export const RandomNamePicker = () => {
  const [names, setNames] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);

  const intervalRef = useRef<number | null>(null);

  // Cleanup (prevents memory leaks)
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const pickRandomName = useCallback(() => {
    const nameList = names
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (nameList.length === 0) {
      notify.error("Please enter at least one name");
      return;
    }

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }

    const totalSpins = SPIN_MIN + secureRandom(SPIN_MAX - SPIN_MIN + 1);
    let counter = 0;

    setIsSpinning(true);

    intervalRef.current = window.setInterval(() => {
      const randomIndex = secureRandom(nameList.length);
      setSelectedName(nameList[randomIndex]);
      counter++;

      if (counter >= totalSpins) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        setIsSpinning(false);

        // Slight delay for visual polish
        setTimeout(() => notify.success("Name selected!"), 80);
      }
    }, SPIN_SPEED);
  }, [names]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Random Name Picker</CardTitle>
        <CardDescription>
          Enter names (one per line) and pick a random one
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input */}
        <div>
          <Label htmlFor="names">Enter names</Label>
          <Textarea
            id="names"
            placeholder={`John Doe\nJane Smith\nAlice Johnson\nBob Williams`}
            value={names}
            onChange={(e) => setNames(sanitizeInput(e.target.value))}
            maxLength={MAX_NAMES_LENGTH}
            className="min-h-[200px]"
          />
        </div>

        {/* Pick button */}
        <Button
          onClick={pickRandomName}
          className="w-full"
          size="lg"
          disabled={isSpinning}
        >
          <Shuffle className="mr-2 h-5 w-5" />
          {isSpinning ? "Picking..." : "Pick Random Name"}
        </Button>

        {/* Selected result */}
        {selectedName && (
          <div className="rounded-lg border-2 border-primary bg-primary/10 p-8 text-center animate-fade-in">
            <div className="text-sm font-medium text-muted-foreground">
              Selected Name
            </div>
            <div className="mt-2 text-3xl font-bold text-primary">
              {selectedName}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

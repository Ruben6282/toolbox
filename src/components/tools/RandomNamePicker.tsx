import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shuffle } from "lucide-react";
import { notify } from "@/lib/notify";

const MAX_NAMES_LENGTH = 10000; // 10KB max for names list

// Strip control characters except tab/newline/CR
const sanitizeInput = (val: string) =>
  val
    .split("")
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10 || code === 13;
    })
    .join("")
    .substring(0, MAX_NAMES_LENGTH);

// Secure random integer
const secureRandom = (max: number): number => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
};

export const RandomNamePicker = () => {
  const [names, setNames] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const interval = intervalRef.current;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const pickRandomName = () => {
    const nameList = names
      .split("\n")
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (nameList.length === 0) {
      notify.error("Please enter at least one name");
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsSpinning(true);
    
    // Animate the selection
    let counter = 0;
    intervalRef.current = setInterval(() => {
      const randomIndex = secureRandom(nameList.length);
      setSelectedName(nameList[randomIndex]);
      counter++;
      
      if (counter > 20) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsSpinning(false);
        notify.success("Name selected!");
      }
    }, 100);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Random Name Picker</CardTitle>
        <CardDescription>Randomly select names from a list (one name per line)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="names">Enter names (one per line)</Label>
          <Textarea
            id="names"
            placeholder="John Doe&#10;Jane Smith&#10;Bob Johnson&#10;Alice Williams"
            value={names}
            onChange={(e) => setNames(sanitizeInput(e.target.value))}
            maxLength={MAX_NAMES_LENGTH}
            className="min-h-[200px]"
          />
        </div>

        <Button onClick={pickRandomName} className="w-full" size="lg" disabled={isSpinning}>
          <Shuffle className="mr-2 h-5 w-5" />
          {isSpinning ? "Picking..." : "Pick Random Name"}
        </Button>

        {selectedName && (
          <div className="rounded-lg border-2 border-primary bg-primary/10 p-8 text-center">
            <div className="text-sm font-medium text-muted-foreground">Selected Name</div>
            <div className="mt-2 text-3xl font-bold text-primary">{selectedName}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
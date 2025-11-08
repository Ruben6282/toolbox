import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shuffle } from "lucide-react";
import { notify } from "@/lib/notify";

export const RandomNamePicker = () => {
  const [names, setNames] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);

  const pickRandomName = () => {
    const nameList = names
      .split("\n")
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (nameList.length === 0) {
  notify.error("Please enter at least one name");
      return;
    }

    setIsSpinning(true);
    
    // Animate the selection
    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * nameList.length);
      setSelectedName(nameList[randomIndex]);
      counter++;
      
      if (counter > 20) {
        clearInterval(interval);
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
            onChange={(e) => setNames(e.target.value)}
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
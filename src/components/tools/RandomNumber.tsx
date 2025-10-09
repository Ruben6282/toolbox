import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export const RandomNumber = () => {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState("1");
  const [numbers, setNumbers] = useState<number[]>([]);

  const generate = () => {
    const minNum = parseInt(min);
    const maxNum = parseInt(max);
    const countNum = parseInt(count);

    if (isNaN(minNum) || isNaN(maxNum) || isNaN(countNum)) {
      toast.error("Please enter valid numbers!");
      return;
    }

    if (minNum >= maxNum) {
      toast.error("Min must be less than Max!");
      return;
    }

    const generated = [];
    for (let i = 0; i < countNum; i++) {
      generated.push(Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum);
    }
    setNumbers(generated);
    toast.success("Random numbers generated!");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate Random Numbers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Minimum</Label>
              <Input
                type="number"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum</Label>
              <Input
                type="number"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Count</Label>
              <Input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={generate} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Generate
          </Button>
        </CardContent>
      </Card>

      {numbers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {numbers.map((num, i) => (
                <div key={i} className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 text-2xl font-bold text-primary">
                  {num}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const AgeCalculator = () => {
  const [birthDate, setBirthDate] = useState("");
  const [result, setResult] = useState<{
    years: number;
    months: number;
    days: number;
    totalDays: number;
  } | null>(null);

  const calculate = () => {
    const birth = new Date(birthDate);
    const today = new Date();

    if (birth > today) return;

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const totalDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

    setResult({ years, months, days, totalDays });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Enter Birth Date</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Birth Date</Label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <Button onClick={calculate} className="w-full">Calculate Age</Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Your Age</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-primary mb-2">
                {result.years}
              </div>
              <div className="text-lg text-muted-foreground">years old</div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{result.years}</div>
                <div className="text-sm text-muted-foreground">Years</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{result.months}</div>
                <div className="text-sm text-muted-foreground">Months</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{result.days}</div>
                <div className="text-sm text-muted-foreground">Days</div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Total: {result.totalDays.toLocaleString()} days
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

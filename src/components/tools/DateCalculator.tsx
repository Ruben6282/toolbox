import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const DateCalculator = () => {
  const [date1, setDate1] = useState(new Date().toISOString().slice(0, 10));
  const [date2, setDate2] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  const calculateDifference = () => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = Math.abs(d2.getTime() - d1.getTime());

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    return { days, hours, minutes, weeks, months, years };
  };

  const diff = calculateDifference();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Date Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>First Date</Label>
            <Input
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Second Date</Label>
            <Input
              type="date"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary break-words px-2">{diff.days}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Days</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary break-words px-2">{diff.weeks}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Weeks</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary break-words px-2">{diff.months}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Months</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary break-words px-2">{diff.years}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Years</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary break-words px-2">{diff.hours}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Hours (remaining)</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary break-words px-2">{diff.minutes}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Minutes (remaining)</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

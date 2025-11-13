import { useState } from "react";
import { differenceInYears, differenceInMonths, differenceInDays, differenceInHours, differenceInMinutes, addYears, addMonths, addDays, addHours, addMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";

export const AgeCalculator = () => {
  const [birthDate, setBirthDate] = useState("");
  const [result, setResult] = useState<{
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    totalDays: number;
  } | null>(null);

  // Security/validation constraints
  const MAX_YEARS = 130; // Reasonable human age limit to avoid absurd inputs
  const MIN_LOCAL_DATETIME = "1900-01-01T00:00"; // prevent extremely old dates that may cause library edge cases
  const dtLocalPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/; // strict datetime-local format

  // Format a Date for a datetime-local input (YYYY-MM-DDTHH:mm) in local time
  const formatDateTimeLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };

  const calculate = () => {
    if (!birthDate) {
      notify.error("Please enter your birth date and time.");
      return;
    }
    // Basic format validation to reduce parsing ambiguity
    if (!dtLocalPattern.test(birthDate)) {
      notify.error("Invalid date format. Please use the date/time picker.");
      return;
    }
    const birth = new Date(birthDate);
    const now = new Date();

    if (isNaN(birth.getTime())) {
      notify.error("Invalid date. Please pick a valid value.");
      return;
    }
    if (birth > now) {
      notify.error("Birth date cannot be in the future.");
      return;
    }
    if (birth < new Date(MIN_LOCAL_DATETIME)) {
      notify.error("Please enter a date after Jan 1, 1900.");
      return;
    }

    // Use date-fns to compute precise calendar years, months, days considering time of day
    let years = differenceInYears(now, birth);
    let cursor = addYears(birth, years);
    if (cursor > now) {
      years -= 1;
      cursor = addYears(birth, years);
    }

    let months = differenceInMonths(now, cursor);
    cursor = addMonths(cursor, months);
    if (cursor > now) {
      months -= 1;
      cursor = addMonths(cursor, months);
    }

    const days = differenceInDays(now, cursor);
    cursor = addDays(cursor, days);

  const hours = differenceInHours(now, cursor);
    cursor = addHours(cursor, hours);

  let minutes = differenceInMinutes(now, cursor);
    cursor = addMinutes(cursor, minutes);

    // Guard against any edge overshoot (DST shifts). If cursor > now, step back a minute.
    if (cursor > now) {
      minutes -= 1;
    }

    const totalDays = differenceInDays(now, birth);

    if (years > MAX_YEARS) {
      notify.error(`Result exceeds ${MAX_YEARS} years. Please verify your input.`);
      return;
    }

    setResult({ years, months, days, hours, minutes, totalDays });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Enter Birth Date</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Birth Date & Time</Label>
            <Input
              type="datetime-local"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={formatDateTimeLocal(new Date())}
              min={MIN_LOCAL_DATETIME}
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

            <div className="grid gap-4 mb-4 sm:grid-cols-3 lg:grid-cols-5">
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
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{result.hours}</div>
                <div className="text-sm text-muted-foreground">Hours</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{result.minutes}</div>
                <div className="text-sm text-muted-foreground">Minutes</div>
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

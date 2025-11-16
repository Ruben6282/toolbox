import { useState } from "react";
import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addYears,
  addMonths,
  addDays,
  addHours,
  addMinutes,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";

/**
 * PRODUCTION NOTES:
 * - Uses datetime-local (YYYY-MM-DDTHH:mm) to avoid ambiguous natural language parsing.
 * - Guards against DST edge cases by stepping through components (years → months → days → hours → minutes).
 * - Validates format using regex to ensure browser consistency.
 * - Uses rounding-safe difference functions from date-fns.
 */

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

  // Hard safety boundaries
  const MAX_YEARS = 130;
  const MIN_DATETIME = "1900-01-01T00:00";
  const dtLocalPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

  /** Formats a JS Date into "YYYY-MM-DDTHH:mm" */
  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const calculate = () => {
    if (!birthDate) {
      notify.error("Please enter your birth date and time.");
      return;
    }

    // Strict validation avoids browser inconsistencies
    if (!dtLocalPattern.test(birthDate)) {
      notify.error("Invalid date format. Please use the date/time picker.");
      return;
    }

    const birth = new Date(birthDate);
    const now = new Date();

    if (isNaN(birth.getTime())) {
      notify.error("Invalid date. Please select a valid value.");
      return;
    }
    if (birth > now) {
      notify.error("Birth date cannot be in the future.");
      return;
    }
    if (birth < new Date(MIN_DATETIME)) {
      notify.error("Please enter a date after Jan 1, 1900.");
      return;
    }

    // Step 1 — Years
    let years = differenceInYears(now, birth);
    let cursor = addYears(birth, years);
    if (cursor > now) {
      years--;
      cursor = addYears(birth, years);
    }

    // Step 2 — Months
    let months = differenceInMonths(now, cursor);
    cursor = addMonths(cursor, months);
    if (cursor > now) {
      months--;
      cursor = addMonths(cursor, months);
    }

    // Step 3 — Days
    const days = differenceInDays(now, cursor);
    cursor = addDays(cursor, days);

    // Step 4 — Hours
    const hours = differenceInHours(now, cursor);
    cursor = addHours(cursor, hours);

    // Step 5 — Minutes
    let minutes = differenceInMinutes(now, cursor);
    cursor = addMinutes(cursor, minutes);

    // DST overshoot protection
    if (cursor > now) {
      minutes--;
    }

    const totalDays = differenceInDays(now, birth);

    if (years > MAX_YEARS) {
      notify.error(`Age exceeds ${MAX_YEARS} years. Please verify your input.`);
      return;
    }

    setResult({ years, months, days, hours, minutes, totalDays });
  };

  return (
    <div className="space-y-4">
      {/* Input Card */}
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
              min={MIN_DATETIME}
            />
          </div>

          <Button onClick={calculate} className="w-full">
            Calculate Age
          </Button>
        </CardContent>
      </Card>

      {/* Result Card */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Your Age</CardTitle>
          </CardHeader>

          <CardContent>
            {/* Main Age Number */}
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-primary mb-2">
                {result.years}
              </div>
              <div className="text-lg text-muted-foreground">
                years old
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-4">
              {[
                ["Years", result.years],
                ["Months", result.months],
                ["Days", result.days],
                ["Hours", result.hours],
                ["Minutes", result.minutes],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="text-center p-4 rounded-lg bg-muted"
                >
                  <div className="text-2xl font-bold">{value as number}</div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                </div>
              ))}
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

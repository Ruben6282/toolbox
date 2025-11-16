import { useState } from "react";
import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  addYears,
  addMonths,
  addDays,
  addHours,
  addMinutes,
  addSeconds,
} from "date-fns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";

/**
 * FULL PRODUCTION VERSION
 * - Supports full datetime-local range (0001 → 9999)
 * - Button-triggered calculation only (no auto-updates)
 * - DST-safe: step-through (Years → Months → Days → Hours → Minutes → Seconds)
 * - Uses strict validation to avoid browser inconsistencies
 * - Fully symmetric (absolute difference)
 */

// Strict validation for datetime-local
const RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// HTML datetime-local min/max constraints
const MIN = "0001-01-01T00:00";
const MAX = "9999-12-31T23:59";

// Sync date-local string → Date
const parseDate = (v: string): Date | null => {
  if (!RE.test(v)) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

// Format JS Date → datetime-local (YYYY-MM-DDTHH:mm)
const fmt = (date: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(
    date.getDate()
  )}T${p(date.getHours())}:${p(date.getMinutes())}`;
};

export const DateCalculator = () => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);

  // Inputs
  const [date1, setDate1] = useState(fmt(now));
  const [date2, setDate2] = useState(fmt(tomorrow));

  // Output data (only updated on button click)
  const [result, setResult] = useState<null | {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalHours: number;
    totalMinutes: number;
    totalSeconds: number;
  }>(null);

  const calculate = () => {
    const start = parseDate(date1);
    const end = parseDate(date2);

    if (!start || !end) {
      notify.error("Please enter valid date/time values.");
      setResult(null);
      return;
    }

    // Normalize order for absolute difference
    const A = start < end ? start : end;
    const B = start < end ? end : start;

    if (start > end) {
      notify.info("Note: second date is earlier. Showing absolute difference.");
    }

    let cursor = A;

    // STEP 1 — YEARS
    let years = differenceInYears(B, cursor);
    cursor = addYears(cursor, years);

    if (cursor > B) {
      years--;
      cursor = addYears(A, years);
    }

    // STEP 2 — MONTHS
    let months = differenceInMonths(B, cursor);
    cursor = addMonths(cursor, months);

    // Correct overshoot using proper baseline
    if (cursor > B) {
      months--;
      cursor = addMonths(addYears(A, years), months);
    }

    // STEP 3 — DAYS
    const days = differenceInDays(B, cursor);
    cursor = addDays(cursor, days);

    // STEP 4 — HOURS
    const hours = differenceInHours(B, cursor);
    cursor = addHours(cursor, hours);

    // STEP 5 — MINUTES
    const minutes = differenceInMinutes(B, cursor);
    cursor = addMinutes(cursor, minutes);

    // STEP 6 — SECONDS
    let seconds = differenceInSeconds(B, cursor);
    cursor = addSeconds(cursor, seconds);

    // DST safety correction
    if (cursor > B) {
      seconds--;
    }

    // TOTALS (exact elapsed units)
    const totalSeconds = Math.floor((B.getTime() - A.getTime()) / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalSeconds / 3600);

    setResult({
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      totalHours,
      totalMinutes,
      totalSeconds,
    });

    notify.success("Date difference calculated!");
  };

  return (
    <div className="space-y-4">
      {/* INPUT CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Date Difference Calculator</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* First date */}
          <div className="space-y-2">
            <Label>First Date & Time</Label>
            <Input
              type="datetime-local"
              value={date1}
              min={MIN}
              max={MAX}
              onChange={(e) => setDate1(e.target.value)}
            />
          </div>

          {/* Second date */}
          <div className="space-y-2">
            <Label>Second Date & Time</Label>
            <Input
              type="datetime-local"
              value={date2}
              min={MIN}
              max={MAX}
              onChange={(e) => setDate2(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={calculate}>
            Calculate Difference
          </Button>
        </CardContent>
      </Card>

      {/* RESULTS */}
      {result && (
        <>
          {/* CALENDAR DIFFERENCE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calendar Difference</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Years", result.years],
                  ["Months", result.months],
                  ["Days", result.days],
                  ["Hours", result.hours],
                  ["Minutes", result.minutes],
                  ["Seconds", result.seconds],
                ].map(([label, value]) => (
                  <div key={label} className="text-center p-3 border rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-primary">
                      {value as number}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* TOTALS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Elapsed Time</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["Total Hours", result.totalHours.toLocaleString()],
                  ["Total Minutes", result.totalMinutes.toLocaleString()],
                  ["Total Seconds", result.totalSeconds.toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} className="text-center p-3 border rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-primary break-all">
                      {value as string}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

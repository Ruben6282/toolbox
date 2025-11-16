import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { safeNumber } from "@/lib/safe-number";

/**
 * VERSION B — PRODUCITON READY
 * - Strict datetime-local validation
 * - Robust seconds-vs-milliseconds detection
 * - Full min/max date safety
 * - Sanitized timestamps
 * - Human-proof error messages
 */

// Full JavaScript date range
const MIN_TIMESTAMP = -62135596800000; // 0001-01-01T00:00:00.000Z
const MAX_TIMESTAMP = 253402300799999; // 9999-12-31T23:59:59.999Z

// Strict regex for datetime-local
const LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// Format Date → datetime-local (LOCAL time, not UTC)
const formatLocalDateTime = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
};

// Parse datetime-local safely
const parseLocal = (val: string): Date | null => {
  if (!LOCAL_RE.test(val)) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

export const TimestampConverter = () => {
  const now = new Date();

  const [timestamp, setTimestamp] = useState(now.getTime().toString());
  const [dateTime, setDateTime] = useState(formatLocalDateTime(now));

  const timestampToDate = () => {
    // First: do minimal numeric validation ONLY (no min/max yet)
    const raw = safeNumber(timestamp, {
      allowDecimal: false,
      // allow anything reasonably sized — full validation happens later
      min: -1e16,
      max: 1e16,
    });

    if (raw === null) {
      notify.error("Invalid timestamp! Only whole numbers are allowed.");
      return;
    }

    // Detect seconds vs milliseconds
    // < 1e12 → seconds (10-digit unix timestamp)
    let tsMs =
      Math.abs(raw) < 1e12
        ? raw * 1000 // seconds → ms
        : raw; // already ms

    // Clamp to safe JS range
    tsMs = Math.max(MIN_TIMESTAMP, Math.min(MAX_TIMESTAMP, tsMs));

    const d = new Date(tsMs);
    if (isNaN(d.getTime())) {
      notify.error("This timestamp is outside the valid date range.");
      return;
    }

    setDateTime(formatLocalDateTime(d));
    notify.success("Converted to date!");
  };

  const dateToTimestamp = () => {
    // Validate datetime-local format
    if (!LOCAL_RE.test(dateTime)) {
      notify.error("Invalid date format. Use the date/time picker.");
      return;
    }

    const d = parseLocal(dateTime);
    if (!d) {
      notify.error("Invalid date/time value.");
      return;
    }

    let ts = d.getTime();

    if (!Number.isFinite(ts)) {
      notify.error("Date is outside the valid timestamp range.");
      return;
    }

    // Clamp timestamp
    ts = Math.max(MIN_TIMESTAMP, Math.min(MAX_TIMESTAMP, ts));

    setTimestamp(ts.toString());
    notify.success("Converted to timestamp!");
  };

  const useCurrentTime = () => {
    const now = new Date();
    setTimestamp(now.getTime().toString());
    setDateTime(formatLocalDateTime(now));
    notify.success("Current time loaded!");
  };

  return (
    <div className="space-y-4">
      <Button onClick={useCurrentTime} className="w-full" variant="outline">
        Use Current Time
      </Button>

      {/* Timestamp Input */}
      <Card>
        <CardHeader>
          <CardTitle>Unix Timestamp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Timestamp (ms or seconds)</Label>
            <SafeNumberInput
              value={timestamp}
              onChange={(v) => setTimestamp(v)}
              sanitizeOptions={{
                allowDecimal: false,
                min: -1e16,
                max: 1e16,
              }}
              inputMode="numeric"
              placeholder="1712345678"
            />
          </div>
          <Button onClick={timestampToDate} className="w-full">
            Convert to Date
          </Button>
        </CardContent>
      </Card>

      {/* Date Input */}
      <Card>
        <CardHeader>
          <CardTitle>Date & Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              min="0001-01-01T00:00"
              max="9999-12-31T23:59"
            />
          </div>

          <Button onClick={dateToTimestamp} className="w-full">
            Convert to Timestamp
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";

const MIN_TIMESTAMP = -62135596800000; // 0001-01-01 in ms
const MAX_TIMESTAMP = 253402300799999; // 9999-12-31 in ms

// Sanitize numeric input (digits only)
const sanitizeDigits = (val: string): string => {
  return val.replace(/[^\d]/g, "").slice(0, 20);
};

export const TimestampConverter = () => {
  // Helper to format a Date for an <input type="datetime-local"> using LOCAL time (no timezone)
  const formatLocalDateTimeForInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [timestamp, setTimestamp] = useState(Date.now().toString());
  const [dateTime, setDateTime] = useState(formatLocalDateTimeForInput(new Date()));

  const timestampToDate = () => {
    try {
      const sanitized = sanitizeDigits(timestamp);
      const raw = Number(sanitized);
      if (!Number.isFinite(raw)) throw new Error("Invalid timestamp");
      // Auto-detect seconds vs milliseconds: assume seconds if value looks like a 10-digit unix epoch
      const tsMs = raw < 1e12 ? raw * 1000 : raw;
      // Clamp to valid range
      const clamped = Math.max(MIN_TIMESTAMP, Math.min(MAX_TIMESTAMP, tsMs));
      const date = new Date(clamped);
      if (isNaN(date.getTime())) throw new Error("Invalid timestamp");
      setDateTime(formatLocalDateTimeForInput(date));
  notify.success("Converted to date!");
    } catch (e) {
  notify.error("Invalid timestamp!");
    }
  };

  const dateToTimestamp = () => {
    try {
      const d = new Date(dateTime);
      const ts = d.getTime();
      if (!Number.isFinite(ts)) throw new Error("Invalid date");
      setTimestamp(ts.toString());
  notify.success("Converted to timestamp!");
    } catch (e) {
  notify.error("Invalid date!");
    }
  };

  const useCurrentTime = () => {
    const now = new Date();
    setTimestamp(now.getTime().toString());
    setDateTime(formatLocalDateTimeForInput(now));
  notify.success("Current time loaded!");
  };

  return (
    <div className="space-y-4">
      <Button onClick={useCurrentTime} className="w-full" variant="outline">
        Use Current Time
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Unix Timestamp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Timestamp (milliseconds or seconds)</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={timestamp}
              onChange={(e) => setTimestamp(sanitizeDigits(e.target.value))}
              placeholder="1234567890000"
            />
          </div>
          <Button onClick={timestampToDate} className="w-full">
            Convert to Date
          </Button>
        </CardContent>
      </Card>

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
            />
          </div>
          <Button onClick={dateToTimestamp} className="w-full">
            Convert to Timestamp
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Timestamp:</span>
              <code className="font-mono">{Date.now()}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Timestamp (seconds):</span>
              <code className="font-mono">{Math.floor(Date.now() / 1000)}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Date:</span>
              <code className="font-mono">{new Date().toLocaleString()}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

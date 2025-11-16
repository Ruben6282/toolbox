import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Plus, Trash2 } from "lucide-react";
import { toZonedTime, format } from "date-fns-tz";
import { notify } from "@/lib/notify";

/* ------------------------------------------------------------------
   TYPES & CONSTANTS
------------------------------------------------------------------ */

const TIMEZONE_OPTIONS = [
  { label: "New York (EST/EDT)", value: "America/New_York" },
  { label: "Los Angeles (PST/PDT)", value: "America/Los_Angeles" },
  { label: "Chicago (CST/CDT)", value: "America/Chicago" },
  { label: "Denver (MST/MDT)", value: "America/Denver" },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "Paris (CET/CEST)", value: "Europe/Paris" },
  { label: "Berlin (CET/CEST)", value: "Europe/Berlin" },
  { label: "Rome (CET/CEST)", value: "Europe/Rome" },
  { label: "Madrid (CET/CEST)", value: "Europe/Madrid" },
  { label: "Moscow (MSK)", value: "Europe/Moscow" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Seoul (KST)", value: "Asia/Seoul" },
  { label: "Beijing (CST)", value: "Asia/Shanghai" },
  { label: "Hong Kong (HKT)", value: "Asia/Hong_Kong" },
  { label: "Singapore (SGT)", value: "Asia/Singapore" },
  { label: "Mumbai (IST)", value: "Asia/Kolkata" },
  { label: "Dubai (GST)", value: "Asia/Dubai" },
  { label: "Sydney (AEST/AEDT)", value: "Australia/Sydney" },
  { label: "Melbourne (AEST/AEDT)", value: "Australia/Melbourne" },
  { label: "Auckland (NZST/NZDT)", value: "Pacific/Auckland" },
  { label: "Honolulu (HST)", value: "Pacific/Honolulu" },
  { label: "UTC", value: "UTC" },
] as const;

type TimeZoneId = (typeof TIMEZONE_OPTIONS)[number]["value"];

const VALID_TIMEZONES = new Set<TimeZoneId>(
  TIMEZONE_OPTIONS.map((tz) => tz.value)
);

interface ClockEntry {
  id: string;
  timezone: TimeZoneId;
  label: string;
}

interface WorldClockProps {
  hour12?: boolean;
  maxClocks?: number;
}

/* ------------------------------------------------------------------
   HELPERS
------------------------------------------------------------------ */

// SSR-safe ID generator
const generateId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof (crypto as Crypto).randomUUID === "function"
  ) {
    return (crypto as Crypto).randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

// Get a human-friendly UTC offset like "UTC+02:00"
const getUtcOffsetLabel = (date: Date, timezone: TimeZoneId): string => {
  try {
    // Modern, DST-safe approach
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(date);
    const tzName =
      parts.find((p) => p.type === "timeZoneName")?.value ?? "UTC";

    // Usually like "GMT+2" or "GMT+2:30"
    return tzName.replace("GMT", "UTC");
  } catch {
    // Fallback: best-effort manual offset using date-fns-tz
    try {
      const zoned = toZonedTime(date, timezone);
      const diffMs = zoned.getTime() - date.getTime();
      const offsetMinutes = Math.round(diffMs / 60000);
      const sign = offsetMinutes >= 0 ? "+" : "-";
      const abs = Math.abs(offsetMinutes);
      const hours = Math.floor(abs / 60);
      const minutes = abs % 60;
      return `UTC${sign}${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}`;
    } catch {
      return "UTC";
    }
  }
};

/* ------------------------------------------------------------------
   COMPONENT
------------------------------------------------------------------ */

export const WorldClock: React.FC<WorldClockProps> = ({
  hour12 = true,
  maxClocks = 12,
}) => {
  const [clocks, setClocks] = useState<ClockEntry[]>([
    { id: generateId(), timezone: "America/New_York", label: "New York" },
    { id: generateId(), timezone: "Europe/London", label: "London" },
    { id: generateId(), timezone: "Asia/Tokyo", label: "Tokyo" },
  ]);

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update every second
  useEffect(() => {
    const id = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  const addClock = () => {
    if (clocks.length >= maxClocks) {
      notify.error(`Maximum of ${maxClocks} clocks reached.`);
      return;
    }

    setClocks((prev) => [
      ...prev,
      {
        id: generateId(),
        timezone: "UTC",
        label: "New Clock",
      },
    ]);

    notify.success("Clock added.");
  };

  const removeClock = (id: string) => {
    setClocks((prev) => {
      if (prev.length <= 1) {
        notify.error("You must keep at least one clock.");
        return prev;
      }
      notify.success("Clock removed.");
      return prev.filter((c) => c.id !== id);
    });
  };

  const updateClock = (
    id: string,
    field: keyof ClockEntry,
    value: string
  ) => {
    setClocks((prev) =>
      prev.map((clock) => {
        if (clock.id !== id) return clock;

        if (field === "timezone") {
          if (!VALID_TIMEZONES.has(value as TimeZoneId)) {
            notify.error("Invalid timezone selected.");
            return clock;
          }
          return { ...clock, timezone: value as TimeZoneId };
        }

        // field === "label"
        return { ...clock, [field]: value };
      })
    );
  };

  const formattedClocks = useMemo(() => {
    return clocks.map((clock) => {
      try {
        const zoned = toZonedTime(currentTime, clock.timezone);

        const timeFormat = hour12 ? "hh:mm:ss a" : "HH:mm:ss";

        const time = format(zoned, timeFormat, {
          timeZone: clock.timezone,
        });

        const date = format(zoned, "EEE, MMM d, yyyy", {
          timeZone: clock.timezone,
        });

        const offset = getUtcOffsetLabel(currentTime, clock.timezone);

        return {
          ...clock,
          time,
          date,
          offset,
        };
      } catch {
        return {
          ...clock,
          time: "Unavailable",
          date: "Unavailable",
          offset: "UTC",
        };
      }
    });
  }, [clocks, currentTime, hour12]);

  return (
    <div className="space-y-6">
      {/* Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>World Clock</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            All times are calculated from your device&apos;s current time.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Manage Clocks</Label>
            <Button
              onClick={addClock}
              size="sm"
              aria-label="Add new clock"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Clock
            </Button>
          </div>

          <div className="space-y-3">
            {clocks.map((clock) => (
              <div
                key={clock.id}
                className="flex items-center gap-2 rounded-lg border p-3"
              >
                <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2">
                  {/* Label input */}
                  <div>
                    <Label htmlFor={`label-${clock.id}`}>Label</Label>
                    <Input
                      id={`label-${clock.id}`}
                      value={clock.label}
                      onChange={(e) =>
                        updateClock(clock.id, "label", e.target.value)
                      }
                      placeholder="Clock label"
                      aria-label="Clock label"
                    />
                  </div>

                  {/* Timezone select */}
                  <div>
                    <Label htmlFor={`timezone-${clock.id}`}>
                      Timezone
                    </Label>
                    <Select
                      value={clock.timezone}
                      onValueChange={(value) =>
                        updateClock(clock.id, "timezone", value)
                      }
                    >
                      <SelectTrigger id={`timezone-${clock.id}`}>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeClock(clock.id)}
                  disabled={clocks.length === 1}
                  aria-label="Remove clock"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clock Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {formattedClocks.map((clock) => (
          <Card key={clock.id}>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <Clock className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <span className="min-w-0 break-words">
                  {clock.label || "Unnamed Clock"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-center">
                <div className="font-mono text-3xl font-bold text-blue-600">
                  {clock.time}
                </div>
                <div className="text-sm text-muted-foreground">
                  {clock.date}
                </div>
                <div className="text-xs text-muted-foreground">
                  {clock.offset}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>World Clock Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Add multiple clocks to track different time zones.</li>
            <li>• Clocks update every second using your device time.</li>
            <li>• Use descriptive labels (e.g. “Client – Tokyo”).</li>
            <li>• UTC offset automatically adjusts for daylight saving.</li>
            <li>• Great for planning meetings across time zones.</li>
            <li>• You can add up to {maxClocks} clocks.</li>
            <li>
              • Times are displayed in {hour12 ? "12" : "24"}-hour format.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

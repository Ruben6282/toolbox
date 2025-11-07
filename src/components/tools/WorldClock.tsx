import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Trash2 } from "lucide-react";
import { toZonedTime, format } from "date-fns-tz";

interface ClockEntry {
  id: string;
  timezone: string;
  label: string;
}

interface WorldClockProps {
  hour12?: boolean; // true = 12-hour, false = 24-hour
  maxClocks?: number;
}

// Fallback UUID generator for iOS Safari
const generateId = () => crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 10);

export const WorldClock: React.FC<WorldClockProps> = ({ hour12 = true, maxClocks = 12 }) => {
  const [clocks, setClocks] = useState<ClockEntry[]>([
    { id: generateId(), timezone: "America/New_York", label: "New York" },
    { id: generateId(), timezone: "Europe/London", label: "London" },
    { id: generateId(), timezone: "Asia/Tokyo", label: "Tokyo" },
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());

  const timezones = [
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
  ];

  // Update clocks every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addClock = () => {
    if (clocks.length >= maxClocks) return;
    const newClock: ClockEntry = { id: generateId(), timezone: "UTC", label: "New Clock" };
    setClocks([...clocks, newClock]);
  };

  const removeClock = (id: string) => {
    if (clocks.length > 1) setClocks(clocks.filter((c) => c.id !== id));
  };

  const updateClock = (id: string, field: keyof ClockEntry, value: string) => {
    setClocks(clocks.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  // Format clocks for display
  const formattedClocks = useMemo(() => {
    return clocks.map((clock) => {
      try {
        const zoned = toZonedTime(currentTime, clock.timezone);
        // Compute UTC offset safely
        const nowUTC = new Date(currentTime.getTime() + currentTime.getTimezoneOffset() * 60000);
        const diff = (zoned.getTime() - nowUTC.getTime()) / 3600000;
        const sign = diff >= 0 ? "+" : "";
        const hours = Math.floor(Math.abs(diff));
        const minutes = Math.round((Math.abs(diff) - hours) * 60);

        return {
          ...clock,
          time: format(zoned, hour12 ? "hh:mm:ss a" : "HH:mm:ss", { timeZone: clock.timezone }),
          date: format(zoned, "EEE, MMM d, yyyy", { timeZone: clock.timezone }),
          offset: `UTC${sign}${hours}:${minutes.toString().padStart(2, "0")}`,
        };
      } catch {
        return { ...clock, time: "Unavailable", date: "Unavailable", offset: "UTC+0" };
      }
    });
  }, [clocks, currentTime, hour12]);

  return (
    <div className="space-y-6">
      {/* Clock Management */}
      <Card>
        <CardHeader>
          <CardTitle>World Clock</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            All times are calculated based on your device's current time
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Manage Clocks</Label>
            <Button onClick={addClock} size="sm" aria-label="Add new clock">
              <Plus className="h-4 w-4 mr-2" /> Add Clock
            </Button>
          </div>
          <div className="space-y-3">
            {clocks.map((clock) => (
              <div key={clock.id} className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`label-${clock.id}`}>Label</Label>
                    <Input
                      id={`label-${clock.id}`}
                      value={clock.label}
                      onChange={(e) => updateClock(clock.id, "label", e.target.value)}
                      placeholder="Clock label"
                      aria-label="Clock label"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`timezone-${clock.id}`}>Timezone</Label>
                    <Select
                      value={clock.timezone}
                      onValueChange={(value) => updateClock(clock.id, "timezone", value)}
                      aria-label="Select timezone"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={() => removeClock(clock.id)}
                  variant="outline"
                  size="sm"
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

      {/* Display Clocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formattedClocks.map((clock) => (
          <Card key={clock.id}>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="break-words min-w-0">{clock.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-mono font-bold text-blue-600">{clock.time}</div>
                <div className="text-sm text-muted-foreground">{clock.date}</div>
                <div className="text-xs text-muted-foreground">{clock.offset}</div>
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
            <li>• Add multiple clocks to track different timezones</li>
            <li>• All clocks update in real-time every second</li>
            <li>• Use descriptive labels for easy identification</li>
            <li>• UTC offset shows the difference from Coordinated Universal Time</li>
            <li>• Times automatically adjust for daylight saving time</li>
            <li>• Perfect for international meetings and travel planning</li>
            <li>• You can add up to {maxClocks} clocks for comprehensive coverage</li>
            <li>• Times display according to 12/24-hour preference</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

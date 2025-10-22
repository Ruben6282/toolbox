import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Trash2 } from "lucide-react";

interface ClockEntry {
  id: string;
  timezone: string;
  label: string;
}

export const WorldClock = () => {
  const [clocks, setClocks] = useState<ClockEntry[]>([
    { id: "1", timezone: "America/New_York", label: "New York" },
    { id: "2", timezone: "Europe/London", label: "London" },
    { id: "3", timezone: "Asia/Tokyo", label: "Tokyo" }
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
    { label: "UTC", value: "UTC" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const addClock = () => {
    const newClock: ClockEntry = {
      id: Date.now().toString(),
      timezone: "UTC",
      label: "New Clock"
    };
    setClocks([...clocks, newClock]);
  };

  const removeClock = (id: string) => {
    if (clocks.length > 1) {
      setClocks(clocks.filter(clock => clock.id !== id));
    }
  };

  const updateClock = (id: string, field: keyof ClockEntry, value: string) => {
    setClocks(clocks.map(clock => 
      clock.id === id ? { ...clock, [field]: value } : clock
    ));
  };

  const getTimeInTimezone = (timezone: string) => {
    try {
      return new Date(currentTime.toLocaleString("en-US", { timeZone: timezone }));
    } catch (error) {
      return currentTime;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getTimezoneOffset = (timezone: string) => {
    try {
      const now = new Date();
      const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
      const target = new Date(utc.toLocaleString("en-US", { timeZone: timezone }));
      const offset = (target.getTime() - utc.getTime()) / (1000 * 60 * 60);
      return offset;
    } catch (error) {
      return 0;
    }
  };

  const formatOffset = (offset: number) => {
    const sign = offset >= 0 ? "+" : "";
    const hours = Math.floor(Math.abs(offset));
    const minutes = Math.round((Math.abs(offset) - hours) * 60);
    return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>World Clock</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Manage Clocks</Label>
            <Button onClick={addClock} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Clock
            </Button>
          </div>

          <div className="space-y-3">
            {clocks.map((clock, index) => (
              <div key={clock.id} className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`label-${clock.id}`}>Label</Label>
                    <Input
                      id={`label-${clock.id}`}
                      value={clock.label}
                      onChange={(e) => updateClock(clock.id, 'label', e.target.value)}
                      placeholder="Clock label"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`timezone-${clock.id}`}>Timezone</Label>
                    <Select
                      value={clock.timezone}
                      onValueChange={(value) => updateClock(clock.id, 'timezone', value)}
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
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clocks.map((clock) => {
          const timeInZone = getTimeInTimezone(clock.timezone);
          const offset = getTimezoneOffset(clock.timezone);
          
          return (
            <Card key={clock.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {clock.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-mono font-bold text-blue-600">
                    {formatTime(timeInZone)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(timeInZone)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatOffset(offset)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
            <li>• You can add up to 12 clocks for comprehensive coverage</li>
            <li>• Times are displayed in 12-hour format with AM/PM</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

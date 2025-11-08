import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, ArrowLeftRight } from "lucide-react";
import { format, toZonedTime } from "date-fns-tz";
import { notify } from "@/lib/notify";

interface TimeZone {
  name: string;
  label: string;
}

export const TimeZoneConverter = () => {
  const [fromTimeZone, setFromTimeZone] = useState("UTC");
  const [toTimeZone, setToTimeZone] = useState("America/New_York");
  const [inputDate, setInputDate] = useState("");
  const [inputTime, setInputTime] = useState("");
  const [convertedTime, setConvertedTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const timeZones: TimeZone[] = [
    { name: "UTC", label: "UTC (Coordinated Universal Time)" },
    { name: "America/New_York", label: "New York (EST/EDT)" },
    { name: "America/Chicago", label: "Chicago (CST/CDT)" },
    { name: "America/Denver", label: "Denver (MST/MDT)" },
    { name: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
    { name: "Europe/London", label: "London (GMT/BST)" },
    { name: "Europe/Paris", label: "Paris (CET/CEST)" },
    { name: "Europe/Berlin", label: "Berlin (CET/CEST)" },
    { name: "Europe/Rome", label: "Rome (CET/CEST)" },
    { name: "Europe/Madrid", label: "Madrid (CET/CEST)" },
    { name: "Asia/Tokyo", label: "Tokyo (JST)" },
    { name: "Asia/Shanghai", label: "Shanghai (CST)" },
    { name: "Asia/Kolkata", label: "Mumbai/Delhi (IST)" },
    { name: "Asia/Dubai", label: "Dubai (GST)" },
    { name: "Asia/Singapore", label: "Singapore (SGT)" },
    { name: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
    { name: "Australia/Melbourne", label: "Melbourne (AEST/AEDT)" },
    { name: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
    { name: "America/Sao_Paulo", label: "São Paulo (BRT)" },
    { name: "Africa/Cairo", label: "Cairo (EET)" },
  ];

  // Auto-update the live clock every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const convertTime = () => {
    if (!inputDate || !inputTime) {
      notify.error("Please enter both date and time!");
      return;
    }

    try {
      // Combine date and time into ISO format
      const dateTimeString = `${inputDate}T${inputTime}`;
      const utcDate = new Date(dateTimeString);

      if (isNaN(utcDate.getTime())) {
        setConvertedTime("Invalid date/time");
        notify.error("Invalid date/time!");
        return;
      }

      // Convert from "fromTimeZone" → UTC → "toTimeZone"
      const sourceDate = toZonedTime(utcDate, fromTimeZone);
      const targetDate = toZonedTime(sourceDate, toTimeZone);

      const formatted = format(targetDate, "yyyy-MM-dd HH:mm:ss", {
        timeZone: toTimeZone,
      });

      setConvertedTime(formatted);
      notify.success("Time converted successfully!");
    } catch (error) {
      console.error("Conversion error:", error);
      setConvertedTime("Error converting time");
      notify.error("Error converting time!");
    }
  };

  const swapTimeZones = () => {
    setConvertedTime(null);
    setFromTimeZone(toTimeZone);
    setToTimeZone(fromTimeZone);
    notify.success("Time zones swapped!");
  };

  const setCurrentDateTime = () => {
    const now = new Date();
    setInputDate(now.toISOString().split("T")[0]);
    setInputTime(now.toTimeString().slice(0, 5));
    notify.success("Set to current date and time!");
  };

  const clearAll = () => {
    setInputDate("");
    setInputTime("");
    setConvertedTime(null);
    notify.success("Cleared all fields!");
  };

  const getCurrentTimeInZone = (tz: string) => {
    try {
      const zoned = toZonedTime(currentTime, tz);
      return format(zoned, "yyyy-MM-dd HH:mm:ss", { timeZone: tz });
    } catch {
      return "Unavailable";
    }
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle>Time Zone Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date and Time Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="input-date" className="text-xs sm:text-sm">Date</Label>
              <Input
                id="input-date"
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-time" className="text-xs sm:text-sm">Time</Label>
              <Input
                id="input-time"
                type="time"
                value={inputTime}
                onChange={(e) => setInputTime(e.target.value)}
              />
            </div>
          </div>

          {/* Time Zone Selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-timezone" className="text-xs sm:text-sm">From Time Zone</Label>
              <Select value={fromTimeZone} onValueChange={setFromTimeZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent>
                  {timeZones.map((tz) => (
                    <SelectItem key={tz.name} value={tz.name}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-timezone" className="text-xs sm:text-sm">To Time Zone</Label>
              <Select value={toTimeZone} onValueChange={setToTimeZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent>
                  {timeZones.map((tz) => (
                    <SelectItem key={tz.name} value={tz.name}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button onClick={convertTime} disabled={!inputDate || !inputTime} className="w-full sm:w-auto">
              Convert Time
            </Button>
            <Button onClick={swapTimeZones} variant="outline" className="w-full sm:w-auto">
              <ArrowLeftRight className="h-4 w-4 mr-2" /> Swap
            </Button>
            <Button onClick={setCurrentDateTime} variant="outline" className="w-full sm:w-auto">
              Use Current Time
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Converted Time */}
      {convertedTime && (
        <Card>
          <CardHeader>
            <CardTitle>Converted Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 sm:p-6 rounded-lg text-center">
              <div className="text-xl sm:text-2xl font-bold mb-2 break-all">{convertedTime}</div>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">
                {timeZones.find(tz => tz.name === toTimeZone)?.label}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Clocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base break-words">
              Current Time — {timeZones.find(tz => tz.name === fromTimeZone)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-lg sm:text-2xl font-bold break-all">
              {getCurrentTimeInZone(fromTimeZone)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base break-words">
              Current Time — {timeZones.find(tz => tz.name === toTimeZone)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-lg sm:text-2xl font-bold break-all">
              {getCurrentTimeInZone(toTimeZone)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>Time Zone Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>• Always specify the time zone when scheduling international meetings</li>
            <li>• Consider daylight saving time changes when converting times</li>
            <li>• Use 24-hour format for clarity in international communications</li>
            <li>• Some countries have half-hour or quarter-hour time zone offsets</li>
            <li>• Time zones can change due to political decisions or daylight saving rules</li>
            <li>• Always double-check critical time conversions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

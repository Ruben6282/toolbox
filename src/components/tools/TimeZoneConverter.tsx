import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, ArrowLeftRight } from "lucide-react";

interface TimeZone {
  name: string;
  offset: number;
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
    { name: "UTC", offset: 0, label: "UTC (Coordinated Universal Time)" },
    { name: "America/New_York", offset: -5, label: "New York (EST/EDT)" },
    { name: "America/Chicago", offset: -6, label: "Chicago (CST/CDT)" },
    { name: "America/Denver", offset: -7, label: "Denver (MST/MDT)" },
    { name: "America/Los_Angeles", offset: -8, label: "Los Angeles (PST/PDT)" },
    { name: "Europe/London", offset: 0, label: "London (GMT/BST)" },
    { name: "Europe/Paris", offset: 1, label: "Paris (CET/CEST)" },
    { name: "Europe/Berlin", offset: 1, label: "Berlin (CET/CEST)" },
    { name: "Europe/Rome", offset: 1, label: "Rome (CET/CEST)" },
    { name: "Europe/Madrid", offset: 1, label: "Madrid (CET/CEST)" },
    { name: "Asia/Tokyo", offset: 9, label: "Tokyo (JST)" },
    { name: "Asia/Shanghai", offset: 8, label: "Shanghai (CST)" },
    { name: "Asia/Kolkata", offset: 5.5, label: "Mumbai/Delhi (IST)" },
    { name: "Asia/Dubai", offset: 4, label: "Dubai (GST)" },
    { name: "Asia/Singapore", offset: 8, label: "Singapore (SGT)" },
    { name: "Australia/Sydney", offset: 10, label: "Sydney (AEST/AEDT)" },
    { name: "Australia/Melbourne", offset: 10, label: "Melbourne (AEST/AEDT)" },
    { name: "Pacific/Auckland", offset: 12, label: "Auckland (NZST/NZDT)" },
    { name: "America/Sao_Paulo", offset: -3, label: "São Paulo (BRT)" },
    { name: "Africa/Cairo", offset: 2, label: "Cairo (EET)" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const convertTime = () => {
    if (!inputDate || !inputTime) return;

    try {
      const dateTimeString = `${inputDate}T${inputTime}`;
      const localDate = new Date(dateTimeString);
      
      if (isNaN(localDate.getTime())) {
        setConvertedTime("Invalid date/time");
        return;
      }

      // Create a date in the source timezone
      const sourceDate = new Date(localDate.toLocaleString("en-US", { timeZone: fromTimeZone }));
      
      // Convert to target timezone
      const targetDate = new Date(sourceDate.toLocaleString("en-US", { timeZone: toTimeZone }));
      
      const formattedTime = targetDate.toLocaleString("en-US", {
        timeZone: toTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      setConvertedTime(formattedTime);
    } catch (error) {
      setConvertedTime("Error converting time");
    }
  };

  const swapTimeZones = () => {
    const temp = fromTimeZone;
    setFromTimeZone(toTimeZone);
    setToTimeZone(temp);
    setConvertedTime(null);
  };

  const setCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5);
    setInputDate(date);
    setInputTime(time);
  };

  const clearAll = () => {
    setInputDate("");
    setInputTime("");
    setConvertedTime(null);
  };

  const getCurrentTimeInZone = (timeZone: string) => {
    return currentTime.toLocaleString("en-US", {
      timeZone: timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Time Zone Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="input-date">Date</Label>
              <Input
                id="input-date"
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-time">Time</Label>
              <Input
                id="input-time"
                type="time"
                value={inputTime}
                onChange={(e) => setInputTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-timezone">From Time Zone</Label>
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
              <Label htmlFor="to-timezone">To Time Zone</Label>
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

          <div className="flex gap-2">
            <Button onClick={convertTime} disabled={!inputDate || !inputTime}>
              Convert Time
            </Button>
            <Button onClick={swapTimeZones} variant="outline">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Swap
            </Button>
            <Button onClick={setCurrentDateTime} variant="outline">
              Use Current Time
            </Button>
            <Button onClick={clearAll} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {convertedTime && (
        <Card>
          <CardHeader>
            <CardTitle>Converted Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-6 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2">{convertedTime}</div>
              <p className="text-muted-foreground">
                {timeZones.find(tz => tz.name === toTimeZone)?.label}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Time - {timeZones.find(tz => tz.name === fromTimeZone)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {getCurrentTimeInZone(fromTimeZone)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Time - {timeZones.find(tz => tz.name === toTimeZone)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {getCurrentTimeInZone(toTimeZone)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time Zone Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
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

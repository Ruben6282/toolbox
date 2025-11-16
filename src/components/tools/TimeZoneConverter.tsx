import { useState, useEffect } from "react";
import {
  toZonedTime,
  format as tzFormat,
} from "date-fns-tz";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ArrowLeftRight, RotateCcw } from "lucide-react";
import { notify } from "@/lib/notify";

/* ---------------------------------------
   TIME ZONES
---------------------------------------- */

const TIME_ZONES = [
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
  { name: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
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
] as const;

type TimeZoneName = (typeof TIME_ZONES)[number]["name"];
const TZ_NAMES = TIME_ZONES.map((t) => t.name);

const coerceTZ = (v: string): TimeZoneName =>
  TZ_NAMES.includes(v as TimeZoneName) ? (v as TimeZoneName) : "UTC";

const formatInZone = (date: Date, zone: TimeZoneName) =>
  tzFormat(date, "yyyy-MM-dd HH:mm:ss", { timeZone: zone });

const formatOffset = (date: Date, zone: TimeZoneName) => {
  try {
    return tzFormat(date, "XXX", { timeZone: zone });
  } catch {
    return "";
  }
};

/* ---------------------------------------
   COMPONENT
---------------------------------------- */

export const TimeZoneConverter = () => {
  const [fromTZ, setFromTZ] = useState<TimeZoneName>("UTC");
  const [toTZ, setToTZ] = useState<TimeZoneName>("America/New_York");

  const [inputDate, setInputDate] = useState("");
  const [inputTime, setInputTime] = useState("");

  const [result, setResult] = useState<string | null>(null);
  const [resultOffset, setResultOffset] = useState<string | null>(null);

  const [isConverting, setIsConverting] = useState(false);

  const [nowUtc, setNowUtc] = useState(() => new Date());

  /* Live clock refresh */
  useEffect(() => {
    const id = setInterval(() => setNowUtc(new Date()), 10000);
    return () => clearInterval(id);
  }, []);

  /* ---------------------------------------
     CONVERSION LOGIC (using your version of date-fns-tz)
  ---------------------------------------- */

  const convert = () => {
    if (!inputDate || !inputTime) {
      notify.error("Please enter both date and time.");
      return;
    }

    setIsConverting(true);
    setResult(null);
    setResultOffset(null);

    try {
      // Build ISO-like string
      const localString = `${inputDate}T${inputTime}:00`;

      // interpret as FROM time zone local time
      const fromLocal = toZonedTime(localString, fromTZ);

      // convert "from local" → UTC
      const utcDate = new Date(
        Date.UTC(
          fromLocal.getFullYear(),
          fromLocal.getMonth(),
          fromLocal.getDate(),
          fromLocal.getHours(),
          fromLocal.getMinutes(),
          fromLocal.getSeconds()
        )
      );

      // convert UTC → target zone
      const target = toZonedTime(utcDate, toTZ);

      setResult(formatInZone(target, toTZ));
      setResultOffset(formatOffset(utcDate, toTZ));

      notify.success("Time converted!");
    } catch (err) {
      console.error(err);
      notify.error("Conversion failed.");
    } finally {
      setIsConverting(false);
    }
  };

  const swap = () => {
    setFromTZ(toTZ);
    setToTZ(fromTZ);
    setResult(null);
    notify.success("Time zones swapped.");
  };

  const useNow = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");

    setInputDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    setInputTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);

    notify.success("Using current system time.");
  };

  const clearAll = () => {
    setInputDate("");
    setInputTime("");
    setResult(null);
    notify.success("Cleared.");
  };

  /* Current times */
  const currentFrom = formatInZone(toZonedTime(nowUtc, fromTZ), fromTZ);
  const currentTo = formatInZone(toZonedTime(nowUtc, toTZ), toTZ);

  const fromOffset = formatOffset(nowUtc, fromTZ);
  const toOffset = formatOffset(nowUtc, toTZ);

  const getLabel = (tz: TimeZoneName) =>
    TIME_ZONES.find((t) => t.name === tz)?.label ?? tz;

  /* ---------------------------------------
     UI
  ---------------------------------------- */

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Time Zone Converter</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={inputTime} onChange={(e) => setInputTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>From Time Zone</Label>
              <Select value={fromTZ} onValueChange={(v) => setFromTZ(coerceTZ(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_ZONES.map((tz) => (
                    <SelectItem key={tz.name} value={tz.name}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">UTC{fromOffset}</p>
            </div>

            <div>
              <Label>To Time Zone</Label>
              <Select value={toTZ} onValueChange={(v) => setToTZ(coerceTZ(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_ZONES.map((tz) => (
                    <SelectItem key={tz.name} value={tz.name}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">UTC{toOffset}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="w-full sm:w-auto" onClick={convert} disabled={!inputDate || !inputTime || isConverting}>
              {isConverting ? "Converting..." : "Convert"}
            </Button>

            <Button variant="outline" className="w-full sm:w-auto" onClick={swap}>
              <ArrowLeftRight className="h-4 w-4 mr-2" /> Swap
            </Button>

            <Button variant="outline" className="w-full sm:w-auto" onClick={useNow}>
              Use Current
            </Button>

            <Button variant="outline" className="w-full sm:w-auto" onClick={clearAll}>
              <RotateCcw className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Converted Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg text-center space-y-2">
              <div className="text-xl font-bold break-words">{result}</div>
              <p className="text-xs text-muted-foreground">
                {getLabel(toTZ)} — UTC{resultOffset}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live clocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{getLabel(fromTZ)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-xl font-bold">{currentFrom}</div>
            <p className="text-xs text-muted-foreground text-center">UTC{fromOffset}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{getLabel(toTZ)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-xl font-bold">{currentTo}</div>
            <p className="text-xs text-muted-foreground text-center">UTC{toOffset}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

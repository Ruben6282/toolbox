import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Moon, Sunrise, Bed, RotateCcw } from "lucide-react";
import { notify } from "@/lib/notify";
import { safeNumber } from "@/lib/safe-number";

/**
 * VERSION B — PRODUCTION READY
 * - Accepts independent bedtime, wake-up time, or both.
 * - Shows BOTH recommendation blocks when both fields are filled.
 * - Time validation hardened (00:00 → 23:59).
 * - Fall-asleep time sanitized with safe-number.
 * - All calculations isolated and pure.
 */

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const MIN_FALL_ASLEEP = 0;
const MAX_FALL_ASLEEP = 120;

// Sanitize HH:mm input
const sanitizeTime = (v: string) => (TIME_RE.test(v) ? v : "");

interface SleepResult {
  time: string;
  cycles: number;
  type: "wakeup" | "bedtime";
}

export const SleepCycleCalculator = () => {
  const [bedtime, setBedtime] = useState("");
  const [wakeup, setWakeup] = useState("");
  const [fallAsleepTime, setFallAsleepTime] = useState("15");

  // Convert HH:mm → Date
  const parseHM = (hm: string): Date | null => {
    if (!TIME_RE.test(hm)) return null;
    const [h, m] = hm.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const results = useMemo(() => {
    const out: SleepResult[] = [];

    const fa = safeNumber(fallAsleepTime, {
      min: MIN_FALL_ASLEEP,
      max: MAX_FALL_ASLEEP,
      allowDecimal: false,
    }) ?? 15;

    // BEDTIME → wake-up times
    const bedtimeDate = parseHM(bedtime);
    if (bedtimeDate) {
      for (let cycles = 6; cycles >= 4; cycles--) {
        const d = new Date(bedtimeDate);
        d.setMinutes(d.getMinutes() + cycles * 90 + fa);

        out.push({
          cycles,
          type: "wakeup",
          time: d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        });
      }
    }

    // WAKE-UP TIME → bedtimes
    const wakeDate = parseHM(wakeup);
    if (wakeDate) {
      for (let cycles = 6; cycles >= 4; cycles--) {
        const d = new Date(wakeDate);
        d.setMinutes(d.getMinutes() - cycles * 90 - fa);

        out.push({
          cycles,
          type: "bedtime",
          time: d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        });
      }
    }

    return out;
  }, [bedtime, wakeup, fallAsleepTime]);

  const nowHHMM = () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const setCurrent = (t: "bed" | "wake") => {
    const now = nowHHMM();
    if (t === "bed") setBedtime(now);
    else setWakeup(now);
    notify.success("Set to current time!");
  };

  const clearAll = () => {
    setBedtime("");
    setWakeup("");
    setFallAsleepTime("15");
    notify.success("All fields cleared!");
  };

  const cycleColor = (c: number) => {
    switch (c) {
      case 6: return "bg-green-100 text-green-800 border-green-200";
      case 5: return "bg-blue-100 text-blue-800 border-blue-200";
      case 4: return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const cycleLabel = (c: number) => {
    switch (c) {
      case 6: return "Optimal (9 hours)";
      case 5: return "Good (7.5 hours)";
      case 4: return "Minimum (6 hours)";
      default: return "Custom";
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sleep Cycle Calculator</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bed & Wake Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bedtime</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(sanitizeTime(e.target.value))}
                />
                <Button variant="outline" size="sm" onClick={() => setCurrent("bed")}>
                  Now
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Wake-up Time</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={wakeup}
                  onChange={(e) => setWakeup(sanitizeTime(e.target.value))}
                />
                <Button variant="outline" size="sm" onClick={() => setCurrent("wake")}>
                  Now
                </Button>
              </div>
            </div>
          </div>

          {/* Fall-asleep time */}
          <div className="space-y-2">
            <Label>Time to Fall Asleep (minutes)</Label>
            <SafeNumberInput
              value={fallAsleepTime}
              onChange={(v) => {
                // If empty, treat as 0 ALWAYS
                if (v === "") {
                  setFallAsleepTime("0");
                  return;
                }

                // Parse with safeNumber, with clamping
                const num = safeNumber(v, {
                  min: MIN_FALL_ASLEEP,
                  max: MAX_FALL_ASLEEP,
                  allowDecimal: false,
                });

                // If somehow unparseable, fall back to 0
                if (num === null) {
                  setFallAsleepTime("0");
                  return;
                }

                // Always store valid clamped integer
                setFallAsleepTime(String(num));
              }}
              sanitizeOptions={{
                min: MIN_FALL_ASLEEP,
                max: MAX_FALL_ASLEEP,
                allowDecimal: false,
              }}
              inputMode="numeric"
              min={MIN_FALL_ASLEEP}
              max={MAX_FALL_ASLEEP}
              aria-label="Minutes to fall asleep"
            />
            <p className="text-sm text-muted-foreground">
              Typical range is 10–20 minutes.
            </p>
          </div>

          <Button onClick={clearAll} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {/* Results Card */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Sleep Cycle Recommendations
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Bedtime → Wake-up suggestions */}
            {bedtime && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Bed className="h-4 w-4" />
                  If you go to bed at {bedtime}:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {results
                    .filter((r) => r.type === "wakeup")
                    .map((r, i) => (
                      <div key={i} className="border rounded-lg p-3">
                        <div className="flex justify-between mb-2">
                          <span className="text-lg font-mono font-bold">{`Wake up at ${r.time}`}</span>
                          <Badge className={cycleColor(r.cycles)}>{r.cycles} cycles</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {cycleLabel(r.cycles)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Wake-up → Bedtime suggestions */}
            {wakeup && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sunrise className="h-4 w-4" />
                  If you want to wake up at {wakeup}:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {results
                    .filter((r) => r.type === "bedtime")
                    .map((r, i) => (
                      <div key={i} className="border rounded-lg p-3">
                        <div className="flex justify-between mb-2">
                          <span className="text-lg font-mono font-bold">{`Go to bed at ${r.time}`}</span>
                          <Badge className={cycleColor(r.cycles)}>{r.cycles} cycles</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {cycleLabel(r.cycles)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sleep info */}
      <Card>
        <CardHeader>
          <CardTitle>Sleep Cycle Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            A sleep cycle lasts about 90 minutes and includes light sleep, deep
            sleep, and REM. Waking at the *end* of a cycle improves alertness.
          </p>
          <ul className="space-y-1">
            <li>• Maintain a consistent sleep schedule</li>
            <li>• Avoid screens 1 hour before bed</li>
            <li>• Keep your room cool and dark</li>
            <li>• Limit caffeine in the afternoon</li>
            <li>• Exercise regularly (not late at night)</li>
          </ul>
        </CardContent>
      </Card>

      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Sleep Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Early Bird", bed: "21:00", wake: "05:00" },
              { label: "Standard", bed: "22:00", wake: "06:00" },
              { label: "Night Owl", bed: "23:00", wake: "07:00" },
              { label: "Late Night", bed: "00:00", wake: "08:00" },
            ].map((p) => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  setBedtime(p.bed);
                  setWakeup(p.wake);
                  notify.success(`Preset ${p.label} selected!`);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

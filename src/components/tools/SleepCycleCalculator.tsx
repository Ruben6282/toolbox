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

const MIN_FALL_ASLEEP_TIME = 0;
const MAX_FALL_ASLEEP_TIME = 60;
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Validate and clamp time input
const sanitizeTime = (value: string): string => {
  if (!value || !TIME_REGEX.test(value)) return "";
  return value;
};

interface SleepTime {
  time: string;
  cycles: number;
  type: 'bedtime' | 'wakeup';
}

export const SleepCycleCalculator = () => {
  const [bedtime, setBedtime] = useState("");
  const [wakeupTime, setWakeupTime] = useState("");
  const [sleepDuration, setSleepDuration] = useState(8);
  const [fallAsleepTime, setFallAsleepTime] = useState("15");

  const calculateSleepTimes = useMemo(() => {
    const results: SleepTime[] = [];
    
    // Parse fallAsleepTime with safeNumber
    const fallAsleepMinutes = safeNumber(fallAsleepTime, { min: MIN_FALL_ASLEEP_TIME, max: MAX_FALL_ASLEEP_TIME, allowDecimal: false }) || 15;
    
    if (bedtime) {
      const [hours, minutes] = bedtime.split(':').map(Number);
      const bedtimeDate = new Date();
      bedtimeDate.setHours(hours, minutes, 0, 0);
      
      // Calculate wake-up times (6 cycles = 9 hours, 5 cycles = 7.5 hours, etc.)
      for (let cycles = 6; cycles >= 4; cycles--) {
        const wakeupDate = new Date(bedtimeDate);
        wakeupDate.setMinutes(wakeupDate.getMinutes() + (cycles * 90) + fallAsleepMinutes);
        
        results.push({
          time: wakeupDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          cycles,
          type: 'wakeup'
        });
      }
    }
    
    if (wakeupTime) {
      const [hours, minutes] = wakeupTime.split(':').map(Number);
      const wakeupDate = new Date();
      wakeupDate.setHours(hours, minutes, 0, 0);
      
      // Calculate bedtime times
      for (let cycles = 6; cycles >= 4; cycles--) {
        const bedtimeDate = new Date(wakeupDate);
        bedtimeDate.setMinutes(bedtimeDate.getMinutes() - (cycles * 90) - fallAsleepMinutes);
        
        results.push({
          time: bedtimeDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          cycles,
          type: 'bedtime'
        });
      }
    }
    
    return results;
  }, [bedtime, wakeupTime, fallAsleepTime]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const setCurrentTime = (type: 'bedtime' | 'wakeup') => {
    const currentTime = getCurrentTime();
    if (type === 'bedtime') {
      setBedtime(currentTime);
      notify.success("Set to current time!");
    } else {
      setWakeupTime(currentTime);
      notify.success("Set to current time!");
    }
  };

  const clearAll = () => {
    setBedtime("");
    setWakeupTime("");
    setSleepDuration(8);
    setFallAsleepTime("15");
    notify.success("All fields cleared!");
  };



  const getCycleColor = (cycles: number) => {
    switch (cycles) {
      case 6: return 'bg-green-100 text-green-800 border-green-200';
      case 5: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 4: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCycleDescription = (cycles: number) => {
    switch (cycles) {
      case 6: return 'Optimal (9 hours)';
      case 5: return 'Good (7.5 hours)';
      case 4: return 'Minimum (6 hours)';
      default: return 'Custom';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sleep Cycle Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedtime">Bedtime</Label>
              <div className="flex gap-2">
                <Input
                  id="bedtime"
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(sanitizeTime(e.target.value))}
                />
                <Button 
                  onClick={() => setCurrentTime('bedtime')} 
                  variant="outline" 
                  size="sm"
                >
                  Now
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wakeup">Wake-up Time</Label>
              <div className="flex gap-2">
                <Input
                  id="wakeup"
                  type="time"
                  value={wakeupTime}
                  onChange={(e) => setWakeupTime(sanitizeTime(e.target.value))}
                />
                <Button 
                  onClick={() => setCurrentTime('wakeup')} 
                  variant="outline" 
                  size="sm"
                >
                  Now
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fall-asleep">Time to Fall Asleep (minutes)</Label>
            <SafeNumberInput
              id="fall-asleep"
              value={fallAsleepTime}
              onChange={(sanitized) => setFallAsleepTime(sanitized)}
              sanitizeOptions={{ min: MIN_FALL_ASLEEP_TIME, max: MAX_FALL_ASLEEP_TIME, allowDecimal: false }}
              inputMode="numeric"
            />
            <p className="text-sm text-muted-foreground">
              Average time it takes you to fall asleep
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={clearAll} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {calculateSleepTimes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Sleep Cycle Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bedtime && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    If you go to bed at {bedtime}:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {calculateSleepTimes
                      .filter(t => t.type === 'wakeup')
                      .map((sleepTime, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-mono font-bold">
                              {sleepTime.time}
                            </span>
                            <Badge className={getCycleColor(sleepTime.cycles)}>
                              {sleepTime.cycles} cycles
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getCycleDescription(sleepTime.cycles)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {wakeupTime && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sunrise className="h-4 w-4" />
                    If you want to wake up at {wakeupTime}:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {calculateSleepTimes
                      .filter(t => t.type === 'bedtime')
                      .map((sleepTime, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-mono font-bold">
                              {sleepTime.time}
                            </span>
                            <Badge className={getCycleColor(sleepTime.cycles)}>
                              {sleepTime.cycles} cycles
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getCycleDescription(sleepTime.cycles)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sleep Cycle Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">What are Sleep Cycles?</h4>
              <p className="text-sm text-muted-foreground">
                A complete sleep cycle lasts about 90 minutes and includes all stages of sleep: 
                light sleep, deep sleep, and REM sleep. Waking up at the end of a complete cycle 
                helps you feel more refreshed and alert.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Sleep Stages:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• <strong>Light Sleep (N1 & N2):</strong> Transitional sleep, easy to wake from</li>
                <li>• <strong>Deep Sleep (N3):</strong> Restorative sleep, hardest to wake from</li>
                <li>• <strong>REM Sleep:</strong> Dream sleep, important for memory consolidation</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Tips for Better Sleep:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Maintain a consistent sleep schedule</li>
                <li>• Create a relaxing bedtime routine</li>
                <li>• Keep your bedroom cool, dark, and quiet</li>
                <li>• Avoid screens 1 hour before bedtime</li>
                <li>• Limit caffeine and alcohol before bed</li>
                <li>• Exercise regularly, but not too close to bedtime</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Sleep Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Early Bird", bedtime: "21:00", wakeup: "05:00" },
              { label: "Standard", bedtime: "22:00", wakeup: "06:00" },
              { label: "Night Owl", bedtime: "23:00", wakeup: "07:00" },
              { label: "Late Night", bedtime: "00:00", wakeup: "08:00" }
            ].map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  setBedtime(preset.bedtime);
                  setWakeupTime(preset.wakeup);
                  notify.success(`Preset ${preset.label} selected!`);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

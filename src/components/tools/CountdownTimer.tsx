import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Clock, Bell } from "lucide-react";
import { notify } from "@/lib/notify";

const HOURS_MAX = 23;
const MINSEC_MAX = 59;

type IntervalId = number | null;

// Sanitize numeric input into integer within [min, max]
const sanitizeIntRange = (value: string, min: number, max: number): number => {
  const cleaned = value.replace(/[^0-9-]/g, "");
  const n = parseInt(cleaned, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
};

export const CountdownTimer = () => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [totalDuration, setTotalDuration] = useState(0); // seconds

  const [showAlert, setShowAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const intervalRef = useRef<IntervalId>(null);

  const clearTimerInterval = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Simple beep using Web Audio API with safe guards
  const playAlertSound = () => {
    const AudioCtx =
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext || window.AudioContext;

    if (!AudioCtx) {
      // Web Audio not supported; silently skip
      return;
    }

    try {
      const audioContext = new AudioCtx();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      // Ensure context is running (required on some browsers)
      void audioContext.resume?.();

      oscillator.start(now);
      oscillator.stop(now + 0.5);

      // Cleanup
      window.setTimeout(() => {
        try {
          oscillator.disconnect();
          gainNode.disconnect();
          void audioContext.close();
        } catch {
          // ignore cleanup errors
        }
      }, 700);
    } catch {
      // If anything goes wrong, don't crash the app
    }
  };

  // Interval management: only depends on isRunning & soundEnabled
  useEffect(() => {
    if (!isRunning) {
      clearTimerInterval();
      return;
    }

    // Avoid creating multiple intervals
    if (intervalRef.current !== null) return;

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimerInterval();
          setIsRunning(false);
          setShowAlert(true);

          if (soundEnabled) {
            playAlertSound();
          }

          notify.success("Time's up!");
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimerInterval();
    };
  }, [isRunning, soundEnabled]);

  const computeTotalSecondsFromInputs = () =>
    hours * 3600 + minutes * 60 + seconds;

  const startTimer = () => {
    const inputTotalSeconds = computeTotalSecondsFromInputs();

    // If inputs are zero and no remaining time, don't start
    if (!isRunning && timeLeft === 0 && inputTotalSeconds <= 0) {
      notify.error("Please set a valid time!");
      return;
    }

    // Resume from pause if timeLeft > 0 and user didn't change duration
    if (!isRunning && timeLeft > 0 && inputTotalSeconds === totalDuration) {
      setIsRunning(true);
      setShowAlert(false);
      notify.success("Timer resumed!");
      return;
    }

    // If inputs changed or we are starting fresh
    if (inputTotalSeconds > 0) {
      clearTimerInterval();
      setTimeLeft(inputTotalSeconds);
      setTotalDuration(inputTotalSeconds);
      setIsRunning(true);
      setShowAlert(false);
      notify.success("Timer started!");
      return;
    }

    notify.error("Please set a valid time!");
  };

  const pauseTimer = () => {
    if (!isRunning) return;
    setIsRunning(false);
    clearTimerInterval();
    notify.success("Timer paused!");
  };

  const resetTimer = () => {
    setIsRunning(false);
    clearTimerInterval();
    setTimeLeft(0);
    setTotalDuration(0);
    setShowAlert(false);
    notify.success("Timer reset!");
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, "0");

    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const getProgressPercentage = () => {
    if (totalDuration <= 0) return 0;
    const completed = totalDuration - timeLeft;
    return Math.min(100, Math.max(0, (completed / totalDuration) * 100));
  };

  const presets = [
    { label: "1 min", h: 0, m: 1, s: 0 },
    { label: "5 min", h: 0, m: 5, s: 0 },
    { label: "10 min", h: 0, m: 10, s: 0 },
    { label: "15 min", h: 0, m: 15, s: 0 },
    { label: "30 min", h: 0, m: 30, s: 0 },
    { label: "1 hour", h: 1, m: 0, s: 0 },
    { label: "2 hours", h: 2, m: 0, s: 0 },
    { label: "Pomodoro", h: 0, m: 25, s: 0 },
  ] as const;

  const disableStart = !isRunning && computeTotalSecondsFromInputs() <= 0 && timeLeft === 0;

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Input + Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Countdown Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours" className="text-xs sm:text-sm">
                Hours
              </Label>
              <Input
                id="hours"
                type="number"
                min={0}
                max={HOURS_MAX}
                inputMode="numeric"
                value={hours}
                onChange={(e) =>
                  setHours(sanitizeIntRange(e.target.value, 0, HOURS_MAX))
                }
                disabled={isRunning}
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes" className="text-xs sm:text-sm">
                Minutes
              </Label>
              <Input
                id="minutes"
                type="number"
                min={0}
                max={MINSEC_MAX}
                inputMode="numeric"
                value={minutes}
                onChange={(e) =>
                  setMinutes(
                    sanitizeIntRange(e.target.value, 0, MINSEC_MAX)
                  )
                }
                disabled={isRunning}
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seconds" className="text-xs sm:text-sm">
                Seconds
              </Label>
              <Input
                id="seconds"
                type="number"
                min={0}
                max={MINSEC_MAX}
                inputMode="numeric"
                value={seconds}
                onChange={(e) =>
                  setSeconds(
                    sanitizeIntRange(e.target.value, 0, MINSEC_MAX)
                  )
                }
                disabled={isRunning}
                maxLength={2}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sound-enabled"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="rounded"
              aria-label="Enable sound alert when timer finishes"
            />
            <Label
              htmlFor="sound-enabled"
              className="text-xs sm:text-sm cursor-pointer"
            >
              Enable sound alert
            </Label>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {!isRunning ? (
              <Button
                onClick={startTimer}
                className="flex items-center gap-2 w-full sm:w-auto"
                disabled={disableStart}
              >
                <Play className="h-4 w-4" />
                {timeLeft > 0 && computeTotalSecondsFromInputs() === totalDuration
                  ? "Resume"
                  : "Start Timer"}
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                variant="outline"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}

            <Button
              onClick={resetTimer}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timer Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-5 w-5" />
            Timer Display
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div
              className={`text-4xl sm:text-5xl md:text-6xl font-mono font-bold break-all ${
                showAlert ? "text-red-500 animate-pulse" : "text-primary"
              }`}
            >
              {formatTime(timeLeft)}
            </div>

            {isRunning && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {getProgressPercentage().toFixed(1)}% complete
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              {isRunning && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-xs sm:text-sm px-2 py-1"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Running
                </Badge>
              )}
              {showAlert && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1 text-xs sm:text-sm px-2 py-1"
                >
                  <Bell className="h-3 w-3" />
                  Time&apos;s Up!
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                disabled={isRunning}
                onClick={() => {
                  if (!isRunning) {
                    setHours(preset.h);
                    setMinutes(preset.m);
                    setSeconds(preset.s);
                    setTimeLeft(0);
                    setTotalDuration(0);
                    setShowAlert(false);
                    notify.success(`Preset ${preset.label} selected!`);
                  }
                }}
                className="text-xs sm:text-sm"
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

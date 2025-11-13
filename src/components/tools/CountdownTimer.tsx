import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Clock, Bell } from "lucide-react";
import { notify } from "@/lib/notify";

export const CountdownTimer = () => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const HOURS_MAX = 23;
  const MINSEC_MAX = 59;

  const sanitizeIntRange = (value: string, min: number, max: number) => {
    const n = parseInt(value.replace(/[^0-9-]/g, ""), 10);
    if (isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
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
    } else {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLeft, soundEnabled]);

  const playAlertSound = () => {
    // Create a simple beep sound using Web Audio API with a typed fallback for older browsers
    const AudioCtx = (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    ) as typeof AudioContext | undefined;

    if (!AudioCtx) {
      // Web Audio API not supported
      return;
    }

    const audioContext = new AudioCtx();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Clean up and close context shortly after
    setTimeout(() => {
      try {
        oscillator.disconnect();
        gainNode.disconnect();
        void audioContext.close();
      } catch {
        // ignore
      }
    }, 700);
  };

  const startTimer = () => {
    const inputTotalSeconds = hours * 3600 + minutes * 60 + seconds;

    // Resume if paused and there is remaining time
    if (!isRunning && timeLeft > 0) {
      // If inputs were changed to a different value, start a fresh countdown
      if (inputTotalSeconds > 0 && inputTotalSeconds !== totalDuration) {
        setTimeLeft(inputTotalSeconds);
        setTotalDuration(inputTotalSeconds);
      }
      setIsRunning(true);
      setShowAlert(false);
      notify.success("Timer started!");
      return;
    }

    // Start new countdown
    if (inputTotalSeconds <= 0) {
      notify.error("Please set a valid time!");
      return;
    }
    setTimeLeft(inputTotalSeconds);
    setTotalDuration(inputTotalSeconds);
    setIsRunning(true);
    setShowAlert(false);
    notify.success("Timer started!");
  };

  const pauseTimer = () => {
    setIsRunning(false);
    notify.success("Timer paused!");
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setTotalDuration(0);
    setShowAlert(false);
    notify.success("Timer reset!");
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (totalDuration === 0) return 0;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle>Countdown Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours" className="text-xs sm:text-sm">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                max={String(HOURS_MAX)}
                inputMode="numeric"
                value={hours}
                onChange={(e) => setHours(sanitizeIntRange(e.target.value, 0, HOURS_MAX))}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes" className="text-xs sm:text-sm">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max={String(MINSEC_MAX)}
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(sanitizeIntRange(e.target.value, 0, MINSEC_MAX))}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seconds" className="text-xs sm:text-sm">Seconds</Label>
              <Input
                id="seconds"
                type="number"
                min="0"
                max={String(MINSEC_MAX)}
                inputMode="numeric"
                value={seconds}
                onChange={(e) => setSeconds(sanitizeIntRange(e.target.value, 0, MINSEC_MAX))}
                disabled={isRunning}
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
            />
            <Label htmlFor="sound-enabled" className="text-xs sm:text-sm">Enable sound alert</Label>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {!isRunning ? (
              <Button onClick={startTimer} className="flex items-center gap-2 w-full sm:w-auto">
                <Play className="h-4 w-4" />
                {timeLeft > 0 ? 'Resume' : 'Start Timer'}
              </Button>
            ) : (
              <Button onClick={pauseTimer} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}
            <Button onClick={resetTimer} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-5 w-5" />
            Timer Display
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className={`text-4xl sm:text-5xl md:text-6xl font-mono font-bold break-all ${showAlert ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
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
                <Badge variant="outline" className="flex items-center gap-1 text-xs sm:text-sm px-2 py-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Running
                </Badge>
              )}
              {showAlert && (
                <Badge variant="destructive" className="flex items-center gap-1 text-xs sm:text-sm px-2 py-1">
                  <Bell className="h-3 w-3" />
                  Time's Up!
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[
              { label: "1 min", h: 0, m: 1, s: 0 },
              { label: "5 min", h: 0, m: 5, s: 0 },
              { label: "10 min", h: 0, m: 10, s: 0 },
              { label: "15 min", h: 0, m: 15, s: 0 },
              { label: "30 min", h: 0, m: 30, s: 0 },
              { label: "1 hour", h: 1, m: 0, s: 0 },
              { label: "2 hours", h: 2, m: 0, s: 0 },
              { label: "Pomodoro", h: 0, m: 25, s: 0 }
            ].map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!isRunning) {
                    setHours(preset.h);
                    setMinutes(preset.m);
                    setSeconds(preset.s);
                    notify.success(`Preset ${preset.label} selected!`);
                  }
                }}
                disabled={isRunning}
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

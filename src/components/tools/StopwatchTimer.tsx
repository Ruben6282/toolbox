import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";

export const StopwatchTimer = () => {
  /* ---------------------------------------------
     STATE (timestamp-based stopwatch — no drift)
  ---------------------------------------------- */
  const [elapsed, setElapsed] = useState(0);        // total ms accumulated
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);  // accumulated times
  const [lastLapStart, setLastLapStart] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);    // timestamp when started

  /* ---------------------------------------------
     EFFECT — precise high-resolution stopwatch
  ---------------------------------------------- */
 // Interval effect (must NOT depend on `elapsed`)
  useEffect(() => {
    if (isRunning) {
      startRef.current = performance.now() - elapsed;

      intervalRef.current = window.setInterval(() => {
        const now = performance.now();
        setElapsed(now - (startRef.current ?? now));
      }, 16);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  /* ---------------------------------------------
     ACTIONS
  ---------------------------------------------- */
  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);

  const reset = () => {
    pause();
    setElapsed(0);
    setLaps([]);
    setLastLapStart(0);
  };

  const addLap = () => {
    if (!isRunning) return;
    const lapTime = elapsed - lastLapStart;
    setLaps((prev) => [...prev, lapTime]);
    setLastLapStart(elapsed);
  };

  /* ---------------------------------------------
     FORMATTER
  ---------------------------------------------- */
  const format = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const millis = Math.floor((ms % 1000) / 10);

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}.${String(millis).padStart(2, "0")}`;
  };

  /* ---------------------------------------------
     LAP STATISTICS (memoized)
  ---------------------------------------------- */
  const stats = useMemo(() => {
    if (laps.length === 0) return null;

    const fastest = Math.min(...laps);
    const slowest = Math.max(...laps);
    const average = laps.reduce((a, b) => a + b, 0) / laps.length;

    return { fastest, slowest, average };
  }, [laps]);

  /* ---------------------------------------------
     RENDER
  ---------------------------------------------- */
  return (
    <div className="space-y-6 px-2 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle>Stopwatch Timer</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <div className="text-5xl sm:text-6xl font-mono font-bold text-blue-600 mb-4">
            {format(elapsed)}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-2">
            {!isRunning ? (
              <Button onClick={start} size="lg" className="w-full sm:w-auto">
                <Play className="h-4 w-4 mr-2" /> Start
              </Button>
            ) : (
              <Button
                onClick={pause}
                variant="destructive"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Pause className="h-4 w-4 mr-2" /> Pause
              </Button>
            )}

            <Button
              onClick={addLap}
              variant="outline"
              size="lg"
              disabled={!isRunning}
              className="w-full sm:w-auto"
            >
              <Flag className="h-4 w-4 mr-2" /> Lap
            </Button>

            <Button
              onClick={reset}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lap list */}
      {laps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lap Times</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {[...laps].reverse().map((lap, i) => {
              const index = laps.length - i;
              const isFastest = stats?.fastest === lap;
              const isSlowest = stats?.slowest === lap;

              return (
                <div
                  key={index}
                  className={`flex justify-between p-3 rounded-lg border ${
                    isFastest
                      ? "bg-green-50 border-green-200"
                      : isSlowest
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <span className="font-medium">Lap {index}</span>
                  <span className="font-mono text-lg">{format(lap)}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Lap Statistics</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {format(stats.fastest)}
                </div>
                <div className="text-xs text-muted-foreground">Fastest</div>
              </div>

              <div>
                <div className="text-2xl font-bold text-red-600">
                  {format(stats.slowest)}
                </div>
                <div className="text-xs text-muted-foreground">Slowest</div>
              </div>

              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {format(stats.average)}
                </div>
                <div className="text-xs text-muted-foreground">Average</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

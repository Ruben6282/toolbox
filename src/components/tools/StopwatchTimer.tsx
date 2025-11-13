import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Play, Pause, Square, RotateCcw, Flag } from "lucide-react";

export const StopwatchTimer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [lapTimes, setLapTimes] = useState<number[]>([]);
  const [lastLapTime, setLastLapTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 10);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      const id = intervalRef.current;
      if (id) {
        clearInterval(id);
      }
    };
  }, [isRunning]);

  const startStop = () => {
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setTime(0);
    setIsRunning(false);
    setLaps([]);
    setLapTimes([]);
    setLastLapTime(0);
  };

  const lap = () => {
    if (isRunning) {
      const currentLapTime = time - lastLapTime;
      setLaps(prev => [...prev, time]);
      setLapTimes(prev => [...prev, currentLapTime]);
      setLastLapTime(time);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getFastestLap = () => {
    if (lapTimes.length === 0) return null;
    return Math.min(...lapTimes);
  };

  const getSlowestLap = () => {
    if (lapTimes.length === 0) return null;
    return Math.max(...lapTimes);
  };

  const getAverageLap = () => {
    if (lapTimes.length === 0) return null;
    return lapTimes.reduce((sum, lap) => sum + lap, 0) / lapTimes.length;
  };

  const fastestLap = getFastestLap();
  const slowestLap = getSlowestLap();
  const averageLap = getAverageLap();

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle>Stopwatch Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl md:text-6xl font-mono font-bold text-blue-600 mb-4 break-all">
              {formatTime(time)}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-2 w-full">
              <Button
                onClick={startStop}
                variant={isRunning ? "destructive" : "default"}
                size="lg"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isRunning ? "Pause" : "Start"}
              </Button>
              
              <Button
                onClick={lap}
                variant="outline"
                size="lg"
                disabled={!isRunning}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Flag className="h-4 w-4" />
                Lap
              </Button>
              
              <Button
                onClick={reset}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {laps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lap Times</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...Array(laps.length)].map((_, idx) => {
                const i = laps.length - 1 - idx;
                const lapNumber = i + 1;
                const lapDuration = lapTimes[i];
                const isFastest = fastestLap === lapDuration;
                const isSlowest = slowestLap === lapDuration;

                return (
                  <div
                    key={i}
                    className={`flex flex-col xs:flex-row justify-between items-start xs:items-center p-3 rounded-lg border gap-2 ${
                      isFastest ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' :
                      isSlowest ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' :
                      'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm sm:text-base">Lap {lapNumber}</span>
                      {isFastest && <span className="text-green-600 dark:text-green-400 text-xs">Fastest</span>}
                      {isSlowest && <span className="text-red-600 dark:text-red-400 text-xs">Slowest</span>}
                    </div>
                    <div className="font-mono text-base sm:text-lg break-all">
                      {formatTime(lapDuration)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {laps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lap Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600 break-all">
                  {fastestLap ? formatTime(fastestLap) : "N/A"}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Fastest Lap</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-red-600 break-all">
                  {slowestLap ? formatTime(slowestLap) : "N/A"}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Slowest Lap</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 break-all">
                  {averageLap ? formatTime(averageLap) : "N/A"}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Average Lap</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Stopwatch Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>• Click "Start" to begin timing</li>
            <li>• Click "Lap" to record lap times while running</li>
            <li>• Click "Pause" to temporarily stop the timer</li>
            <li>• Click "Reset" to clear all times and start over</li>
            <li>• Lap times are highlighted: green for fastest, red for slowest</li>
            <li>• Use for timing workouts, races, or any timed activities</li>
            <li>• The timer shows minutes:seconds.milliseconds format</li>
            <li>• All lap data is cleared when you reset the stopwatch</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

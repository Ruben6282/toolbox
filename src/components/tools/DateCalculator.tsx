import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const DateCalculator = () => {
  // Format datetime for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [date1, setDate1] = useState(formatDateTime(new Date()));
  const [date2, setDate2] = useState(formatDateTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));

  const calculateDifference = () => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = Math.abs(d2.getTime() - d1.getTime());

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const totalSeconds = Math.floor(diff / 1000);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    return { days, hours, minutes, seconds, totalHours, totalMinutes, totalSeconds, weeks, months, years };
  };

  const diff = calculateDifference();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Date Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>First Date & Time</Label>
            <Input
              type="datetime-local"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Second Date & Time</Label>
            <Input
              type="datetime-local"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Primary metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Time Difference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{diff.days}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{diff.hours}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{diff.minutes}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Minutes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alternative Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-primary break-words">{diff.years}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Years</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-primary break-words">{diff.months}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Months</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-primary break-words">{diff.weeks}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Weeks</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-primary break-words">{diff.totalHours.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Hours</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-primary break-words">{diff.totalMinutes.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Minutes</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-primary break-words">{diff.totalSeconds.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Seconds</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Use */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Pick the first and second date & time using the inputs above</li>
            <li>• Time Difference shows full days plus remaining hours and minutes between the two moments</li>
            <li>• Alternative measurements include the same span as total hours, minutes, and seconds, plus weeks, months, and years</li>
            <li>• Weeks are 7-day blocks; months are approximated as 30 days; years as 365 days</li>
            <li>• The result is an absolute difference (order doesn’t matter) and uses your device’s timezone/clock</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Note: “Days” are counted as 24-hour blocks. Around daylight saving time changes, a calendar day can be 23 or 25 hours, so the breakdown reflects exact elapsed time, not calendar date boundaries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

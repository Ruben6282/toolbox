import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const TimestampConverter = () => {
  const [timestamp, setTimestamp] = useState(Date.now().toString());
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16));

  const timestampToDate = () => {
    try {
      const ts = parseInt(timestamp);
      const date = new Date(ts);
      setDateTime(date.toISOString().slice(0, 16));
      toast.success("Converted to date!");
    } catch (e) {
      toast.error("Invalid timestamp!");
    }
  };

  const dateToTimestamp = () => {
    try {
      const ts = new Date(dateTime).getTime();
      setTimestamp(ts.toString());
      toast.success("Converted to timestamp!");
    } catch (e) {
      toast.error("Invalid date!");
    }
  };

  const useCurrentTime = () => {
    const now = Date.now();
    setTimestamp(now.toString());
    setDateTime(new Date().toISOString().slice(0, 16));
    toast.success("Current time loaded!");
  };

  return (
    <div className="space-y-4">
      <Button onClick={useCurrentTime} className="w-full" variant="outline">
        Use Current Time
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Unix Timestamp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Timestamp (milliseconds)</Label>
            <Input
              type="text"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              placeholder="1234567890000"
            />
          </div>
          <Button onClick={timestampToDate} className="w-full">
            Convert to Date
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date & Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>
          <Button onClick={dateToTimestamp} className="w-full">
            Convert to Timestamp
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Timestamp:</span>
              <code className="font-mono">{Date.now()}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Date:</span>
              <code className="font-mono">{new Date().toLocaleString()}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

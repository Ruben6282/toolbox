import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";
import { Copy, RefreshCw } from "lucide-react";

const MIN_COUNT = 1;
const MAX_COUNT = 100;

export const UuidGenerator = () => {
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);

  const generateUuid = () => {
    // Use crypto.randomUUID if available, otherwise crypto.getRandomValues
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (typeof crypto !== "undefined" && crypto.getRandomValues) 
        ? crypto.getRandomValues(new Uint8Array(1))[0] % 16 
        : Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generate = () => {
    const clampedCount = Math.max(MIN_COUNT, Math.min(MAX_COUNT, count));
    const newUuids = Array.from({ length: clampedCount }, () => generateUuid());
    setUuids(newUuids);
  notify.success(`Generated ${clampedCount} UUID${clampedCount > 1 ? 's' : ''}!`);
  };

  const copyToClipboard = async (uuid: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(uuid);
        notify.success("UUID copied!");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = uuid;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        notify.success("UUID copied!");
      }
    } catch (err) {
      notify.error("Failed to copy!");
    }
  };

  const copyAll = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(uuids.join("\n"));
        notify.success("All UUIDs copied!");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = uuids.join("\n");
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        notify.success("All UUIDs copied!");
      }
    } catch (err) {
      notify.error("Failed to copy!");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate UUIDs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Number of UUIDs</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={MIN_COUNT}
              max={MAX_COUNT}
              value={count}
              onChange={(e) => {
                const val = parseInt(e.target.value) || MIN_COUNT;
                setCount(Math.max(MIN_COUNT, Math.min(MAX_COUNT, val)));
              }}
            />
          </div>
          <Button onClick={generate} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Generate
          </Button>
        </CardContent>
      </Card>

      {uuids.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated UUIDs</CardTitle>
              {uuids.length > 1 && (
                <Button onClick={copyAll} variant="outline" size="sm" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uuids.map((uuid, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border bg-secondary/50 p-3">
                  <code className="flex-1 font-mono text-sm">{uuid}</code>
                  <Button onClick={() => copyToClipboard(uuid)} variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

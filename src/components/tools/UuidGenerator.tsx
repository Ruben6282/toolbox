import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, RefreshCw } from "lucide-react";

export const UuidGenerator = () => {
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);

  const generateUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generate = () => {
    const newUuids = Array.from({ length: count }, () => generateUuid());
    setUuids(newUuids);
    toast.success(`Generated ${count} UUID${count > 1 ? 's' : ''}!`);
  };

  const copyToClipboard = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    toast.success("UUID copied!");
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join("\n"));
    toast.success("All UUIDs copied!");
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
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
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

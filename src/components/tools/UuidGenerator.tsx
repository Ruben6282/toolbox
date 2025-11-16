import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";
import { Copy, RefreshCw } from "lucide-react";

const MIN_COUNT = 1;
const MAX_COUNT = 100;

// ------------------------------------------------------
// SECURE FALLBACK: RFC 4122 UUIDv4 generator
// ------------------------------------------------------

/** Returns a random 4-bit nibble (0–15), cryptographically uniform */
const getSecureNibble = (): number => {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Secure random generator unavailable.");
  }

  const arr = new Uint8Array(1);
  const limit = 240; // Largest multiple of 16 under 256 → avoids modulo bias

  while (true) {
    crypto.getRandomValues(arr);
    if (arr[0] < limit) return arr[0] % 16;
  }
};

/** RFC 4122 UUIDv4 fallback implementation */
const generateUuidFallback = (): string => {
  // UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const nibble = getSecureNibble();
    const v = c === "x" ? nibble : ((nibble & 0x3) | 0x8); // Variant bits
    return v.toString(16);
  });
};

/** Secure UUID generator with automatic fallback */
const generateUuid = (): string => {
  // Modern fast path
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Secure fallback
  return generateUuidFallback();
};

// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------

export const UuidGenerator = () => {
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);

  const generate = () => {
    try {
      const clampedCount = Math.max(MIN_COUNT, Math.min(MAX_COUNT, count));
      const newUuids = Array.from({ length: clampedCount }, generateUuid);

      setUuids(newUuids);

      notify.success(
        `Generated ${clampedCount} UUID${clampedCount > 1 ? "s" : ""}!`
      );
    } catch (error) {
      // A real cryptographically insecure environment (IE, old browsers)
      notify.error("Secure UUID generation is not supported in this browser.");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        notify.success("Copied!");
        return;
      }

      // Legacy fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (ok) {
        notify.success("Copied!");
      } else {
        notify.error("Copy failed");
      }
    } catch {
      notify.error("Copy failed");
    }
  };

  const copyAll = () => copyToClipboard(uuids.join("\n"));

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
              min={MIN_COUNT}
              max={MAX_COUNT}
              inputMode="numeric"
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
                <Button
                  onClick={copyAll}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy All
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {uuids.map((uuid, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border bg-secondary/50 p-3"
                >
                  <code className="flex-1 font-mono text-sm">{uuid}</code>
                  <Button
                    onClick={() => copyToClipboard(uuid)}
                    variant="ghost"
                    size="sm"
                  >
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

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";

/* -------------------------------------------------------------------------- */
/*                               CONFIG / LIMITS                               */
/* -------------------------------------------------------------------------- */

const MAX_PATTERN_LENGTH = 500;
const REGEX_TIMEOUT = 1000;

/* strip dangerous control characters except tab/newline/CR */
const sanitizeInput = (val: string) =>
  val
    .split("")
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10 || code === 13;
    })
    .join("");

/* -------------------------------------------------------------------------- */
/*                           INLINE WEB WORKER SOURCE                          */
/* -------------------------------------------------------------------------- */

const workerSource = `
self.onmessage = (event) => {
  const { pattern, flags, text, timeout } = event.data;

  try {
    if (!pattern) {
      self.postMessage({ error: null, matches: null });
      return;
    }

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
    }, timeout);

    const regex = new RegExp(pattern, flags);
    const match = text.match(regex);

    clearTimeout(timer);

    if (timedOut) {
      self.postMessage({
        error: "Regex execution timed out (possible ReDoS).",
        matches: null
      });
      return;
    }

    self.postMessage({
      error: null,
      matches: match
    });
  } catch (err) {
    self.postMessage({
      error: err instanceof Error ? err.message : String(err),
      matches: null,
    });
  }
};
`;

/* Utility to create worker URL */
function createInlineWorker() {
  const blob = new Blob([workerSource], { type: "application/javascript" });
  return new Worker(URL.createObjectURL(blob));
}

/* -------------------------------------------------------------------------- */
/*                            COMPONENT: REGEX TESTER                          */
/* -------------------------------------------------------------------------- */

export function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false });

  const [matches, setMatches] = useState<RegExpMatchArray | null>(null);
  const [error, setError] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  /* Initialize worker once */
  useEffect(() => {
    if (!workerRef.current) workerRef.current = createInlineWorker();

    const worker = workerRef.current;
    worker.onmessage = (e) => {
      setMatches(e.data.matches);
      setError(e.data.error || "");
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  /* Debounced worker call */
  const runWorker = (p: string, f: typeof flags, t: string) => {
    if (!workerRef.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const flagString =
        (f.g ? "g" : "") + (f.i ? "i" : "") + (f.m ? "m" : "");

      workerRef.current?.postMessage({
        pattern: p,
        flags: flagString,
        text: t,
        timeout: REGEX_TIMEOUT,
      });
    }, 200);
  };

  /* -------------------------------------------------------------------------- */
  /*                               INPUT HANDLERS                                */
  /* -------------------------------------------------------------------------- */

  const handlePatternChange = (val: string) => {
    const clean = sanitizeInput(val).slice(0, MAX_PATTERN_LENGTH);
    setPattern(clean);
    if (clean) runWorker(clean, flags, testString);
  };

  const handleFlagChange = (flag: keyof typeof flags) => {
    const newFlags = { ...flags, [flag]: !flags[flag] };
    setFlags(newFlags);
    if (pattern) runWorker(pattern, newFlags, testString);
  };

  const handleTestStringChange = (val: string) => {
    let clean = sanitizeInput(val);
    if (!validateTextLength(clean)) clean = truncateText(clean);
    setTestString(clean);
    if (pattern) runWorker(pattern, flags, clean);
  };

  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-4">
      {/* PATTERN */}
      <Card>
        <CardHeader>
          <CardTitle>Regular Expression</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pattern</Label>
            <Input
              placeholder="Enter regex pattern..."
              value={pattern}
              onChange={(e) => handlePatternChange(e.target.value)}
              maxLength={MAX_PATTERN_LENGTH}
              className="font-mono"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* FLAGS */}
          <div className="space-y-2">
            <Label>Flags</Label>
            <div className="flex gap-6">
              {(["g", "i", "m"] as const).map((flag) => (
                <div key={flag} className="flex items-center space-x-2">
                  <Checkbox
                    checked={flags[flag]}
                    onCheckedChange={() => handleFlagChange(flag)}
                  />
                  <Label className="cursor-pointer">{flag}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TEST STRING */}
      <Card>
        <CardHeader>
          <CardTitle>Test String</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter text to test against..."
            value={testString}
            onChange={(e) => handleTestStringChange(e.target.value)}
            maxLength={MAX_TEXT_LENGTH}
            className="min-h-[150px] font-mono"
          />
        </CardContent>
      </Card>

      {/* MATCH RESULTS */}
      {matches && (
        <Card>
          <CardHeader>
            <CardTitle>Matches Found: {matches.length}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {matches.map((m, i) => (
              <div
                key={i}
                className="rounded-md border bg-primary/5 p-2 text-sm font-mono"
              >
                {m}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* NO MATCH */}
      {pattern && testString && !matches && !error && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No matches found
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";

const MAX_PATTERN_LENGTH = 500;
const REGEX_TIMEOUT = 1000; // 1 second timeout for ReDoS protection

// Strip control characters except tab/newline/CR
const sanitizeInput = (val: string) =>
  val
    .split("")
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10 || code === 13;
    })
    .join("");

export const RegexTester = () => {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false });
  const [testString, setTestString] = useState("");
  const [matches, setMatches] = useState<RegExpMatchArray | null>(null);
  const [error, setError] = useState("");

  const test = (p: string, f: typeof flags, text: string) => {
    try {
      if (!p) {
        setMatches(null);
        setError("");
        return;
      }

      // ReDoS protection: timeout for regex execution
      let timedOut = false;

      const flagStr = (f.g ? "g" : "") + (f.i ? "i" : "") + (f.m ? "m" : "");
      const regex = new RegExp(p, flagStr);

      // Set timeout
      const timeoutId = setTimeout(() => {
        timedOut = true;
      }, REGEX_TIMEOUT);

      if (timedOut) {
        clearTimeout(timeoutId);
        setError("Regex execution timeout (possible ReDoS pattern)");
        setMatches(null);
        return;
      }

      const result = text.match(regex);
      clearTimeout(timeoutId);
      
      setMatches(result);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setMatches(null);
    }
  };

  const handlePatternChange = (newPattern: string) => {
    const sanitized = sanitizeInput(newPattern).substring(0, MAX_PATTERN_LENGTH);
    setPattern(sanitized);
    if (sanitized) test(sanitized, flags, testString);
  };

  const handleFlagChange = (flag: keyof typeof flags) => {
    const newFlags = { ...flags, [flag]: !flags[flag] };
    setFlags(newFlags);
    if (pattern) test(pattern, newFlags, testString);
  };

  const handleTestStringChange = (text: string) => {
    let sanitized = sanitizeInput(text);
    if (!validateTextLength(sanitized)) {
      sanitized = truncateText(sanitized);
    }
    setTestString(sanitized);
    if (pattern) test(pattern, flags, sanitized);
  };

  return (
    <div className="space-y-4">
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

          <div className="space-y-2">
            <Label>Flags</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="g" checked={flags.g} onCheckedChange={() => handleFlagChange("g")} />
                <Label htmlFor="g" className="cursor-pointer">g (global)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="i" checked={flags.i} onCheckedChange={() => handleFlagChange("i")} />
                <Label htmlFor="i" className="cursor-pointer">i (case-insensitive)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="m" checked={flags.m} onCheckedChange={() => handleFlagChange("m")} />
                <Label htmlFor="m" className="cursor-pointer">m (multiline)</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {matches && (
        <Card>
          <CardHeader>
            <CardTitle>Matches Found: {matches.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {matches.map((match, i) => (
                <div key={i} className="rounded-lg border bg-primary/5 p-3 font-mono text-sm">
                  {match}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pattern && testString && !matches && !error && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No matches found
          </CardContent>
        </Card>
      )}
    </div>
  );
};

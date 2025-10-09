import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const RegexTester = () => {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false });
  const [testString, setTestString] = useState("");
  const [matches, setMatches] = useState<RegExpMatchArray | null>(null);
  const [error, setError] = useState("");

  const test = (p: string, f: typeof flags, text: string) => {
    try {
      const flagStr = (f.g ? "g" : "") + (f.i ? "i" : "") + (f.m ? "m" : "");
      const regex = new RegExp(p, flagStr);
      const result = text.match(regex);
      setMatches(result);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setMatches(null);
    }
  };

  const handlePatternChange = (newPattern: string) => {
    setPattern(newPattern);
    if (newPattern) test(newPattern, flags, testString);
  };

  const handleFlagChange = (flag: keyof typeof flags) => {
    const newFlags = { ...flags, [flag]: !flags[flag] };
    setFlags(newFlags);
    if (pattern) test(pattern, newFlags, testString);
  };

  const handleTestStringChange = (text: string) => {
    setTestString(text);
    if (pattern) test(pattern, flags, text);
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

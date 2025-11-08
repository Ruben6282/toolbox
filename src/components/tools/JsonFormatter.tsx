import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";

export const JsonFormatter = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const formatJson = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError("");
  notify.success("JSON formatted successfully!");
    } catch (e) {
      setError((e as Error).message);
  notify.error("Invalid JSON!");
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError("");
  notify.success("JSON minified!");
    } catch (e) {
      setError((e as Error).message);
  notify.error("Invalid JSON!");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  notify.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Input JSON</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder='{"key": "value"}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px] font-mono"
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={formatJson}>Format</Button>
        <Button onClick={minifyJson} variant="secondary">Minify</Button>
        {output && <Button onClick={copyToClipboard} variant="outline">Copy Output</Button>}
      </div>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={output} readOnly className="min-h-[300px] font-mono" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

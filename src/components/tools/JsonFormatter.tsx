import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";

// Strip control characters except tab, newline, CR
const sanitizeInput = (val: string) =>
  val
    .split("")
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10 || code === 13;
    })
    .join("");

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      notify.success("Copied to clipboard!");
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = output;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        notify.success("Copied to clipboard!");
      } catch {
        notify.error("Failed to copy");
      }
      document.body.removeChild(textarea);
    }
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
            onChange={(e) => {
              let val = e.target.value;
              if (!validateTextLength(val)) {
                val = truncateText(val);
              }
              setInput(sanitizeInput(val));
            }}
            maxLength={MAX_TEXT_LENGTH}
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

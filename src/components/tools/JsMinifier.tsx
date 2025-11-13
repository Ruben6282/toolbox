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

export const JsMinifier = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const minify = () => {
    if (!input.trim()) {
      notify.error("Please enter some JavaScript!");
      return;
    }

    // Validate and truncate if needed
    let code = input;
    if (!validateTextLength(code)) {
      code = truncateText(code);
      notify.warning(`Input truncated to ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
    }

  const minified = code
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
      .replace(/\/\/.*/g, "") // Remove single-line comments
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\s*([{}();,:])\s*/g, "$1") // Remove spaces around special characters
      .replace(/;\s*}/g, "}") // Remove last semicolon before closing brace
      .trim();

    setOutput(minified);
    const savings = ((1 - minified.length / input.length) * 100).toFixed(1);
  notify.success(`JavaScript minified! ${savings}% reduction`);
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
          <CardTitle>Input JavaScript</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter JavaScript code..."
            value={input}
            onChange={(e) => {
              let val = e.target.value;
              if (!validateTextLength(val)) {
                val = truncateText(val);
              }
              setInput(sanitizeInput(val));
            }}
            maxLength={MAX_TEXT_LENGTH}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="mt-2 text-sm text-muted-foreground">
            Size: {input.length} characters
          </div>
        </CardContent>
      </Card>

      <Button onClick={minify} className="w-full">Minify JavaScript</Button>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Minified JavaScript
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                Copy
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={output}
              readOnly
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="mt-2 text-sm text-muted-foreground">
              Size: {output.length} characters
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

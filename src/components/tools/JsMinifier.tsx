import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import {
  validateTextLength,
  truncateText,
  MAX_TEXT_LENGTH,
} from "@/lib/security";
import { minifyJs } from "@/lib/js-minifier";

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

  const handleInputChange = (value: string) => {
    let val = sanitizeInput(value);
    if (!validateTextLength(val)) {
      val = truncateText(val);
      notify.warning(
        `Input truncated to ${MAX_TEXT_LENGTH.toLocaleString()} characters`
      );
    }
    setInput(val);
  };

  const minify = () => {
    const original = input;
    const src = original.trim();

    if (!src) {
      notify.error("Please enter some JavaScript!");
      return;
    }

    try {
      let code = original;

      if (!validateTextLength(code)) {
        code = truncateText(code);
        notify.warning(
          `Input truncated to ${MAX_TEXT_LENGTH.toLocaleString()} characters`
        );
      }

      const minified = minifyJs(code);
      setOutput(minified);

      const originalLen = code.length;
      const minifiedLen = minified.length;
      const savings =
        originalLen > 0
          ? ((1 - minifiedLen / originalLen) * 100).toFixed(1)
          : "0.0";

      notify.success(`JavaScript minified! ${savings}% reduction`);
    } catch (e) {
      console.error("JS minify error", e);
      notify.error("Failed to minify JavaScript");
    }
  };

  const copyToClipboard = async () => {
    if (!output) {
      notify.error("Nothing to copy yet.");
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(output);
        notify.success("Copied to clipboard!");
      } else {
        // Fallback for older browsers / non-secure context
        const textarea = document.createElement("textarea");
        textarea.value = output;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (ok) {
          notify.success("Copied to clipboard!");
        } else {
          notify.error("Failed to copy");
        }
      }
    } catch (err) {
      console.error("Copy failed", err);
      notify.error("Failed to copy to clipboard");
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
            onChange={(e) => handleInputChange(e.target.value)}
            maxLength={MAX_TEXT_LENGTH}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="mt-2 text-sm text-muted-foreground">
            Size: {input.length} characters
          </div>
        </CardContent>
      </Card>

      <Button onClick={minify} className="w-full">
        Minify JavaScript
      </Button>

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

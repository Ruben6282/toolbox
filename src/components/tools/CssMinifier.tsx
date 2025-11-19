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
import { minifyCss } from "@/lib/css-minifier";

export const CssMinifier = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleInputChange = (value: string) => {
    // Strip control chars except tab/newline/CR
    const cleaned = Array.from(value)
      .filter((ch) => {
        const code = ch.charCodeAt(0);
        return (
          code === 9 ||
          code === 10 ||
          code === 13 ||
          (code >= 0x20 && code !== 0x7f)
        );
      })
      .join("");

    if (!validateTextLength(cleaned)) {
      notify.error(
        `Input too long. Max ${MAX_TEXT_LENGTH.toLocaleString()} characters`
      );
      setInput(truncateText(cleaned));
      return;
    }

    setInput(cleaned);
  };

  const minify = () => {
    const src = input.trim();
    if (!src) {
      notify.error("Please enter some CSS!");
      return;
    }

    try {
      const minified = minifyCss(src);
      setOutput(minified);

      const originalLen = input.length;
      const minifiedLen = minified.length;
      const savings =
        originalLen > 0
          ? ((1 - minifiedLen / originalLen) * 100).toFixed(1)
          : "0.0";

      notify.success(`CSS minified! ${savings}% reduction`);
    } catch (e) {
      console.error("CSS minify error", e);
      notify.error("Failed to minify CSS");
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
        const ta = document.createElement("textarea");
        ta.value = output;
        ta.style.position = "fixed";
        ta.style.left = "-999999px";
        ta.style.top = "-999999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) {
          notify.success("Copied to clipboard!");
        } else {
          notify.error("Copy failed");
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
          <CardTitle>Input CSS</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter CSS code..."
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            maxLength={MAX_TEXT_LENGTH}
          />
          <div className="mt-2 text-sm text-muted-foreground">
            Size: {input.length} characters
          </div>
        </CardContent>
      </Card>

      <Button onClick={minify} className="w-full">
        Minify CSS
      </Button>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Minified CSS
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

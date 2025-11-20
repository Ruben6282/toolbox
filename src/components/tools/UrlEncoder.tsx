import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";

// Strip control characters except TAB/NL/CR
const sanitize = (val: string) =>
  val
    .split("")
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10 || code === 13;
    })
    .join("");

export const UrlEncoder = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let text = sanitize(e.target.value);

    if (!validateTextLength(text)) {
      notify.error(
        `Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`
      );
      text = truncateText(text);
    }

    setInput(text);
  };

  const encode = () => {
    try {
      const encoded = encodeURIComponent(input);
      setOutput(encoded);
      notify.success("URL encoded!");
    } catch {
      notify.error("Encoding failed!");
    }
  };

  const decode = () => {
    try {
      const decoded = decodeURIComponent(input);
      setOutput(decoded);
      notify.success("URL decoded!");
    } catch {
      notify.error("Decoding failed! Invalid encoded URL.");
    }
  };

  const copyToClipboard = async () => {
    if (!output) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(output);
        notify.success("Copied to clipboard!");
        return;
      }

      const ta = document.createElement("textarea");
      ta.value = output;
      ta.style.position = "fixed";
      ta.style.left = "-999999px";
      ta.style.opacity = "0"; // production-quality improvement
      document.body.appendChild(ta);

      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);

      notify[ok ? "success" : "error"](ok ? "Copied!" : "Failed to copy!");
    } catch (err) {
      console.error("Fallback copy failed:", err);
      notify.error("Failed to copy to clipboard!");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Input URL</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter URL or text to encode/decode..."
            value={input}
            onChange={handleInputChange}
            className="min-h-[150px]"
            maxLength={MAX_TEXT_LENGTH}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={encode} className="w-full sm:w-auto">Encode</Button>
        <Button onClick={decode} variant="secondary" className="w-full sm:w-auto">Decode</Button>
        {output && (
          <Button
            onClick={copyToClipboard}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Copy Output
          </Button>
        )}
      </div>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={output} readOnly className="min-h-[150px]" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

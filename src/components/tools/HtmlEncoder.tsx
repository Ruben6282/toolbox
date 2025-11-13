import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";

// Strip control chars from input
const sanitizeInput = (text: string): string => {
  return text.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code >= 32 || code === 9 || code === 10 || code === 13;
  }).join('');
};

export const HtmlEncoder = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const encode = () => {
    const encoded = input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    setOutput(encoded);
  notify.success("HTML encoded!");
  };

  const decode = () => {
    const decoded = input
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    setOutput(decoded);
  notify.success("HTML decoded!");
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(output);
        notify.success("Copied to clipboard!");
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = output;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          notify.success("Copied to clipboard!");
        } else {
          notify.error("Failed to copy");
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      notify.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Input HTML</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter HTML to encode/decode..."
            value={input}
            onChange={(e) => {
              const cleaned = sanitizeInput(e.target.value);
              if (!validateTextLength(cleaned)) {
                notify.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
                setInput(truncateText(cleaned));
              } else {
                setInput(cleaned);
              }
            }}
            className="min-h-[150px] font-mono"
            maxLength={MAX_TEXT_LENGTH}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={encode}>Encode</Button>
        <Button onClick={decode} variant="secondary">Decode</Button>
        {output && <Button onClick={copyToClipboard} variant="outline">Copy Output</Button>}
      </div>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={output} readOnly className="min-h-[150px] font-mono" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

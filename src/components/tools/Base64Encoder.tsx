import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";

export const Base64Encoder = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (!validateTextLength(value)) {
      notify.error(`Input exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
      setInput(truncateText(value));
      return;
    }
    setInput(value);
  };

  const encode = () => {
    try {
      const encoded = btoa(input);
      setOutput(encoded);
      notify.success("Encoded to Base64!");
    } catch (e) {
      notify.error("Encoding failed!");
    }
  };

  const decode = () => {
    try {
      const decoded = atob(input);
      setOutput(decoded);
      notify.success("Decoded from Base64!");
    } catch (e) {
      notify.error("Decoding failed! Invalid Base64 string.");
    }
  };

  const copyToClipboard = async () => {
    try {
      if (!output) return;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(output);
      } else {
        // Fallback for older browsers
        const ta = document.createElement("textarea");
        ta.value = output;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      notify.success("Copied to clipboard!");
    } catch {
      notify.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter text to encode/decode..."
            value={input}
            onChange={handleChange}
            className="min-h-[150px]"
          />
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={encode} className="w-full sm:w-auto">Encode</Button>
        <Button onClick={decode} variant="secondary" className="w-full sm:w-auto">Decode</Button>
        {output && <Button onClick={copyToClipboard} variant="outline" className="w-full sm:w-auto">Copy Output</Button>}
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

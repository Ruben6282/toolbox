import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";

/* ------------------------------------------------------------- */
/*                           UTF-8 SAFE BASE64                    */
/* ------------------------------------------------------------- */

const encodeBase64 = (input: string): string => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const decodeBase64 = (input: string): string => {
  const decoded = atob(input);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
};

/* ------------------------------------------------------------- */

export const Base64Encoder = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    if (!validateTextLength(value)) {
      notify.error(
        `Input exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`
      );
      value = truncateText(value);
    }

    setInput(value);
  };

  const encode = () => {
    try {
      const encoded = encodeBase64(input);
      setOutput(encoded);
      notify.success("Encoded to Base64!");
    } catch (e) {
      notify.error("Encoding failed.");
    }
  };

  const decode = () => {
    try {
      const decoded = decodeBase64(input);
      setOutput(decoded);
      notify.success("Decoded from Base64!");
    } catch (e) {
      notify.error("Decoding failed. Invalid Base64 input.");
    }
  };

  const copyToClipboard = async () => {
    try {
      if (!output) return;

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(output);
      } else {
        const ta = document.createElement("textarea");
        ta.value = output;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("Copy failed");
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
        <Button
          onClick={encode}
          className="w-full sm:w-auto"
          disabled={!input}
        >
          Encode
        </Button>

        <Button
          onClick={decode}
          variant="secondary"
          className="w-full sm:w-auto"
          disabled={!input}
        >
          Decode
        </Button>

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
            <Textarea
              value={output}
              readOnly
              className="min-h-[150px] font-mono"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { notify } from "@/lib/notify";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH, sanitizeText } from "@/lib/security";

export const BinaryToText = () => {
  const [binary, setBinary] = useState("");
  const [text, setText] = useState("");
  // Per-tool constraints to avoid heavy processing
  const MAX_GROUPS = 10000; // limit number of binary groups processed in one go
  const GROUP_BITS = 8;     // enforce 8-bit groups (standard byte-based binary text)

  const handleBinaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Allow only 0/1 and whitespace; strip other characters eagerly
    const newText = e.target.value.replace(/[^01\s]/g, "");
    
    if (!validateTextLength(newText)) {
      notify.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
      setBinary(truncateText(newText));
      return;
    }
    
    setBinary(newText);
  };

  const convertToText = () => {
    try {
      // Sanitize input before conversion and validate 8-bit groups
      const sanitized = sanitizeText(binary);
      const binaryArray = sanitized.trim().split(/\s+/).filter(Boolean);
      if (binaryArray.length > MAX_GROUPS) {
        notify.error(`Too many groups. Please limit to ${MAX_GROUPS.toLocaleString()} binary bytes.`);
        return;
      }

      for (const token of binaryArray) {
        if (!/^[01]{1,8}$/.test(token)) {
          notify.error(`Invalid binary token: "${token}". Use 1–8 bits per group separated by spaces.`);
          return;
        }
      }

      const chars: string[] = [];
      for (const bin of binaryArray) {
        const decimal = parseInt(bin, 2);
        // Constrain to 0–255 for byte-based text
        const code = Math.max(0, Math.min(255, decimal));
        chars.push(String.fromCharCode(code));
      }
      const textResult = chars.join("");
      setText(sanitizeText(textResult));
      notify.success("Binary converted to text!");
    } catch (error) {
      notify.error("Invalid binary format");
    }
  };

  const copyToClipboard = async () => {
    try {
      // Modern approach - works on most browsers including mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        notify.success("Text copied to clipboard!");
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            notify.success("Text copied to clipboard!");
          } else {
            notify.error("Failed to copy!");
          }
        } catch (err) {
          console.error('Fallback: Failed to copy', err);
          notify.error("Failed to copy to clipboard!");
        }
        
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      notify.error("Failed to copy to clipboard!");
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Binary to Text Converter</CardTitle>
        <CardDescription>Convert binary code to readable text</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="binary">Binary Input (space-separated)</Label>
          <Textarea
            id="binary"
            placeholder="01001000 01100101 01101100 01101100 01101111"
            value={binary}
            onChange={handleBinaryChange}
            className="min-h-[100px] font-mono"
            maxLength={MAX_TEXT_LENGTH}
          />
        </div>

        <Button onClick={convertToText} className="w-full">
          Convert to Text
        </Button>

        {text && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Text Output</Label>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            <Textarea
              value={text}
              readOnly
              className="min-h-[100px]"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
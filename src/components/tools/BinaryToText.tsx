import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { notify } from "@/lib/notify";

export const BinaryToText = () => {
  const [binary, setBinary] = useState("");
  const [text, setText] = useState("");

  const convertToText = () => {
    try {
      const binaryArray = binary.trim().split(/\s+/);
      const textResult = binaryArray
        .map(bin => {
          const decimal = parseInt(bin, 2);
          return String.fromCharCode(decimal);
        })
        .join("");
      setText(textResult);
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
            onChange={(e) => setBinary(e.target.value)}
            className="min-h-[100px] font-mono"
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
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { notify } from "@/lib/notify";

export const TextToBinary = () => {
  const [text, setText] = useState("");
  const [binary, setBinary] = useState("");

  const convertToBinary = () => {
    const binaryResult = text
      .split("")
      .map(char => char.charCodeAt(0).toString(2).padStart(8, "0"))
      .join(" ");
    setBinary(binaryResult);
    notify.success("Text converted to binary!");
  };

  const copyToClipboard = async () => {
    try {
      // Modern approach - works on most browsers including mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(binary);
        notify.success("Binary copied to clipboard!");
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement("textarea");
        textArea.value = binary;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            notify.success("Binary copied to clipboard!");
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
        <CardTitle>Text to Binary Converter</CardTitle>
        <CardDescription>Convert text to binary code</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="text">Text Input</Label>
          <Textarea
            id="text"
            placeholder="Enter text to convert to binary"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <Button onClick={convertToBinary} className="w-full">
          Convert to Binary
        </Button>

        {binary && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Binary Output</Label>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            <Textarea
              value={binary}
              readOnly
              className="min-h-[150px] font-mono text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
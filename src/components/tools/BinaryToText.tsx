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
    } catch (error) {
      notify.error("Invalid binary format");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    notify.success("Copied to clipboard!");
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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

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
    toast.success("HTML encoded!");
  };

  const decode = () => {
    const decoded = input
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    setOutput(decoded);
    toast.success("HTML decoded!");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
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
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono"
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

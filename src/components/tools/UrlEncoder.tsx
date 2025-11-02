import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const UrlEncoder = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const encode = () => {
    const encoded = encodeURIComponent(input);
    setOutput(encoded);
    toast.success("URL encoded!");
  };

  const decode = () => {
    try {
      const decoded = decodeURIComponent(input);
      setOutput(decoded);
      toast.success("URL decoded!");
    } catch (e) {
      toast.error("Decoding failed! Invalid encoded URL.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
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
            onChange={(e) => setInput(e.target.value)}
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

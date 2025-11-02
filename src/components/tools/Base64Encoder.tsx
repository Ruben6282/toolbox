import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Base64Encoder = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const encode = () => {
    try {
      const encoded = btoa(input);
      setOutput(encoded);
      toast.success("Encoded to Base64!");
    } catch (e) {
      toast.error("Encoding failed!");
    }
  };

  const decode = () => {
    try {
      const decoded = atob(input);
      setOutput(decoded);
      toast.success("Decoded from Base64!");
    } catch (e) {
      toast.error("Decoding failed! Invalid Base64 string.");
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
          <CardTitle>Input</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter text to encode/decode..."
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

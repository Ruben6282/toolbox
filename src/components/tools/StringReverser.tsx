import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const StringReverser = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const reverse = () => {
    const reversed = input.split("").reverse().join("");
    setOutput(reversed);
    toast.success("Text reversed!");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter text to reverse..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px]"
          />
        </CardContent>
      </Card>

      <Button onClick={reverse} className="w-full">Reverse Text</Button>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Reversed Text
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                Copy
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={output} readOnly className="min-h-[150px]" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const DuplicateRemover = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const removeDuplicates = () => {
    const lines = input.split("\n");
    const uniqueLines = Array.from(new Set(lines));
    setOutput(uniqueLines.join("\n"));
    const removed = lines.length - uniqueLines.length;
    toast.success(`Removed ${removed} duplicate line${removed !== 1 ? "s" : ""}!`);
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
            placeholder="Enter text with duplicate lines..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px]"
          />
        </CardContent>
      </Card>

      <Button onClick={removeDuplicates} className="w-full">Remove Duplicate Lines</Button>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Unique Lines
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                Copy
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={output} readOnly className="min-h-[200px]" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

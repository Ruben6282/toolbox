import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";

export const WhitespaceRemover = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const removeWhitespace = () => {
    const cleaned = input
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/^\s+|\s+$/gm, "") // Remove leading/trailing spaces from each line
      .trim();
    setOutput(cleaned);
  notify.success("Extra whitespace removed!");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  notify.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter text with extra whitespace..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px]"
          />
        </CardContent>
      </Card>

      <Button onClick={removeWhitespace} className="w-full">Remove Extra Whitespace</Button>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Cleaned Text
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

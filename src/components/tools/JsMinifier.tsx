import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const JsMinifier = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const minify = () => {
    if (!input.trim()) {
      toast.error("Please enter some JavaScript!");
      return;
    }

    let minified = input
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
      .replace(/\/\/.*/g, "") // Remove single-line comments
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\s*([{}();,:])\s*/g, "$1") // Remove spaces around special characters
      .replace(/;\s*}/g, "}") // Remove last semicolon before closing brace
      .trim();

    setOutput(minified);
    const savings = ((1 - minified.length / input.length) * 100).toFixed(1);
    toast.success(`JavaScript minified! ${savings}% reduction`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Input JavaScript</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter JavaScript code..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="mt-2 text-sm text-muted-foreground">
            Size: {input.length} characters
          </div>
        </CardContent>
      </Card>

      <Button onClick={minify} className="w-full">Minify JavaScript</Button>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Minified JavaScript
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                Copy
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={output}
              readOnly
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="mt-2 text-sm text-muted-foreground">
              Size: {output.length} characters
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

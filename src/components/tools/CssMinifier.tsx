import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";

export const CssMinifier = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const minify = () => {
    if (!input.trim()) {
      notify.error("Please enter some CSS!");
      return;
    }

  const minified = input
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\s*([{}:;,])\s*/g, "$1") // Remove spaces around special characters
      .replace(/;}/g, "}") // Remove last semicolon before closing brace
      .trim();

    setOutput(minified);
    const savings = ((1 - minified.length / input.length) * 100).toFixed(1);
  notify.success(`CSS minified! ${savings}% reduction`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  notify.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Input CSS</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter CSS code..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="mt-2 text-sm text-muted-foreground">
            Size: {input.length} characters
          </div>
        </CardContent>
      </Card>

      <Button onClick={minify} className="w-full">Minify CSS</Button>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Minified CSS
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

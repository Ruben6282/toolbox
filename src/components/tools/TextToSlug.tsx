import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";

export const TextToSlug = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const generateSlug = () => {
    const slug = input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setOutput(slug);
  notify.success("Slug generated!");
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
          <Input
            placeholder="Enter text to convert to slug..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </CardContent>
      </Card>

      <Button onClick={generateSlug} className="w-full">Generate Slug</Button>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              URL Slug
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                Copy
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="block p-4 bg-muted rounded-lg break-all">{output}</code>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

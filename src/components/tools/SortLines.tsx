import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export const SortLines = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [order, setOrder] = useState("asc");

  const sortLines = () => {
    const lines = input.split("\n");
    const sorted = lines.sort((a, b) => {
      if (order === "asc") {
        return a.localeCompare(b);
      } else {
        return b.localeCompare(a);
      }
    });
    setOutput(sorted.join("\n"));
    toast.success("Lines sorted!");
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
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter text lines to sort..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px]"
          />
          
          <div>
            <Label>Sort Order</Label>
            <RadioGroup value={order} onValueChange={setOrder} className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="asc" id="asc" />
                <Label htmlFor="asc">Ascending (A-Z)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="desc" id="desc" />
                <Label htmlFor="desc">Descending (Z-A)</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Button onClick={sortLines} className="w-full">Sort Lines</Button>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Sorted Lines
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

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH, sanitizeText } from "@/lib/security";

export const SortLines = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [order, setOrder] = useState("asc");

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    if (!validateTextLength(newText)) {
      notify.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
      setInput(truncateText(newText));
      return;
    }
    
    setInput(newText);
  };

  const sortLines = () => {
    // Sanitize input before sorting
    const sanitized = sanitizeText(input);
    const lines = sanitized.split("\n");
    const sorted = lines.sort((a, b) => {
      if (order === "asc") {
        return a.localeCompare(b);
      } else {
        return b.localeCompare(a);
      }
    });
    setOutput(sorted.join("\n"));
  notify.success("Lines sorted!");
  };

  const copyToClipboard = async () => {
    try {
      // Modern approach - works on most browsers including mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(output);
        notify.success("Copied to clipboard!");
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement("textarea");
        textArea.value = output;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            notify.success("Copied to clipboard!");
          } else {
            notify.error("Failed to copy!");
          }
        } catch (err) {
          console.error('Fallback: Failed to copy', err);
          notify.error("Failed to copy to clipboard!");
        }
        
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      notify.error("Failed to copy to clipboard!");
    }
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
            onChange={handleInputChange}
            className="min-h-[200px]"
            maxLength={MAX_TEXT_LENGTH}
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

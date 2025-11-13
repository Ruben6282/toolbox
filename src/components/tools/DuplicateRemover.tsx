import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";

// Strip control characters except tab/newline/CR to prevent hidden duplicates
const stripControlChars = (text: string): string => {
  return text.split('').filter(char => {
    const code = char.charCodeAt(0);
    // Keep printable chars, tab (9), newline (10), carriage return (13)
    return code >= 32 || code === 9 || code === 10 || code === 13;
  }).join('');
};

export const DuplicateRemover = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const cleaned = stripControlChars(e.target.value);
    
    if (!validateTextLength(cleaned)) {
      notify.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
      setInput(truncateText(cleaned));
      return;
    }
    
    setInput(cleaned);
  };

  const removeDuplicates = () => {
    const lines = input.split("\n");
    // Trim whitespace from each line before deduplication for more accurate results
    const trimmedLines = lines.map(line => line.trim());
    const uniqueLines = Array.from(new Set(trimmedLines));
    const cleaned = uniqueLines.join("\n");
    setOutput(truncateText(cleaned)); // Enforce output cap
    const removed = lines.length - uniqueLines.length;
    notify.success(`Removed ${removed} duplicate line${removed !== 1 ? "s" : ""}!`);
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
        <CardContent>
          <Textarea
            placeholder="Enter text with duplicate lines..."
            value={input}
            onChange={handleInputChange}
            className="min-h-[200px]"
            maxLength={MAX_TEXT_LENGTH}
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

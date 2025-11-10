import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";

export const WhitespaceRemover = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    if (!validateTextLength(newText)) {
      notify.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
      setInput(truncateText(newText));
      return;
    }
    
    setInput(newText);
  };

  const removeWhitespace = () => {
    const cleaned = input
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/^\s+|\s+$/gm, "") // Remove leading/trailing spaces from each line
      .trim();
    setOutput(cleaned);
  notify.success("Extra whitespace removed!");
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
            placeholder="Enter text with extra whitespace..."
            value={input}
            onChange={handleInputChange}
            className="min-h-[150px]"
            maxLength={MAX_TEXT_LENGTH}
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

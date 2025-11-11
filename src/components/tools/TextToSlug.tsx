"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH, sanitizeText } from "@/lib/security";

export const TextToSlug = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    
    if (!validateTextLength(newText)) {
      notify.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
      setInput(truncateText(newText));
      return;
    }
    
    setInput(newText);
  };

  const generateSlug = () => {
    // Sanitize input before slug generation
    const sanitized = sanitizeText(input);
    const slug = sanitized
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setOutput(slug);
  notify.success("Slug generated!");
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
          <Input
            placeholder="Enter text to convert to slug..."
            value={input}
            onChange={handleInputChange}
            maxLength={MAX_TEXT_LENGTH}
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

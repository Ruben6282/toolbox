import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";

export const CaseConverter = () => {
  const [text, setText] = useState("");

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    if (!validateTextLength(newText)) {
      notify.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
      setText(truncateText(newText));
      return;
    }
    
    setText(newText);
  };

  const handleConvert = (type: string) => {
    let result = "";
    switch (type) {
      case "upper":
        result = text.toUpperCase();
        break;
      case "lower":
        result = text.toLowerCase();
        break;
      case "title":
        result = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        break;
      case "sentence":
        result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
        break;
      case "camel":
        result = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
        break;
      case "snake":
        result = text.toLowerCase().replace(/\s+/g, "_");
        break;
      case "kebab":
        result = text.toLowerCase().replace(/\s+/g, "-");
        break;
    }
    setText(result);
    notify.success("Text converted!");
  };

  const copyToClipboard = async () => {
    try {
      // Modern approach - works on most browsers including mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        notify.success("Copied to clipboard!");
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement("textarea");
        textArea.value = text;
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
            placeholder="Enter your text here..."
            value={text}
            onChange={handleTextChange}
            className="min-h-[200px]"
            maxLength={MAX_TEXT_LENGTH}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button onClick={() => handleConvert("upper")} variant="secondary">UPPERCASE</Button>
        <Button onClick={() => handleConvert("lower")} variant="secondary">lowercase</Button>
        <Button onClick={() => handleConvert("title")} variant="secondary">Title Case</Button>
        <Button onClick={() => handleConvert("sentence")} variant="secondary">Sentence case</Button>
        <Button onClick={() => handleConvert("camel")} variant="secondary">camelCase</Button>
        <Button onClick={() => handleConvert("snake")} variant="secondary">snake_case</Button>
        <Button onClick={() => handleConvert("kebab")} variant="secondary">kebab-case</Button>
        <Button onClick={copyToClipboard}>Copy Text</Button>
      </div>
    </div>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";

type ConversionType =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "snake"
  | "kebab";

export const CaseConverter = () => {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;

    // Strip ASCII control characters except whitespace (tab/newline/carriage-return)
    const cleaned = Array.from(newText)
      .filter((ch) => {
        const code = ch.charCodeAt(0);
        return (
          code === 9 ||
          code === 10 ||
          code === 13 ||
          (code >= 0x20 && code !== 0x7f)
        );
      })
      .join("");

    if (!validateTextLength(cleaned)) {
      notify.error(
        `Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`
      );
      setText(truncateText(cleaned));
      return;
    }

    setText(cleaned);
  };

  const convert = (type: ConversionType) => {
    if (!text.trim()) {
      notify.error("Please enter text to convert.");
      return;
    }

    let result = "";

    switch (type) {
      case "upper":
        result = text.toUpperCase();
        break;

      case "lower":
        result = text.toLowerCase();
        break;

      case "title":
        result = text.replace(/\w\S*/g, (txt) => {
          return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
        });
        break;

      case "sentence":
        result = text
          .toLowerCase()
          .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
        break;

      case "camel":
        result = text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
        break;

      case "snake":
        result = text.toLowerCase().replace(/\s+/g, "_");
        break;

      case "kebab":
        result = text.toLowerCase().replace(/\s+/g, "-");
        break;
    }

    setOutput(result);
    notify.success("Text converted!");
  };

  const copyOutput = async () => {
    if (!output) {
      notify.error("No converted text to copy.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(output);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = output;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      notify.success("Output copied!");
    } catch {
      notify.error("Failed to copy output.");
    }
  };

  return (
    <div className="space-y-6">
      {/* INPUT */}
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

      {/* BUTTONS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button onClick={() => convert("upper")} variant="secondary">
          UPPERCASE
        </Button>
        <Button onClick={() => convert("lower")} variant="secondary">
          lowercase
        </Button>
        <Button onClick={() => convert("title")} variant="secondary">
          Title Case
        </Button>
        <Button onClick={() => convert("sentence")} variant="secondary">
          Sentence case
        </Button>
        <Button onClick={() => convert("camel")} variant="secondary">
          camelCase
        </Button>
        <Button onClick={() => convert("snake")} variant="secondary">
          snake_case
        </Button>
        <Button onClick={() => convert("kebab")} variant="secondary">
          kebab-case
        </Button>
      </div>

      {/* OUTPUT */}
      <Card>
        <CardHeader>
          <CardTitle>Converted Output</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            readOnly
            value={output}
            placeholder="Converted text will appear here..."
            className="min-h-[200px] bg-muted/50 cursor-default"
          />

          <Button
            onClick={copyOutput}
            className="w-full"
            disabled={!output}
          >
            Copy Output
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

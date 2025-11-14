import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notify } from "@/lib/notify";

import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { validateCount } from "@/lib/validators";

const loremWords = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur",
  "adipiscing", "elit", "sed", "do", "eiusmod", "tempor",
  "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua"
];

const ALLOWED_TYPES = ["paragraphs", "sentences", "words"] as const;
type LoremType = (typeof ALLOWED_TYPES)[number];

// Category coercion
const coerceType = (val: string): LoremType =>
  ALLOWED_TYPES.includes(val as LoremType) ? (val as LoremType) : "paragraphs";

// Crypto-safe random
const secureRandom = (max: number): number => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
};

export const LoremIpsum = () => {
  const [count, setCount] = useState<number | null>(3);
  const [type, setType] = useState<LoremType>("paragraphs");
  const [generated, setGenerated] = useState("");

  const MAX_COUNT = 200;

  const generateLorem = () => {
    // Validate
    if (!validateCount(count, MAX_COUNT)) {
      notify.error(`Please enter a valid number between 1 and ${MAX_COUNT}`);
      return;
    }

    if (!count) return;

    let result = "";

    if (type === "words") {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(loremWords[secureRandom(loremWords.length)]);
      }
      result = words.join(" ");
    }

    else if (type === "sentences") {
      for (let i = 0; i < count; i++) {
        const sentenceLength = 10 + secureRandom(10);
        const words = [];

        for (let j = 0; j < sentenceLength; j++) {
          words.push(loremWords[secureRandom(loremWords.length)]);
        }

        words[0] = words[0][0].toUpperCase() + words[0].slice(1);
        result += words.join(" ") + ". ";
      }
    }

    else {
      // paragraphs
      for (let i = 0; i < count; i++) {
        const sentenceCount = 3 + secureRandom(3);
        let paragraph = "";

        for (let j = 0; j < sentenceCount; j++) {
          const sentenceLength = 10 + secureRandom(10);
          const words = [];

          for (let k = 0; k < sentenceLength; k++) {
            words.push(loremWords[secureRandom(loremWords.length)]);
          }

          words[0] = words[0][0].toUpperCase() + words[0].slice(1);
          paragraph += words.join(" ") + ". ";
        }

        result += paragraph + "\n\n";
      }
    }

    setGenerated(result.trim());
    notify.success("Lorem ipsum generated!");
  };

  const copyToClipboard = async () => {
    try {
      const text = generated;
      if (!text) {
        notify.error("Nothing to copy.");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }

      notify.success("Copied to clipboard!");
    } catch {
      notify.error("Failed to copy.");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate Lorem Ipsum</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* AMOUNT */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <SafeNumberInput
                value={count?.toString() ?? ""}
                onChange={(val) => setCount(val ? parseInt(val, 10) : null)}
                placeholder="1–200"
                sanitizeOptions={{ min: 1, max: MAX_COUNT, allowDecimal: false, maxLength: 3 }}
              />
            </div>

            {/* TYPE */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(val) => setType(coerceType(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraphs">Paragraphs</SelectItem>
                  <SelectItem value="sentences">Sentences</SelectItem>
                  <SelectItem value="words">Words</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* GENERATE BUTTON */}
          <Button onClick={generateLorem} className="w-full">
            Generate
          </Button>
        </CardContent>
      </Card>

      {/* OUTPUT */}
      {generated && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Text</CardTitle>
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                Copy
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Textarea
              value={generated}
              readOnly
              className="min-h-[300px] whitespace-pre-wrap"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

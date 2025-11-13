import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notify } from "@/lib/notify";
import { sanitizeNumber } from "@/lib/security";

const loremWords = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua"];

// Allowed type values
const ALLOWED_TYPES = ["paragraphs", "sentences", "words"] as const;
type LoremType = typeof ALLOWED_TYPES[number];

// Coerce type to allowed values
const coerceType = (val: string): LoremType => {
  if (ALLOWED_TYPES.includes(val as LoremType)) return val as LoremType;
  return "paragraphs";
};

// Secure random integer
const secureRandom = (max: number): number => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
};

export const LoremIpsum = () => {
  const [count, setCount] = useState(3);
  const [type, setType] = useState("paragraphs");
  const [generated, setGenerated] = useState("");

  const generateLorem = () => {
    let result = "";
    
    if (type === "words") {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(loremWords[secureRandom(loremWords.length)]);
      }
      result = words.join(" ");
    } else if (type === "sentences") {
      for (let i = 0; i < count; i++) {
        const sentenceLength = 10 + secureRandom(10);
        const words = [];
        for (let j = 0; j < sentenceLength; j++) {
          words.push(loremWords[secureRandom(loremWords.length)]);
        }
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        result += words.join(" ") + ". ";
      }
    } else {
      for (let i = 0; i < count; i++) {
        const sentences = 3 + secureRandom(3);
        let paragraph = "";
        for (let j = 0; j < sentences; j++) {
          const sentenceLength = 10 + secureRandom(10);
          const words = [];
          for (let k = 0; k < sentenceLength; k++) {
            words.push(loremWords[secureRandom(loremWords.length)]);
          }
          words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
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
      // Modern approach - works on most browsers including mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generated);
        notify.success("Copied to clipboard!");
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement("textarea");
        textArea.value = generated;
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
          <CardTitle>Generate Lorem Ipsum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="text"
                inputMode="numeric"
                min={1}
                max={100}
                value={count}
                onChange={(e) => {
                  const val = sanitizeNumber(parseInt(e.target.value), 1, 100);
                  if (val !== null) setCount(val);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(val) => setType(coerceType(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraphs">Paragraphs</SelectItem>
                  <SelectItem value="sentences">Sentences</SelectItem>
                  <SelectItem value="words">Words</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generateLorem} className="w-full">Generate</Button>
        </CardContent>
      </Card>

      {generated && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Text</CardTitle>
              <Button onClick={copyToClipboard} variant="outline" size="sm">Copy</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea value={generated} readOnly className="min-h-[300px]" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

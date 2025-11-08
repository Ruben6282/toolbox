import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notify } from "@/lib/notify";

const loremWords = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua"];

export const LoremIpsum = () => {
  const [count, setCount] = useState(3);
  const [type, setType] = useState("paragraphs");
  const [generated, setGenerated] = useState("");

  const generateLorem = () => {
    let result = "";
    
    if (type === "words") {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
      }
      result = words.join(" ");
    } else if (type === "sentences") {
      for (let i = 0; i < count; i++) {
        const sentenceLength = 10 + Math.floor(Math.random() * 10);
        const words = [];
        for (let j = 0; j < sentenceLength; j++) {
          words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
        }
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        result += words.join(" ") + ". ";
      }
    } else {
      for (let i = 0; i < count; i++) {
        const sentences = 3 + Math.floor(Math.random() * 3);
        let paragraph = "";
        for (let j = 0; j < sentences; j++) {
          const sentenceLength = 10 + Math.floor(Math.random() * 10);
          const words = [];
          for (let k = 0; k < sentenceLength; k++) {
            words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generated);
  notify.success("Copied to clipboard!");
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
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
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

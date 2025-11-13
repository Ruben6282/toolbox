import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";
import { notify } from "@/lib/notify";

export const CharacterCounter = () => {
  const [text, setText] = useState("");

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    // Strip ASCII control characters except common whitespace (tab/newline/carriage-return)
    const cleaned = Array.from(newText).filter((ch) => {
      const code = ch.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 0x20 && code !== 0x7f);
    }).join("");
    
    if (!validateTextLength(cleaned)) {
      notify.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
      setText(truncateText(cleaned));
      return;
    }
    
    setText(cleaned);
  };

  const characterCount = text.length;
  const characterCountNoSpaces = text.replace(/\s/g, "").length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const paragraphCount = text.split(/\n\n+/).filter(p => p.trim()).length;
  const lineCount = text.split(/\n/).length;
  const averageWordLength = wordCount > 0 
    ? (characterCountNoSpaces / wordCount).toFixed(2) 
    : 0;
  const readingTime = Math.ceil(wordCount / 200); // avg reading speed: 200 words/min

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Character Counter</CardTitle>
        <CardDescription>Count characters, words, and get detailed text statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="text">Enter or paste your text</Label>
          <Textarea
            id="text"
            placeholder="Type or paste your text here..."
            value={text}
            onChange={handleTextChange}
            className="min-h-[200px] font-mono"
            maxLength={MAX_TEXT_LENGTH}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <div className="text-3xl font-bold text-primary">{characterCount}</div>
            <div className="text-sm text-muted-foreground">Characters</div>
          </div>
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <div className="text-3xl font-bold text-primary">{characterCountNoSpaces}</div>
            <div className="text-sm text-muted-foreground">Chars (no spaces)</div>
          </div>
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <div className="text-3xl font-bold text-primary">{wordCount}</div>
            <div className="text-sm text-muted-foreground">Words</div>
          </div>
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <div className="text-3xl font-bold text-primary">{sentenceCount}</div>
            <div className="text-sm text-muted-foreground">Sentences</div>
          </div>
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <div className="text-3xl font-bold text-primary">{paragraphCount}</div>
            <div className="text-sm text-muted-foreground">Paragraphs</div>
          </div>
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <div className="text-3xl font-bold text-primary">{lineCount}</div>
            <div className="text-sm text-muted-foreground">Lines</div>
          </div>
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <div className="text-3xl font-bold text-primary">{averageWordLength}</div>
            <div className="text-sm text-muted-foreground">Avg Word Length</div>
          </div>
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <div className="text-3xl font-bold text-primary">{readingTime}</div>
            <div className="text-sm text-muted-foreground">Min Read Time</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
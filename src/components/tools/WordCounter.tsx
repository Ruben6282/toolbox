import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateTextLength, MAX_TEXT_LENGTH, truncateText } from "@/lib/security";
import { notify } from "@/lib/notify";

export const WordCounter = () => {
  const [text, setText] = useState("");

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    // Security: Validate and truncate text length to prevent DoS
    if (!validateTextLength(newText)) {
      notify.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
      setText(truncateText(newText));
      return;
    }
    
    setText(newText);
  };

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    const paragraphs = text.split(/\n\n+/).filter(Boolean).length;
    const readingTime = Math.ceil(words / 200);

    return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTime };
  }, [text]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Enter Your Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Start typing or paste your text here..."
            value={text}
            onChange={handleTextChange}
            className="min-h-[300px]"
            maxLength={MAX_TEXT_LENGTH}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.words}</div>
              <div className="text-sm text-muted-foreground">Words</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.characters}</div>
              <div className="text-sm text-muted-foreground">Characters</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.charactersNoSpaces}</div>
              <div className="text-sm text-muted-foreground">Characters (no spaces)</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.sentences}</div>
              <div className="text-sm text-muted-foreground">Sentences</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.paragraphs}</div>
              <div className="text-sm text-muted-foreground">Paragraphs</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.readingTime}</div>
              <div className="text-sm text-muted-foreground">Min read time</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, HelpCircle } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                               CONFIG CONSTANTS                             */
/* -------------------------------------------------------------------------- */

const MAX_QUESTION_LENGTH = 500;

// Official Magic 8-Ball answer categories
type AnswerCategory = "positive" | "neutral" | "negative";

interface MagicAnswer {
  text: string;
  category: AnswerCategory;
}

const MAGIC_ANSWERS: MagicAnswer[] = [
  // Positive
  { text: "It is certain.", category: "positive" },
  { text: "It is decidedly so.", category: "positive" },
  { text: "Without a doubt.", category: "positive" },
  { text: "Yes - definitely.", category: "positive" },
  { text: "You may rely on it.", category: "positive" },
  { text: "As I see it, yes.", category: "positive" },
  { text: "Most likely.", category: "positive" },
  { text: "Outlook good.", category: "positive" },
  { text: "Yes.", category: "positive" },
  { text: "Signs point to yes.", category: "positive" },

  // Neutral
  { text: "Reply hazy, try again.", category: "neutral" },
  { text: "Ask again later.", category: "neutral" },
  { text: "Better not tell you now.", category: "neutral" },
  { text: "Cannot predict now.", category: "neutral" },
  { text: "Concentrate and ask again.", category: "neutral" },

  // Negative
  { text: "Don't count on it.", category: "negative" },
  { text: "My reply is no.", category: "negative" },
  { text: "My sources say no.", category: "negative" },
  { text: "Outlook not so good.", category: "negative" },
  { text: "Very doubtful.", category: "negative" },
];

/* -------------------------------------------------------------------------- */
/*                           SECURE RANDOM GENERATORS                         */
/* -------------------------------------------------------------------------- */

// Unbiased secure random integer using rejection sampling
const secureRandomInt = (max: number): number => {
  if (max <= 0) return 0;

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / max) * max;

    while (true) {
      crypto.getRandomValues(arr);
      if (arr[0] < limit) return arr[0] % max;
    }
  }

  // Fallback
  return Math.floor(Math.random() * max);
};

// Sanitizes question input (removes control chars, trims, enforces length)
const sanitizeInput = (val: string): string => {
  const cleaned = Array.from(val)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10 || code === 13;
    })
    .join("")
    .slice(0, MAX_QUESTION_LENGTH);

  return cleaned;
};

/* -------------------------------------------------------------------------- */
/*                                MAIN COMPONENT                              */
/* -------------------------------------------------------------------------- */

export const Magic8Ball = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<MagicAnswer | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const timeoutRef = useRef<number | null>(null);

  // Cleanup timeout on unmount (production requirement)
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const askQuestion = () => {
    const trimmed = question.trim();

    if (!trimmed) {
      setAnswer({ text: "Please ask a question first!", category: "neutral" });
      return;
    }

    if (isShaking) return;

    setIsShaking(true);
    setAnswer(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const index = secureRandomInt(MAGIC_ANSWERS.length);
      setAnswer(MAGIC_ANSWERS[index]);
      setIsShaking(false);
      timeoutRef.current = null;
    }, 1500);
  };

  const clearAll = () => {
    setQuestion("");
    setAnswer(null);
    setIsShaking(false);
  };

  /* ------------------------------ Styling helper ----------------------------- */

  const categoryColor = (category: AnswerCategory) => {
    switch (category) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const categoryBackground = (category: AnswerCategory) => {
    switch (category) {
      case "positive":
        return "bg-green-50 border-green-200";
      case "negative":
        return "bg-red-50 border-red-200";
      default:
        return "bg-yellow-50 border-yellow-200";
    }
  };

  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Magic 8-Ball</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Ask a Question</Label>
            <Input
              id="question"
              placeholder="What would you like to know?"
              value={question}
              onChange={(e) => setQuestion(sanitizeInput(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && askQuestion()}
              maxLength={MAX_QUESTION_LENGTH}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={askQuestion}
              disabled={!question.trim() || isShaking}
              className="w-full sm:w-auto"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              {isShaking ? "Shaking..." : "Ask the Magic 8-Ball"}
            </Button>

            <Button
              onClick={clearAll}
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isShaking}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Answer Card */}
      {answer && (
        <Card>
          <CardHeader>
            <CardTitle>The Magic 8-Ball Says...</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`p-4 sm:p-8 rounded-lg border-2 text-center ${categoryBackground(
                answer.category
              )}`}
            >
              <div className="mb-4">
                <div
                  className={`w-14 h-14 sm:w-20 sm:h-20 mx-auto rounded-full border-4 border-gray-300 flex items-center justify-center text-3xl ${
                    isShaking ? "animate-[shake_0.4s_ease-in-out_infinite]" : ""
                  }`}
                >
                  🎱
                </div>
              </div>

              <div
                className={`text-xl sm:text-2xl font-bold ${
                  categoryColor(answer.category)
                } mb-3 break-words px-2`}
              >
                {answer.text}
              </div>

              {question && (
                <p className="text-sm text-muted-foreground mt-4 break-words">
                  <strong>Your question:</strong> “{question.trim()}”
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use the Magic 8-Ball</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Think of a yes-or-no question.</li>
            <li>Type it in the input box above.</li>
            <li>Press “Ask the Magic 8-Ball”.</li>
            <li>Wait for your answer!</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

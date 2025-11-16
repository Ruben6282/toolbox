import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

/* -------------------------------------------------------
   SECURE, UNBIASED RANDOM BOOLEAN
------------------------------------------------------- */

const secureRandomBoolean = (): boolean => {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);

  // unbiased: reject odd leftover values
  const limit = Math.floor(0xffffffff / 2) * 2;

  return arr[0] < limit ? arr[0] % 2 === 0 : secureRandomBoolean();
};

/* -------------------------------------------------------
   COMPONENT
------------------------------------------------------- */

export const RandomYesNo = () => {
  const [result, setResult] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const timeoutRef = useRef<number | null>(null);

  const generateAnswer = () => {
    setIsGenerating(true);

    timeoutRef.current = window.setTimeout(() => {
      setResult(secureRandomBoolean() ? "Yes" : "No");
      setIsGenerating(false);
    }, 300);
  };

  // Cleanup for unmount safety
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isYes = result === "Yes";

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Random Yes/No Generator</CardTitle>
        <CardDescription>Get a random yes or no answer to your question</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Button 
          onClick={generateAnswer}
          className="w-full"
          size="lg"
          disabled={isGenerating}
        >
          <HelpCircle className="mr-2 h-5 w-5" />
          {isGenerating ? "Deciding..." : "Get Answer"}
        </Button>

        {result && (
          <div
            className={`rounded-lg border-2 p-12 text-center transition-colors ${
              isYes
                ? "border-green-500 bg-green-500/10"
                : "border-red-500 bg-red-500/10"
            }`}
          >
            <div className="text-6xl font-bold mb-4">
              {isYes ? "✓" : "✗"}
            </div>
            <div
              className={`text-5xl font-bold ${
                isYes ? "text-green-500" : "text-red-500"
              }`}
            >
              {result}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

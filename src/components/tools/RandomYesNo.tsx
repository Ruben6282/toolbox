import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

// Secure random boolean
const secureRandomBoolean = (): boolean => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % 2 === 0;
  }
  return Math.random() < 0.5;
};

export const RandomYesNo = () => {
  const [result, setResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAnswer = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const outcome = secureRandomBoolean() ? "Yes" : "No";
      setResult(outcome);
      setIsGenerating(false);
    }, 300);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Random Yes/No Generator</CardTitle>
        <CardDescription>Get a random yes or no answer to your questions</CardDescription>
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
          <div className={`rounded-lg border-2 p-12 text-center transition-all ${
            result === "Yes" 
              ? "border-green-500 bg-green-500/10" 
              : "border-red-500 bg-red-500/10"
          }`}>
            <div className="text-6xl font-bold mb-4">
              {result === "Yes" ? "✓" : "✗"}
            </div>
            <div className={`text-5xl font-bold ${
              result === "Yes" ? "text-green-500" : "text-red-500"
            }`}>
              {result}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
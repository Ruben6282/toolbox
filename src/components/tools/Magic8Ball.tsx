import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, HelpCircle } from "lucide-react";

// Max question length
const MAX_QUESTION_LENGTH = 500;

// Strip control characters except tab/newline/CR
const sanitizeInput = (val: string) =>
  val
    .split("")
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10 || code === 13;
    })
    .join("")
    .substring(0, MAX_QUESTION_LENGTH);

// Secure random integer
const secureRandom = (max: number): number => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
};

export const Magic8Ball = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const answers = [
    // Positive answers
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes - definitely.",
    "You may rely on it.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    
    // Neutral answers
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    
    // Negative answers
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful."
  ];

  const askQuestion = () => {
    if (!question.trim()) {
      setAnswer("Please ask a question first!");
      return;
    }

    setIsShaking(true);
    
    setTimeout(() => {
      const randomIndex = secureRandom(answers.length);
      setAnswer(answers[randomIndex]);
      setIsShaking(false);
    }, 2000);
  };

  const clearAll = () => {
    setQuestion("");
    setAnswer("");
  };

  const getAnswerColor = (answer: string) => {
    if (answer.includes("Yes") || answer.includes("certain") || answer.includes("definitely") || answer.includes("good")) {
      return "text-green-600";
    }
    if (answer.includes("No") || answer.includes("doubtful") || answer.includes("not so good")) {
      return "text-red-600";
    }
    if (answer.includes("hazy") || answer.includes("try again") || answer.includes("later") || answer.includes("predict")) {
      return "text-yellow-600";
    }
    return "text-blue-600";
  };

  const getAnswerBgColor = (answer: string) => {
    if (answer.includes("Yes") || answer.includes("certain") || answer.includes("definitely") || answer.includes("good")) {
      return "bg-green-50 border-green-200";
    }
    if (answer.includes("No") || answer.includes("doubtful") || answer.includes("not so good")) {
      return "bg-red-50 border-red-200";
    }
    if (answer.includes("hazy") || answer.includes("try again") || answer.includes("later") || answer.includes("predict")) {
      return "bg-yellow-50 border-yellow-200";
    }
    return "bg-blue-50 border-blue-200";
  };

  return (
    <div className="space-y-6">
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
              onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
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
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {answer && (
        <Card>
          <CardHeader>
            <CardTitle>The Magic 8-Ball Says...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 sm:p-8 rounded-lg border-2 text-center ${getAnswerBgColor(answer)}`}>
              <div className="mb-4">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full border-4 border-gray-300 flex items-center justify-center text-2xl ${isShaking ? 'animate-bounce' : ''}`}>
                  🎱
                </div>
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${getAnswerColor(answer)} mb-2 break-words px-2`}>
                {answer}
              </div>
              {question && (
                <div className="text-sm text-muted-foreground mt-4">
                  <strong>Your question:</strong> "{question}"
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How to Use the Magic 8-Ball</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              The Magic 8-Ball is a fortune-telling toy that provides answers to yes-or-no questions.
            </p>
            <p>
              <strong>How it works:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Think of a yes-or-no question</li>
              <li>Type your question in the input field</li>
              <li>Click "Ask the Magic 8-Ball"</li>
              <li>Wait for the answer to appear</li>
            </ul>
            <p>
              <strong>Tips for better results:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Ask clear, specific questions</li>
              <li>Focus on one question at a time</li>
              <li>Be patient and wait for the answer</li>
              <li>Remember, it's just for fun!</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About the Magic 8-Ball</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              The Magic 8-Ball was invented in 1950 by Albert C. Carter and Abe Bookman. It's a spherical device that resembles a black 8-ball used in pool.
            </p>
            <p>
              The original Magic 8-Ball contains 20 different answers, including positive, neutral, and negative responses. The answers are printed on a 20-sided die inside the ball.
            </p>
            <p>
              While it's meant for entertainment, many people use it as a fun way to make decisions or get a different perspective on their questions.
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium mb-2">Fun Facts</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Over 1 million Magic 8-Balls are sold each year</li>
                <li>The original answers were written by Albert C. Carter's mother</li>
                <li>It's been featured in movies, TV shows, and popular culture</li>
                <li>The ball is filled with blue liquid and a white die</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

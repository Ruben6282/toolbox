import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RotateCcw } from "lucide-react";
import { notify } from "@/lib/notify";

import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { validateCount } from "@/lib/validators";

const WORD_CATEGORIES = {
  adjectives: [
    "amazing", "beautiful", "brilliant", "creative", "delicious", "elegant",
    "fantastic", "gorgeous", "incredible", "joyful", "kind", "lovely",
    "magnificent", "natural", "outstanding", "peaceful", "quality", "radiant",
    "spectacular", "tremendous", "unique", "vibrant", "wonderful", "excellent"
  ],
  nouns: [
    "adventure", "beauty", "courage", "dream", "energy", "freedom", "garden",
    "harmony", "inspiration", "journey", "knowledge", "love", "mountain",
    "nature", "ocean", "passion", "rainbow", "sunset", "treasure", "universe",
    "victory", "wisdom", "youth", "zest"
  ],
  verbs: [
    "achieve", "believe", "create", "discover", "explore", "flourish", "grow",
    "inspire", "journey", "learn", "motivate", "nurture", "overcome", "progress",
    "quest", "rise", "succeed", "transform", "uplift", "venture", "wonder",
    "excel", "thrive", "bloom"
  ],
  animals: [
    "butterfly", "dolphin", "eagle", "fox", "giraffe", "hummingbird", "jaguar",
    "koala", "lion", "mountain", "nightingale", "octopus", "penguin", "quail",
    "rabbit", "swan", "tiger", "unicorn", "vulture", "whale", "zebra",
    "elephant", "flamingo", "gazelle"
  ],
  colors: [
    "azure", "crimson", "emerald", "golden", "indigo", "jade", "lavender",
    "magenta", "navy", "orange", "purple", "ruby", "scarlet", "turquoise",
    "violet", "white", "yellow", "amber", "burgundy", "coral", "ivory",
    "lime", "maroon", "silver"
  ]
};

const ALLOWED_CATEGORIES = ["mixed", "adjectives", "nouns", "verbs", "animals", "colors"] as const;
type Category = (typeof ALLOWED_CATEGORIES)[number];

// Coerce category safely
const coerceCategory = (val: string): Category =>
  ALLOWED_CATEGORIES.includes(val as Category) ? (val as Category) : "mixed";

// Secure random integer
const secureRandom = (max: number): number => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
};

export const RandomWordGenerator = () => {
  const [wordCount, setWordCount] = useState<number | null>(5);
  const [category, setCategory] = useState<Category>("mixed");
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const MAX_WORDS = 200;

  const generateWords = () => {
    // Validation
    if (!validateCount(wordCount, MAX_WORDS)) {
      notify.error(`Please enter a valid number between 1 and ${MAX_WORDS}`);
      return;
    }

    if (!wordCount) return;

    setIsGenerating(true);

    setTimeout(() => {
      const words: string[] = [];
      const allWords =
        category === "mixed"
          ? Object.values(WORD_CATEGORIES).flat()
          : WORD_CATEGORIES[category];

      for (let i = 0; i < wordCount; i++) {
        const randomIndex = secureRandom(allWords.length);
        words.push(allWords[randomIndex]);
      }

      setGeneratedWords(words);
      setIsGenerating(false);

      notify.success(`Generated ${wordCount} word${wordCount > 1 ? "s" : ""}!`);
    }, 250);
  };

  const copyToClipboard = async () => {
    if (generatedWords.length === 0) {
      notify.error("No words to copy.");
      return;
    }

    try {
      const text = generatedWords.join(", ");
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.left = "-9999px";
        area.style.top = "-9999px";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }
      notify.success("Copied!");
    } catch {
      notify.error("Failed to copy.");
    }
  };

  const clearWords = () => {
    setGeneratedWords([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Random Word Generator</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* INPUT FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Number of Words</Label>
              <SafeNumberInput
                value={wordCount?.toString() ?? ""}
                onChange={(val) => setWordCount(val ? parseInt(val, 10) : null)}
                placeholder="1–200"
                sanitizeOptions={{ min: 1, max: MAX_WORDS, allowDecimal: false, maxLength: 3 }}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(coerceCategory(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed (All Categories)</SelectItem>
                  <SelectItem value="adjectives">Adjectives</SelectItem>
                  <SelectItem value="nouns">Nouns</SelectItem>
                  <SelectItem value="verbs">Verbs</SelectItem>
                  <SelectItem value="animals">Animals</SelectItem>
                  <SelectItem value="colors">Colors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={generateWords} disabled={isGenerating} className="w-full sm:w-auto">
              {isGenerating ? "Generating..." : "Generate Words"}
            </Button>

            <Button variant="outline" onClick={clearWords} className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* OUTPUT */}
      {generatedWords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Words</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {generatedWords.map((word, i) => (
                  <span
                    key={i}
                    className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>List:</strong> {generatedWords.join(", ")}
              </p>
              <p>
                <strong>Sentence:</strong> {generatedWords.join(" ")}
              </p>
            </div>

            <Button onClick={copyToClipboard} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy Words
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

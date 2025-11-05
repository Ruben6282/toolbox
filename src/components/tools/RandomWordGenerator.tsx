import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RotateCcw } from "lucide-react";

const WORD_CATEGORIES = {
  adjectives: [
    "amazing", "beautiful", "brilliant", "creative", "delicious", "elegant", "fantastic", "gorgeous",
    "incredible", "joyful", "kind", "lovely", "magnificent", "natural", "outstanding", "peaceful",
    "quality", "radiant", "spectacular", "tremendous", "unique", "vibrant", "wonderful", "excellent"
  ],
  nouns: [
    "adventure", "beauty", "courage", "dream", "energy", "freedom", "garden", "harmony",
    "inspiration", "journey", "knowledge", "love", "mountain", "nature", "ocean", "passion",
    "rainbow", "sunset", "treasure", "universe", "victory", "wisdom", "youth", "zest"
  ],
  verbs: [
    "achieve", "believe", "create", "discover", "explore", "flourish", "grow", "inspire",
    "journey", "learn", "motivate", "nurture", "overcome", "progress", "quest", "rise",
    "succeed", "transform", "uplift", "venture", "wonder", "excel", "thrive", "bloom"
  ],
  animals: [
    "butterfly", "dolphin", "eagle", "fox", "giraffe", "hummingbird", "jaguar", "koala",
    "lion", "mountain", "nightingale", "octopus", "penguin", "quail", "rabbit", "swan",
    "tiger", "unicorn", "vulture", "whale", "zebra", "elephant", "flamingo", "gazelle"
  ],
  colors: [
    "azure", "crimson", "emerald", "golden", "indigo", "jade", "lavender", "magenta",
    "navy", "orange", "purple", "ruby", "scarlet", "turquoise", "violet", "white",
    "yellow", "amber", "burgundy", "coral", "ivory", "lime", "maroon", "silver"
  ]
};

export const RandomWordGenerator = () => {
  const [wordCount, setWordCount] = useState(5);
  const [category, setCategory] = useState("mixed");
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateWords = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const words: string[] = [];
      
      if (category === "mixed") {
        const allWords = Object.values(WORD_CATEGORIES).flat();
        for (let i = 0; i < wordCount; i++) {
          const randomIndex = Math.floor(Math.random() * allWords.length);
          words.push(allWords[randomIndex]);
        }
      } else {
        const categoryWords = WORD_CATEGORIES[category as keyof typeof WORD_CATEGORIES];
        for (let i = 0; i < wordCount; i++) {
          const randomIndex = Math.floor(Math.random() * categoryWords.length);
          words.push(categoryWords[randomIndex]);
        }
      }
      
      setGeneratedWords(words);
      setIsGenerating(false);
    }, 300);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedWords.join(", "));
    } catch (err) {
      console.error('Failed to copy: ', err);
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="word-count">Number of Words</Label>
              <Input
                id="word-count"
                type="number"
                min="1"
                max="50"
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category-select">Category</Label>
              <Select value={category} onValueChange={setCategory}>
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

          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
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

      {generatedWords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Words</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {generatedWords.map((word, index) => (
                  <span
                    key={index}
                    className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>As a list:</strong> {generatedWords.join(", ")}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>As a sentence:</strong> {generatedWords.join(" ")}
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

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, RotateCcw, Search, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface KeywordData {
  keyword: string;
  count: number;
  density: number;
  positions: number[];
}

export const KeywordDensityChecker = () => {
  const [text, setText] = useState("");
  const [minWordLength, setMinWordLength] = useState(3);
  const [excludeCommon, setExcludeCommon] = useState(true);
  const [customExclusions, setCustomExclusions] = useState("");

  const commonWords = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
    "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her",
    "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up",
    "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
    "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could",
    "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
    "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
    "new", "want", "because", "any", "these", "give", "day", "most", "us", "is", "are", "was",
    "were", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "can", "shall", "am", "is", "are", "was", "were", "be",
    "being", "been", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should"
  ];

  const keywordAnalysis = useMemo(() => {
    if (!text.trim()) return { keywords: [], totalWords: 0, uniqueWords: 0 };

    // Clean and split text into words
    const cleanText = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = cleanText.split(' ').filter(word => 
      word.length >= minWordLength && 
      word.match(/^[a-zA-Z]+$/)
    );

    const totalWords = words.length;
    const wordCount: { [key: string]: number } = {};
    const wordPositions: { [key: string]: number[] } = {};

    // Count words and track positions
    words.forEach((word, index) => {
      if (!wordCount[word]) {
        wordCount[word] = 0;
        wordPositions[word] = [];
      }
      wordCount[word]++;
      wordPositions[word].push(index + 1);
    });

    // Get exclusion list
    const exclusions = new Set([
      ...(excludeCommon ? commonWords : []),
      ...customExclusions.toLowerCase().split(/[,\s]+/).filter(word => word.trim())
    ]);

    // Calculate keyword data
    const keywords: KeywordData[] = Object.entries(wordCount)
      .filter(([word]) => !exclusions.has(word))
      .map(([word, count]) => ({
        keyword: word,
        count,
        density: (count / totalWords) * 100,
        positions: wordPositions[word]
      }))
      .sort((a, b) => b.count - a.count);

    return {
      keywords,
      totalWords,
      uniqueWords: keywords.length
    };
  }, [text, minWordLength, excludeCommon, customExclusions]);

  const copyResults = async () => {
    const results = keywordAnalysis.keywords
      .slice(0, 20)
      .map(k => `${k.keyword}: ${k.count} times (${k.density.toFixed(2)}%)`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(results);
      toast.success("Results copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const clearAll = () => {
    setText("");
    setMinWordLength(3);
    setExcludeCommon(true);
    setCustomExclusions("");
  };

  const getDensityColor = (density: number) => {
    if (density > 3) return "bg-red-100 text-red-800 border-red-200";
    if (density > 2) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (density > 1) return "bg-green-100 text-green-800 border-green-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getDensityStatus = (density: number) => {
    if (density > 3) return "High (may be over-optimized)";
    if (density > 2) return "Medium-High";
    if (density > 1) return "Good";
    return "Low";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Keyword Density Checker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-input">Text to Analyze</Label>
            <Textarea
              id="text-input"
              placeholder="Enter your text here to analyze keyword density..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-length">Minimum Word Length</Label>
              <Input
                id="min-length"
                type="number"
                min="1"
                max="10"
                value={minWordLength}
                onChange={(e) => setMinWordLength(parseInt(e.target.value) || 3)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exclusions">Custom Exclusions (comma-separated)</Label>
              <Input
                id="exclusions"
                placeholder="word1, word2, word3"
                value={customExclusions}
                onChange={(e) => setCustomExclusions(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="exclude-common"
              checked={excludeCommon}
              onChange={(e) => setExcludeCommon(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="exclude-common">Exclude common words (the, and, or, etc.)</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={copyResults} variant="outline" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy Results
            </Button>
            <Button onClick={clearAll} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {keywordAnalysis.totalWords > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{keywordAnalysis.totalWords}</div>
                  <div className="text-sm text-muted-foreground">Total Words</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{keywordAnalysis.uniqueWords}</div>
                  <div className="text-sm text-muted-foreground">Unique Keywords</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {keywordAnalysis.keywords.length > 0 ? keywordAnalysis.keywords[0].density.toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Highest Density</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Keyword Density Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {keywordAnalysis.keywords.slice(0, 50).map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{keyword.keyword}</span>
                        <Badge variant="outline" className={getDensityColor(keyword.density)}>
                          {keyword.density.toFixed(2)}%
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {getDensityStatus(keyword.density)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Appears {keyword.count} time{keyword.count !== 1 ? 's' : ''} at positions: {keyword.positions.slice(0, 5).join(', ')}
                        {keyword.positions.length > 5 && ` (+${keyword.positions.length - 5} more)`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Keyword Density Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Optimal Density:</strong> 1-3% for primary keywords, 0.5-1% for secondary keywords
            </div>
            <div>
              <strong>Too High:</strong> Above 3% may be considered keyword stuffing by search engines
            </div>
            <div>
              <strong>Too Low:</strong> Below 0.5% may not provide enough keyword relevance
            </div>
            <div>
              <strong>Best Practice:</strong> Focus on natural, readable content rather than exact percentages
            </div>
            <div>
              <strong>LSI Keywords:</strong> Include related terms and synonyms for better SEO
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

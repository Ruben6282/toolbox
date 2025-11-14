import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, RotateCcw, Search, BarChart3 } from "lucide-react";
import { notify } from "@/lib/notify";
import { SEO_LIMITS } from "@/lib/security";

/**
 * KeywordDensityChecker - SEO-Realistic, Unicode-Aware
 *
 * SECURITY & PERFORMANCE:
 * - Max text size enforced via SEO_LIMITS.KEYWORD_TEXT
 * - Graceful truncation with user notification
 * - All rendering is via React text nodes (auto-escaped, XSS-safe)
 * - No dangerous HTML injection / innerHTML usage
 * - Pure in-memory processing, no network calls
 *
 * SEO-REALISTIC WORD MODEL:
 * - Allows letters + digits + hyphens + dots + underscores
 *   e.g. "covid-19", "ai-powered", "node.js", "web3", "gpt-4"
 * - Requires at least one letter to be treated as a keyword
 * - Fully Unicode-aware (supports accents & non-Latin scripts)
 */

// Allow: letters, numbers, ., _, -
// Require: at least one letter for SEO relevance
const WORD_PATTERN = /^(?=.*\p{L})[\p{L}\p{N}._-]+$/u;

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

  /**
   * Handle text input with size limit and graceful truncation
   */
  const handleTextChange = (newText: string) => {
    if (newText.length > SEO_LIMITS.KEYWORD_TEXT) {
      notify.warning(
        `Text exceeds ${(SEO_LIMITS.KEYWORD_TEXT / 1000).toFixed(
          1
        )}KB limit and was truncated`
      );
      setText(newText.substring(0, SEO_LIMITS.KEYWORD_TEXT));
    } else {
      setText(newText);
    }
  };

  /**
   * English common/stop words (lowercased)
   * useMemo to avoid re-allocating the array on every render.
   */
  const commonWords = useMemo(
    () => [
      "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it",
      "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
      "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
      "an", "will", "my", "one", "all", "would", "there", "their", "what",
      "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
      "when", "make", "can", "like", "time", "no", "just", "him", "know",
      "take", "people", "into", "year", "your", "good", "some", "could",
      "them", "see", "other", "than", "then", "now", "look", "only", "come",
      "its", "over", "think", "also", "back", "after", "use", "two", "how",
      "our", "work", "first", "well", "way", "even", "new", "want", "because",
      "any", "these", "give", "day", "most", "us", "is", "are", "was", "were",
      "been", "being", "have", "has", "had", "do", "does", "did", "will",
      "would", "could", "should", "may", "might", "must", "can", "shall",
      "am"
    ],
    []
  );

  /**
   * Core keyword analysis logic
   */
  const keywordAnalysis = useMemo(() => {
    if (!text.trim()) {
      return { keywords: [] as KeywordData[], totalWords: 0, uniqueWords: 0 };
    }

    // Clamp minWordLength defensively (in case of weird numeric input)
    const safeMinWordLength = Number.isFinite(minWordLength)
      ? Math.min(Math.max(minWordLength, 1), 50)
      : 3;

    // Normalize text:
    // - Lowercase for case-insensitive analysis
    // - Keep letters, digits, dots, underscores, hyphens and whitespace
    // - Replace anything else with space
    const cleanText = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s._-]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      return { keywords: [] as KeywordData[], totalWords: 0, uniqueWords: 0 };
    }

    const tokens = cleanText.split(" ");

    // Filter tokens to "SEO-realistic" words
    const words = tokens.filter(
      (word) =>
        word.length >= safeMinWordLength &&
        WORD_PATTERN.test(word) // unicode-aware pattern
    );

    const totalWords = words.length;
    if (totalWords === 0) {
      return { keywords: [] as KeywordData[], totalWords: 0, uniqueWords: 0 };
    }

    const wordCount: Record<string, number> = {};
    const wordPositions: Record<string, number[]> = {};

    // Count words & track positions (1-based index)
    words.forEach((word, index) => {
      if (!wordCount[word]) {
        wordCount[word] = 0;
        wordPositions[word] = [];
      }
      wordCount[word]++;
      wordPositions[word].push(index + 1);
    });

    // Build sanitized exclusion list from user input
    const sanitizedCustomExclusions = customExclusions
      .trim()
      .toLowerCase()
      .split(/[\s,]+/) // split on whitespace OR commas
      .map((token) => token.trim())
      .filter(Boolean);

    const exclusions = new Set<string>([
      ...(excludeCommon ? commonWords : []),
      ...sanitizedCustomExclusions
    ]);

    const keywords: KeywordData[] = Object.entries(wordCount)
      .filter(([word]) => !exclusions.has(word))
      .map(([word, count]) => ({
        keyword: word,
        count,
        density: (count / totalWords) * 100,
        positions: wordPositions[word] ?? []
      }))
      .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword));

    return {
      keywords,
      totalWords,
      uniqueWords: keywords.length
    };
  }, [text, minWordLength, excludeCommon, customExclusions, commonWords]);

  /**
   * Copy top results to clipboard with proper error handling
   */
  const copyResults = async () => {
    if (keywordAnalysis.totalWords === 0 || keywordAnalysis.keywords.length === 0) {
      notify.error("No analysis results to copy yet.");
      return;
    }

    const results = [
      "Keyword Density Results (Top 20):",
      `Total words: ${keywordAnalysis.totalWords}`,
      `Unique keywords: ${keywordAnalysis.uniqueWords}`,
      ""
    ]
      .concat(
        keywordAnalysis.keywords.slice(0, 20).map((k) => {
          return `${k.keyword}: ${k.count} time${
            k.count !== 1 ? "s" : ""
          } (${k.density.toFixed(2)}%)`;
        })
      )
      .join("\n");

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(results);
        notify.success("Results copied to clipboard!");
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = results;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (ok) {
          notify.success("Results copied to clipboard!");
        } else {
          notify.error("Failed to copy results.");
        }
      }
    } catch (err) {
      console.error("Failed to copy: ", err);
      notify.error("Failed to copy to clipboard!");
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
          {/* TEXT INPUT */}
          <div className="space-y-2">
            <Label htmlFor="text-input">
              Text to Analyze (max {(SEO_LIMITS.KEYWORD_TEXT / 1000).toFixed(1)}KB)
            </Label>
            <Textarea
              id="text-input"
              placeholder="Paste or type your content here to analyze keyword density..."
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={8}
            />
            <p className="text-xs text-muted-foreground">
              {text.length.toLocaleString()} /{" "}
              {SEO_LIMITS.KEYWORD_TEXT.toLocaleString()} characters
            </p>
          </div>

          {/* CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-length">Minimum Word Length</Label>
              <Input
                id="min-length"
                type="number"
                min={1}
                max={50}
                value={minWordLength}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (Number.isNaN(val)) {
                    setMinWordLength(3);
                    return;
                  }
                  const clamped = Math.min(Math.max(val, 1), 50);
                  setMinWordLength(clamped);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Ignore very short tokens like “a”, “an”, “of”, etc. Default is 3.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exclusions">Custom Exclusions (comma or space separated)</Label>
              <Input
                id="exclusions"
                placeholder="brand, company, name, etc"
                value={customExclusions}
                onChange={(e) => setCustomExclusions(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                These words will be ignored in the analysis.
              </p>
            </div>
          </div>

          {/* EXCLUDE COMMON WORDS TOGGLE */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="exclude-common"
              checked={excludeCommon}
              onCheckedChange={(checked) => setExcludeCommon(!!checked)}
            />
            <Label htmlFor="exclude-common">
              Exclude common English stop words (the, and, or, etc.)
            </Label>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={copyResults}
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto"
              disabled={keywordAnalysis.totalWords === 0}
            >
              <Copy className="h-4 w-4" />
              Copy Results
            </Button>
            <Button
              onClick={clearAll}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ANALYSIS SUMMARY */}
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
                  <div className="text-2xl font-bold">
                    {keywordAnalysis.totalWords.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Words</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {keywordAnalysis.uniqueWords.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Unique Keywords</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {keywordAnalysis.keywords.length > 0
                      ? keywordAnalysis.keywords[0].density.toFixed(1)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Highest Keyword Density
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KEYWORD LIST */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Keyword Density Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {keywordAnalysis.keywords.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No keywords found with the current filters. Try lowering the minimum
                  word length or disabling some exclusions.
                </p>
              ) : (
                <div className="space-y-3">
                  {keywordAnalysis.keywords.slice(0, 50).map((keyword, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{keyword.keyword}</span>
                          <Badge
                            variant="outline"
                            className={getDensityColor(keyword.density)}
                          >
                            {keyword.density.toFixed(2)}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {getDensityStatus(keyword.density)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Appears {keyword.count} time
                          {keyword.count !== 1 ? "s" : ""} at positions:{" "}
                          {keyword.positions.slice(0, 5).join(", ")}
                          {keyword.positions.length > 5 &&
                            ` (+${keyword.positions.length - 5} more)`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* GUIDELINES */}
      <Card>
        <CardHeader>
          <CardTitle>Keyword Density Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Optimal Density:</strong> 1–3% for primary keywords, around 0.5–1% for
              secondary keywords.
            </div>
            <div>
              <strong>Too High:</strong> Above 3% may look like keyword stuffing to search
              engines.
            </div>
            <div>
              <strong>Too Low:</strong> Below 0.5% may not provide enough relevance signal.
            </div>
            <div>
              <strong>Best Practice:</strong> Write naturally for humans first, then use this
              tool to spot extremes, not to chase exact percentages.
            </div>
            <div>
              <strong>Related Terms:</strong> Include synonyms and related phrases (LSI
              keywords) for stronger topical coverage.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

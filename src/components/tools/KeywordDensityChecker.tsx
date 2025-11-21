import { useState, useMemo, useCallback } from "react";
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
 * PRODUCTION-READY: IMPROVED SEO WORD MODEL
 * Allows letters/digits + ._-'
 * Requires at least one letter.
 */
const WORD_PATTERN = /^(?=.*\p{L})[\p{L}\p{N}._'-]+$/u;

/** English stop words (deduped via Set) */
const COMMON_WORDS_SET = new Set(
  Array.from(
    new Set(
      [
        "the","be","to","of","and","a","in","that","have","i","it",
        "for","not","on","with","he","as","you","do","at","this",
        "but","his","by","from","they","we","say","her","she","or",
        "an","will","my","one","all","would","there","their","what",
        "so","up","out","if","about","who","get","which","go","me",
        "when","make","can","like","time","no","just","him","know",
        "take","people","into","year","your","good","some","could",
        "them","see","other","than","then","now","look","only","come",
        "its","over","think","also","back","after","use","two","how",
        "our","work","first","well","way","even","new","want","because",
        "any","these","give","day","most","us","is","are","was","were",
        "been","being","has","had","does","did","should","may","might",
        "must","shall","am"
      ]
    )
  )
);

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

  /** TEXT INPUT HANDLING WITH TRUNCATION */
  const handleTextChange = useCallback((newText: string) => {
    if (newText.length > SEO_LIMITS.KEYWORD_TEXT) {
      notify.warning(
        `Text exceeds ${(SEO_LIMITS.KEYWORD_TEXT / 1000).toFixed(1)}KB and was truncated`
      );
      setText(newText.slice(0, SEO_LIMITS.KEYWORD_TEXT));
    } else {
      setText(newText);
    }
  }, []);

  /** PRE-NORMALIZED TEXT (performance) */
  const normalizedText = useMemo(() => text.toLowerCase(), [text]);

  /** CORE KEYWORD ANALYSIS */
  const keywordAnalysis = useMemo(() => {
    const safeMin = Number.isFinite(minWordLength)
      ? Math.min(Math.max(minWordLength, 1), 50)
      : 3;

    if (!normalizedText.trim()) {
      return { keywords: [] as KeywordData[], totalWords: 0, uniqueWords: 0 };
    }

    // Unicode-aware sanitization including apostrophes
    const clean = normalizedText
      .replace(/[^\p{L}\p{N}\s._'-]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean) {
      return { keywords: [], totalWords: 0, uniqueWords: 0 };
    }

    const tokens = clean.split(" ");

    // Filter by minimum length and allowed SEO word shape
    const words = tokens.filter(
      (w) => w.length >= safeMin && WORD_PATTERN.test(w)
    );

    const totalWords = words.length;
    if (totalWords === 0) {
      return { keywords: [], totalWords: 0, uniqueWords: 0 };
    }

    // Count words + store positions
    const count: Record<string, number> = {};
    const pos: Record<string, number[]> = {};

    words.forEach((word, i) => {
      if (!count[word]) {
        count[word] = 0;
        pos[word] = [];
      }
      count[word]++;
      pos[word].push(i + 1);
    });

    // Build exclusion list
    const customList = customExclusions
      .toLowerCase()
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const exclusionSet = new Set([
      ...(excludeCommon ? COMMON_WORDS_SET : []),
      ...customList
    ]);

    const keywordList: KeywordData[] = Object.entries(count)
      .filter(([word]) => !exclusionSet.has(word))
      .map(([word, count]) => ({
        keyword: word,
        count,
        density: (count / totalWords) * 100,
        positions: pos[word]
      }))
      .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword));

    return {
      keywords: keywordList,
      totalWords,
      uniqueWords: keywordList.length
    };
  }, [normalizedText, minWordLength, excludeCommon, customExclusions]);

  /** COPY RESULTS */
  const copyResults = useCallback(async () => {
    const { keywords, totalWords, uniqueWords } = keywordAnalysis;
    if (totalWords === 0 || keywords.length === 0) {
      notify.error("No analysis results to copy.");
      return;
    }

    const text = [
      "Keyword Density Results (Top 20):",
      `Total words: ${totalWords}`,
      `Unique keywords: ${uniqueWords}`,
      ""
    ]
      .concat(
        keywords.slice(0, 20).map(
          (k) =>
            `${k.keyword}: ${k.count} time${k.count !== 1 ? "s" : ""} (${k.density.toFixed(2)}%)`
        )
      )
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      notify.success("Results copied to clipboard!");
    } catch {
      notify.error("Failed to copy to clipboard.");
    }
  }, [keywordAnalysis]);

  /** CLEAR ALL */
  const clearAll = useCallback(() => {
    setText("");
    setMinWordLength(3);
    setExcludeCommon(true);
    setCustomExclusions("");
  }, []);

  /** Density color (Dark-mode friendly) */
  const getDensityColor = (density: number) => {
    if (density > 3) return "bg-red-500/20 text-red-600 border-red-500/30";
    if (density > 2) return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
    if (density > 1) return "bg-green-500/20 text-green-700 border-green-500/30";
    return "bg-blue-500/20 text-blue-700 border-blue-500/30";
  };

  const getDensityStatus = (density: number) => {
    if (density > 3) return "High (may be over-optimized)";
    if (density > 2) return "Medium-High";
    if (density > 1) return "Good";
    return "Low";
  };

  return (
    <div className="space-y-6">
      {/* INPUT CARD */}
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
              rows={8}
              value={text}
              placeholder="Paste or type your content here..."
              onChange={(e) => handleTextChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {text.length.toLocaleString()} /{" "}
              {SEO_LIMITS.KEYWORD_TEXT.toLocaleString()} characters
            </p>
          </div>

          {/* OPTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Min length */}
            <div className="space-y-2">
              <Label htmlFor="min-length">Minimum Word Length</Label>
              <Input
                id="min-length"
                type="number"
                value={minWordLength}
                min={1}
                max={50}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (!raw) return setMinWordLength(3);
                  const num = Number(raw);
                  setMinWordLength(
                    Number.isFinite(num) ? Math.min(Math.max(num, 1), 50) : 3
                  );
                }}
              />
              <p className="text-xs text-muted-foreground">
                Ignore tiny tokens like “a”, “to”, etc. Default: 3.
              </p>
            </div>

            {/* Custom exclusions */}
            <div className="space-y-2">
              <Label htmlFor="exclusions">Custom Exclusions</Label>
              <Input
                id="exclusions"
                placeholder="brand, company, name..."
                value={customExclusions}
                onChange={(e) => setCustomExclusions(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Words here will be ignored.
              </p>
            </div>
          </div>

          {/* Stop words toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="exclude-common"
              checked={excludeCommon}
              onCheckedChange={(v) => setExcludeCommon(Boolean(v))}
            />
            <Label htmlFor="exclude-common">Exclude common English stop words</Label>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={copyResults}
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto"
              disabled={keywordAnalysis.totalWords === 0}
            >
              <Copy className="h-4 w-4" /> Copy Results
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" /> Clear All
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
                {[
                  ["Total Words", keywordAnalysis.totalWords],
                  ["Unique Keywords", keywordAnalysis.uniqueWords],
                  [
                    "Highest Density",
                    keywordAnalysis.keywords[0]?.density.toFixed(1) + "%"
                  ]
                ].map(([label, value]) => (
                  <div key={label} className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                  </div>
                ))}
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
                  No keywords found with current filters.
                </p>
              ) : (
                <div className="space-y-3">
                  {keywordAnalysis.keywords.slice(0, 50).map((k) => (
                    <div
                      key={k.keyword}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium break-all">{k.keyword}</span>
                          <Badge variant="outline" className={getDensityColor(k.density)}>
                            {k.density.toFixed(2)}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {getDensityStatus(k.density)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Appears {k.count} time{k.count !== 1 ? "s" : ""} at positions:{" "}
                          {k.positions.slice(0, 5).join(", ")}
                          {k.positions.length > 5 &&
                            ` (+${k.positions.length - 5} more)`}
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
              <strong>Optimal:</strong> 1–3% for primary keywords, 0.5–1% for secondary.
            </div>
            <div>
              <strong>Too high:</strong> Over 3% can appear spammy to search engines.
            </div>
            <div>
              <strong>Too low:</strong> Under 0.5% provides weak relevance.
            </div>
            <div>
              <strong>Best practice:</strong> Write naturally, use this tool to detect extremes.
            </div>
            <div>
              <strong>Tip:</strong> Include synonyms & related terms (LSI keywords).
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

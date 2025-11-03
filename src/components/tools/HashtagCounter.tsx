import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, RotateCcw, Hash, TrendingUp, Users, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface HashtagData {
  hashtag: string;
  count: number;
  positions: number[];
  popularity: 'low' | 'medium' | 'high';
}

export const HashtagCounter = () => {
  const [text, setText] = useState("");
  const [showPositions, setShowPositions] = useState(false);

  const hashtagAnalysis = useMemo(() => {
    if (!text.trim()) return { hashtags: [], totalHashtags: 0, uniqueHashtags: 0, totalCharacters: 0 };

    // Find all hashtags in the text
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = text.match(hashtagRegex) || [];
    
    const totalHashtags = matches.length;
    const totalCharacters = matches.join('').length;
    
    // Count hashtags and track positions
    const hashtagCount: { [key: string]: number } = {};
    const hashtagPositions: { [key: string]: number[] } = {};
    
    matches.forEach((hashtag, index) => {
      const normalizedHashtag = hashtag.toLowerCase();
      if (!hashtagCount[normalizedHashtag]) {
        hashtagCount[normalizedHashtag] = 0;
        hashtagPositions[normalizedHashtag] = [];
      }
      hashtagCount[normalizedHashtag]++;
      hashtagPositions[normalizedHashtag].push(index + 1);
    });

    // Determine popularity based on count
    const getPopularity = (count: number): 'low' | 'medium' | 'high' => {
      if (count >= 5) return 'high';
      if (count >= 2) return 'medium';
      return 'low';
    };

    // Create hashtag data
    const hashtags: HashtagData[] = Object.entries(hashtagCount)
      .map(([hashtag, count]) => ({
        hashtag: hashtag,
        count,
        positions: hashtagPositions[hashtag],
        popularity: getPopularity(count)
      }))
      .sort((a, b) => b.count - a.count);

    return {
      hashtags,
      totalHashtags,
      uniqueHashtags: hashtags.length,
      totalCharacters
    };
  }, [text]);

  const copyHashtags = async () => {
    const hashtags = hashtagAnalysis.hashtags.map(h => h.hashtag).join(' ');
    try {
      await navigator.clipboard.writeText(hashtags);
      toast.success("Hashtags copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const copyResults = async () => {
    const results = hashtagAnalysis.hashtags
      .map(h => `${h.hashtag}: ${h.count} time${h.count !== 1 ? 's' : ''}`)
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
  };

  const getPopularityColor = (popularity: string) => {
    switch (popularity) {
      case 'high': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-200 dark:border-green-800';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700';
    }
  };

  const getPopularityIcon = (popularity: string) => {
    switch (popularity) {
      case 'high': return <TrendingUp className="h-3 w-3" />;
      case 'medium': return <Users className="h-3 w-3" />;
      case 'low': return <Hash className="h-3 w-3" />;
      default: return <Hash className="h-3 w-3" />;
    }
  };

  const getPopularityText = (popularity: string) => {
    switch (popularity) {
      case 'high': return 'High Usage';
      case 'medium': return 'Medium Usage';
      case 'low': return 'Low Usage';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hashtag Counter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-input">Text with Hashtags</Label>
            <Textarea
              id="text-input"
              placeholder="Enter your text with hashtags here... #example #hashtag #socialmedia"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-positions"
              checked={showPositions}
              onChange={(e) => setShowPositions(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="show-positions">Show hashtag positions</Label>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={copyHashtags} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
              <Copy className="h-4 w-4" />
              Copy Hashtags
            </Button>
            <Button onClick={copyResults} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
              <Copy className="h-4 w-4" />
              Copy Results
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {hashtagAnalysis.totalHashtags > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Hashtag Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold break-words">{hashtagAnalysis.totalHashtags}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total Hashtags</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold break-words">{hashtagAnalysis.uniqueHashtags}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Unique Hashtags</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold break-words">{hashtagAnalysis.totalCharacters}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total Characters</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold break-words">
                    {hashtagAnalysis.hashtags.length > 0 ? hashtagAnalysis.hashtags[0].count : 0}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Most Used</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Hashtag Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hashtagAnalysis.hashtags.map((hashtag, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-base sm:text-lg font-medium break-all overflow-wrap-anywhere">{hashtag.hashtag}</span>
                        <Badge className={getPopularityColor(hashtag.popularity)}>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            {getPopularityIcon(hashtag.popularity)}
                            {getPopularityText(hashtag.popularity)}
                          </div>
                        </Badge>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground break-words">
                        Used {hashtag.count} time{hashtag.count !== 1 ? 's' : ''}
                        {showPositions && (
                          <span className="break-words"> at position{hashtag.positions.length !== 1 ? 's' : ''}: {hashtag.positions.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary break-all">
                      {hashtag.count}
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
          <CardTitle>Hashtag Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Platform Guidelines:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• <strong>Instagram:</strong> 5-10 hashtags work best, mix popular and niche</li>
                <li>• <strong>Twitter:</strong> 1-2 hashtags to avoid clutter</li>
                <li>• <strong>LinkedIn:</strong> 3-5 professional hashtags</li>
                <li>• <strong>TikTok:</strong> 3-5 trending hashtags</li>
                <li>• <strong>Facebook:</strong> 1-2 hashtags for better reach</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">General Tips:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Use relevant hashtags that describe your content</li>
                <li>• Mix popular hashtags with niche ones</li>
                <li>• Research trending hashtags in your industry</li>
                <li>• Create branded hashtags for your business</li>
                <li>• Avoid hashtag stuffing (too many hashtags)</li>
                <li>• Use hashtags in comments on Instagram to keep captions clean</li>
                <li>• Track hashtag performance and adjust your strategy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Popular Hashtag Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">General:</h4>
              <div className="flex flex-wrap gap-1">
                {['#trending', '#viral', '#fyp', '#explore', '#instagood', '#photooftheday', '#love', '#happy'].map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Business:</h4>
              <div className="flex flex-wrap gap-1">
                {['#entrepreneur', '#business', '#marketing', '#startup', '#success', '#leadership', '#innovation', '#growth'].map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Lifestyle:</h4>
              <div className="flex flex-wrap gap-1">
                {['#lifestyle', '#fashion', '#food', '#travel', '#fitness', '#wellness', '#home', '#family'].map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Tech:</h4>
              <div className="flex flex-wrap gap-1">
                {['#technology', '#ai', '#coding', '#webdev', '#programming', '#tech', '#innovation', '#digital'].map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

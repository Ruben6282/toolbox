import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RotateCcw, Hash } from "lucide-react";

export const HashtagGenerator = () => {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [hashtagCount, setHashtagCount] = useState(10);
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);

  const hashtagDatabase = {
    general: [
      "#trending", "#viral", "#popular", "#fyp", "#explore", "#discover", "#new", "#latest", "#hot", "#cool",
      "#amazing", "#awesome", "#incredible", "#fantastic", "#wonderful", "#beautiful", "#stunning", "#gorgeous",
      "#love", "#like", "#follow", "#share", "#comment", "#instagood", "#photooftheday", "#picoftheday"
    ],
    lifestyle: [
      "#lifestyle", "#life", "#living", "#daily", "#routine", "#motivation", "#inspiration", "#goals", "#dreams",
      "#success", "#happiness", "#positivity", "#mindset", "#selfcare", "#wellness", "#health", "#fitness",
      "#food", "#cooking", "#recipe", "#delicious", "#yummy", "#tasty", "#homemade", "#fresh"
    ],
    travel: [
      "#travel", "#wanderlust", "#adventure", "#explore", "#journey", "#trip", "#vacation", "#holiday", "#getaway",
      "#destination", "#world", "#globe", "#passport", "#suitcase", "#plane", "#flight", "#roadtrip", "#backpack",
      "#culture", "#local", "#authentic", "#experience", "#memories", "#photography", "#landscape", "#nature"
    ],
    fashion: [
      "#fashion", "#style", "#outfit", "#ootd", "#look", "#trend", "#chic", "#elegant", "#stylish", "#fashionista",
      "#clothes", "#dress", "#shirt", "#pants", "#shoes", "#accessories", "#jewelry", "#watch", "#bag", "#handbag",
      "#beauty", "#makeup", "#skincare", "#hair", "#nails", "#glamour", "#glow", "#radiant"
    ],
    business: [
      "#business", "#entrepreneur", "#startup", "#success", "#growth", "#marketing", "#brand", "#branding", "#strategy",
      "#leadership", "#management", "#innovation", "#technology", "#digital", "#online", "#socialmedia", "#networking",
      "#investment", "#finance", "#money", "#wealth", "#goals", "#motivation", "#inspiration", "#mindset"
    ],
    fitness: [
      "#fitness", "#workout", "#gym", "#exercise", "#training", "#muscle", "#strength", "#cardio", "#running", "#cycling",
      "#yoga", "#pilates", "#crossfit", "#bodybuilding", "#health", "#wellness", "#nutrition", "#diet", "#protein",
      "#motivation", "#goals", "#progress", "#transformation", "#fitspo", "#gains", "#strong", "#fit"
    ],
    food: [
      "#food", "#foodie", "#delicious", "#yummy", "#tasty", "#cooking", "#recipe", "#homemade", "#fresh", "#healthy",
      "#breakfast", "#lunch", "#dinner", "#snack", "#dessert", "#sweet", "#savory", "#spicy", "#flavor", "#taste",
      "#restaurant", "#cafe", "#coffee", "#tea", "#drink", "#beverage", "#chef", "#kitchen", "#ingredients"
    ],
    technology: [
      "#tech", "#technology", "#innovation", "#digital", "#ai", "#artificialintelligence", "#machinelearning", "#data",
      "#programming", "#coding", "#developer", "#software", "#app", "#mobile", "#web", "#design", "#ux", "#ui",
      "#startup", "#entrepreneur", "#business", "#future", "#smart", "#automation", "#robotics", "#gadgets"
    ],
    photography: [
      "#photography", "#photo", "#picture", "#image", "#camera", "#lens", "#shot", "#capture", "#moment", "#memory",
      "#portrait", "#landscape", "#nature", "#street", "#urban", "#architecture", "#travel", "#adventure", "#explore",
      "#art", "#creative", "#aesthetic", "#beautiful", "#stunning", "#gorgeous", "#amazing", "#wow"
    ]
  };

  const platforms = [
    { label: "Instagram", value: "instagram", maxHashtags: 30 },
    { label: "Twitter", value: "twitter", maxHashtags: 5 },
    { label: "TikTok", value: "tiktok", maxHashtags: 20 },
    { label: "LinkedIn", value: "linkedin", maxHashtags: 5 },
    { label: "Facebook", value: "facebook", maxHashtags: 10 },
    { label: "Pinterest", value: "pinterest", maxHashtags: 20 }
  ];

  const generateHashtags = () => {
    if (!topic.trim()) return;

    const words = topic.toLowerCase().split(/\s+/);
    const allHashtags: string[] = [];
    
    // Add topic-specific hashtags
    words.forEach(word => {
      if (word.length > 2) {
        allHashtags.push(`#${word}`);
        allHashtags.push(`#${word}s`);
      }
    });

    // Add related hashtags based on topic keywords
    Object.entries(hashtagDatabase).forEach(([category, hashtags]) => {
      if (words.some(word => category.includes(word) || word.includes(category))) {
        allHashtags.push(...hashtags);
      }
    });

    // Add general hashtags
    allHashtags.push(...hashtagDatabase.general);

    // Remove duplicates and shuffle
    const uniqueHashtags = [...new Set(allHashtags)];
    const shuffled = uniqueHashtags.sort(() => Math.random() - 0.5);

    // Limit based on platform
    const platformMax = platforms.find(p => p.value === platform)?.maxHashtags || 30;
    const maxCount = Math.min(hashtagCount, platformMax);
    
    setGeneratedHashtags(shuffled.slice(0, maxCount));
  };

  const copyToClipboard = async (hashtags: string[]) => {
    try {
      await navigator.clipboard.writeText(hashtags.join(' '));
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const copyAllToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedHashtags.join(' '));
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const clearAll = () => {
    setTopic("");
    setGeneratedHashtags([]);
  };

  const getPlatformMax = () => {
    return platforms.find(p => p.value === platform)?.maxHashtags || 30;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hashtag Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic or Keywords</Label>
            <Input
              id="topic"
              placeholder="e.g., fitness, travel, food, business"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Social Media Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label} (max {p.maxHashtags})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hashtag-count">Number of Hashtags</Label>
              <Input
                id="hashtag-count"
                type="number"
                min="1"
                max={getPlatformMax()}
                value={hashtagCount}
                onChange={(e) => setHashtagCount(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Max {getPlatformMax()} for {platforms.find(p => p.value === platform)?.label}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateHashtags} disabled={!topic.trim()}>
              <Hash className="h-4 w-4 mr-2" />
              Generate Hashtags
            </Button>
            <Button onClick={clearAll} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedHashtags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Hashtags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {generatedHashtags.map((hashtag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-200 transition-colors"
                    onClick={() => copyToClipboard([hashtag])}
                  >
                    {hashtag}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>As text:</strong> {generatedHashtags.join(' ')}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Count:</strong> {generatedHashtags.length} hashtags
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyAllToClipboard} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy All Hashtags
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hashtag Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use a mix of popular and niche hashtags for better reach</li>
            <li>• Research trending hashtags in your industry</li>
            <li>• Don't use too many hashtags - it can look spammy</li>
            <li>• Create branded hashtags for your business</li>
            <li>• Use location-based hashtags for local businesses</li>
            <li>• Test different hashtag combinations to see what works</li>
            <li>• Avoid banned or restricted hashtags</li>
            <li>• Keep hashtags relevant to your content</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

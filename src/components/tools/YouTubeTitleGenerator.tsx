import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RotateCcw, Youtube } from "lucide-react";

export const YouTubeTitleGenerator = () => {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("general");
  const [style, setStyle] = useState("clickbait");
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [generatedDescriptions, setGeneratedDescriptions] = useState<string[]>([]);

  const categories = [
    { label: "General", value: "general" },
    { label: "Technology", value: "tech" },
    { label: "Gaming", value: "gaming" },
    { label: "Education", value: "education" },
    { label: "Entertainment", value: "entertainment" },
    { label: "Lifestyle", value: "lifestyle" },
    { label: "Business", value: "business" },
    { label: "Health & Fitness", value: "health" },
    { label: "Food & Cooking", value: "food" },
    { label: "Travel", value: "travel" },
  ];

  const styles = [
    { label: "Clickbait", value: "clickbait" },
    { label: "Professional", value: "professional" },
    { label: "Educational", value: "educational" },
    { label: "Casual", value: "casual" },
    { label: "Tutorial", value: "tutorial" },
    { label: "Review", value: "review" },
  ];

  const titleTemplates = {
    clickbait: [
      "You Won't Believe What Happens When {topic}",
      "The Secret to {topic} That Nobody Talks About",
      "I Tried {topic} for 30 Days - Here's What Happened",
      "This {topic} Hack Will Change Your Life",
      "The Truth About {topic} That Will Shock You",
      "Why Everyone is Wrong About {topic}",
      "The {topic} Method That Actually Works",
      "I Spent $1000 on {topic} - Was It Worth It?",
      "The {topic} Trick That Experts Don't Want You to Know",
      "This {topic} Mistake is Costing You Money"
    ],
    professional: [
      "Complete Guide to {topic}",
      "How to Master {topic} in 2024",
      "Best Practices for {topic}",
      "Understanding {topic}: A Comprehensive Overview",
      "The Future of {topic}",
      "Advanced Techniques in {topic}",
      "Industry Insights: {topic}",
      "Professional {topic} Strategies",
      "Expert Analysis: {topic}",
      "The Science Behind {topic}"
    ],
    educational: [
      "Learn {topic} Step by Step",
      "How to {topic} for Beginners",
      "Understanding {topic}: A Beginner's Guide",
      "The Complete {topic} Tutorial",
      "Master {topic} with These Simple Steps",
      "Everything You Need to Know About {topic}",
      "How to Get Started with {topic}",
      "The Ultimate {topic} Guide",
      "Learn {topic} from Scratch",
      "Your First Steps in {topic}"
    ],
    tutorial: [
      "How to {topic} - Complete Tutorial",
      "Step-by-Step {topic} Guide",
      "Learn {topic} in 10 Minutes",
      "How to {topic} for Beginners",
      "The Easiest Way to {topic}",
      "Quick {topic} Tutorial",
      "How to {topic} Like a Pro",
      "Master {topic} with This Tutorial",
      "How to {topic} - No Experience Required",
      "The Complete {topic} How-To"
    ],
    review: [
      "Honest Review: {topic}",
      "Is {topic} Worth It? My Honest Opinion",
      "Testing {topic} - Here's What I Found",
      "My Experience with {topic}",
      "Should You Buy {topic}? My Review",
      "The Good and Bad of {topic}",
      "My Honest Thoughts on {topic}",
      "Testing {topic} for 30 Days",
      "Is {topic} Overhyped? My Review",
      "The Real Truth About {topic}"
    ],
    casual: [
      "Let's Talk About {topic}",
      "My Thoughts on {topic}",
      "Why I Love {topic}",
      "The {topic} Experience",
      "What I Learned About {topic}",
      "My {topic} Journey",
      "The {topic} Story",
      "Why {topic} Matters",
      "The {topic} Reality",
      "My Take on {topic}"
    ]
  };

  const descriptionTemplates = [
    "In this video, I'll show you everything you need to know about {topic}. Whether you're a beginner or looking to improve your skills, this comprehensive guide covers all the essential aspects.",
    "Welcome to this in-depth look at {topic}. I'll break down the key concepts, share practical tips, and provide real-world examples to help you understand and apply what you learn.",
    "Today we're diving deep into {topic}. From the basics to advanced techniques, I'll cover everything you need to know to get started and succeed.",
    "In this comprehensive tutorial on {topic}, I'll walk you through step-by-step instructions, share insider tips, and help you avoid common mistakes.",
    "Join me as I explore {topic} and share my insights, experiences, and practical advice. Whether you're new to this or looking to level up, there's something here for everyone."
  ];

  const generateTitles = () => {
    if (!topic.trim()) return;

    const templates = titleTemplates[style as keyof typeof titleTemplates] || titleTemplates.clickbait;
    const titles: string[] = [];

    // Generate 5 titles
    for (let i = 0; i < 5; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const title = template.replace(/{topic}/g, topic);
      titles.push(title);
    }

    setGeneratedTitles(titles);
  };

  const generateDescriptions = () => {
    if (!topic.trim()) return;

    const descriptions: string[] = [];

    // Generate 3 descriptions
    for (let i = 0; i < 3; i++) {
      const template = descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)];
      const description = template.replace(/{topic}/g, topic);
      descriptions.push(description);
    }

    setGeneratedDescriptions(descriptions);
  };

  const generateAll = () => {
    generateTitles();
    generateDescriptions();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const clearAll = () => {
    setTopic("");
    setGeneratedTitles([]);
    setGeneratedDescriptions([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>YouTube Title & Description Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Video Topic</Label>
            <Input
              id="topic"
              placeholder="e.g., cooking pasta, learning guitar, productivity tips"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Title Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={generateAll} disabled={!topic.trim()} className="w-full sm:w-auto">
              Generate Titles & Descriptions
            </Button>
            <Button onClick={generateTitles} disabled={!topic.trim()} variant="outline" className="w-full sm:w-auto">
              Generate Titles Only
            </Button>
            <Button onClick={generateDescriptions} disabled={!topic.trim()} variant="outline" className="w-full sm:w-auto">
              Generate Descriptions Only
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedTitles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Titles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedTitles.map((title, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted p-3 rounded-lg gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Youtube className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-sm sm:text-base break-words">{title}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(title)}
                  className="w-full sm:w-auto"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {generatedDescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Descriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedDescriptions.map((description, index) => (
              <div key={index} className="bg-muted p-3 sm:p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-sm flex-1 break-words">{description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(description)}
                    className="w-full sm:w-auto"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>YouTube SEO Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Keep titles under 60 characters for better mobile display</li>
            <li>• Use keywords naturally in your title and description</li>
            <li>• Include a call-to-action in your description</li>
            <li>• Add relevant hashtags (up to 15) at the end of your description</li>
            <li>• Use timestamps in descriptions for longer videos</li>
            <li>• Include links to related videos and playlists</li>
            <li>• Write descriptions that are at least 200 words for better SEO</li>
            <li>• Use eye-catching thumbnails that complement your title</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

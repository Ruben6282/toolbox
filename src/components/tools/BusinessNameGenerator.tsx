import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, RotateCcw, RefreshCw, Sparkles, ExternalLink, Star } from "lucide-react";
import { notify } from "@/lib/notify";

interface GeneratedName {
  name: string;
  domain: string;
  type: string;
  favorite: boolean;
}

export const BusinessNameGenerator = () => {
  const [keyword, setKeyword] = useState("");
  const [nameCount, setNameCount] = useState(15);
  const [industry, setIndustry] = useState("general");
  const [nameStyle, setNameStyle] = useState("all");
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Enhanced industry-specific keywords with verbs, adjectives, and nouns
  const industries = {
    general: {
      core: ["Venture", "Enterprise", "Group", "Alliance", "Collective", "Network", "Dynamics", "Solutions", "Partners"],
      modifiers: ["Prime", "Elite", "Pro", "Core", "Global", "United", "True", "Grand", "Peak"],
      verbs: ["Build", "Create", "Drive", "Launch", "Elevate", "Innovate", "Transform"],
    },
    tech: {
      core: ["Tech", "Labs", "Digital", "Systems", "Cloud", "Data", "Soft", "Code", "Byte", "Logic", "Pixel"],
      modifiers: ["Smart", "Quantum", "Neural", "Cyber", "Meta", "Swift", "Flux", "Rapid", "Nexus"],
      verbs: ["Connect", "Sync", "Link", "Stream", "Deploy", "Compute", "Analyze"],
      suffixes: ["AI", "io", "ly", "ify", "hub", "flow", "verse", "stack"],
    },
    healthcare: {
      core: ["Health", "Care", "Med", "Vital", "Life", "Pulse", "Wellness", "Heal", "Thrive", "Remedy"],
      modifiers: ["Pure", "Natural", "Holistic", "Premier", "Complete", "Total", "Advanced"],
      verbs: ["Heal", "Restore", "Revive", "Nurture", "Thrive"],
    },
    finance: {
      core: ["Capital", "Finance", "Wealth", "Asset", "Equity", "Fund", "Trust", "Bank", "Invest", "Coin"],
      modifiers: ["Prime", "Smart", "Secure", "United", "Global", "Peak", "Wise", "Safe"],
      verbs: ["Grow", "Prosper", "Secure", "Build", "Invest", "Trust"],
    },
    retail: {
      core: ["Shop", "Store", "Market", "Boutique", "Outlet", "Emporium", "Plaza", "Bazaar", "Gallery"],
      modifiers: ["Fresh", "Urban", "Modern", "Classic", "Elegant", "Trendy", "Chic"],
      verbs: ["Shop", "Buy", "Browse", "Discover", "Find"],
    },
    food: {
      core: ["Kitchen", "Cafe", "Bistro", "Grill", "Taste", "Flavor", "Spice", "Dish", "Plate", "Fork"],
      modifiers: ["Fresh", "Gourmet", "Artisan", "Rustic", "Urban", "Golden", "Green", "Savory"],
      verbs: ["Savor", "Taste", "Cook", "Bake", "Brew", "Roast"],
    },
    creative: {
      core: ["Studio", "Design", "Creative", "Media", "Art", "Vision", "Canvas", "Palette", "Craft"],
      modifiers: ["Bold", "Vivid", "Bright", "Epic", "Wild", "Fresh", "Pure", "True"],
      verbs: ["Create", "Design", "Craft", "Build", "Imagine", "Envision"],
    },
    consulting: {
      core: ["Consulting", "Advisors", "Partners", "Strategy", "Insight", "Vision", "Guide", "Path"],
      modifiers: ["Strategic", "Expert", "Premier", "Elite", "Trusted", "Leading"],
      verbs: ["Guide", "Advise", "Lead", "Transform", "Optimize"],
    },
  };

  type IndustryData = {
    core: string[];
    modifiers: string[];
    verbs: string[];
    suffixes?: string[];
  };

  const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const generateDomainSuggestion = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  };

  const generateCompoundName = (industryData: IndustryData, keyword: string): string => {
    const words = keyword ? [capitalize(keyword)] : [];
    const modifier = getRandom(industryData.modifiers);
    const core = getRandom(industryData.core);
    
    const patterns = [
      [modifier, core],
      [keyword ? capitalize(keyword) : modifier, core],
      [core, modifier],
    ];
    
    const selected = getRandom(patterns).filter(Boolean);
    return selected.join("");
  };

  const generatePhraseName = (industryData: IndustryData, keyword: string): string => {
    const modifier = getRandom(industryData.modifiers);
    const core = getRandom(industryData.core);
    const kw = keyword ? capitalize(keyword) : modifier;
    
    const patterns = [
      `${kw} ${core}`,
      `The ${kw} ${core}`,
      `${modifier} ${core}`,
      `${kw} ${core} Co.`,
      `${modifier} ${kw}`,
    ];
    
    return getRandom(patterns);
  };

  const generateVerbName = (industryData: IndustryData, keyword: string): string => {
    if (!industryData.verbs || industryData.verbs.length === 0) return generatePhraseName(industryData, keyword);
    
    const verb = getRandom(industryData.verbs);
    const core = getRandom(industryData.core);
    const kw = keyword ? capitalize(keyword) : core;
    
    const patterns = [
      `${verb}${kw}`,
      `${verb} ${core}`,
      `${kw}${verb}`,
    ];
    
    return getRandom(patterns);
  };

  const generateShortName = (industryData: IndustryData, keyword: string): string => {
    const suffix = industryData.suffixes ? getRandom(industryData.suffixes) : "io";
    const coreWord = getRandom(industryData.core);
    const kw = keyword ? keyword.toLowerCase() : coreWord.toLowerCase();
    const base = kw.slice(0, Math.min(6, kw.length));
    
    return base + suffix;
  };

  const generateAcronymName = (keyword: string): string => {
    if (!keyword || keyword.length < 3) return "";
    const words = keyword.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2) {
      return words.map(w => w[0].toUpperCase()).join("");
    }
    return keyword.slice(0, 3).toUpperCase() + getRandom(["Labs", "Tech", "Group", "Co"]);
  };

  const generateCreativeName = (industryData: IndustryData, keyword: string): string => {
    const vowels = "aeiou";
    const consonants = "bcdfghjklmnpqrstvwxyz";
    const core = keyword || getRandom(industryData.core);
    const base = core.toLowerCase();
    
    // Create a pronounceable blend
    let creative = "";
    for (let i = 0; i < 6; i++) {
      if (i % 2 === 0) {
        creative += getRandom(consonants.split(""));
      } else {
        creative += getRandom(vowels.split(""));
      }
    }
    
    return capitalize(creative) + (industryData.suffixes ? getRandom(industryData.suffixes) : "");
  };

  const generateBusinessName = (type: string): GeneratedName => {
    const industryData = industries[industry as keyof typeof industries];
    let name = "";
    let nameType = type;

    if (type === "compound" || type === "all") {
      name = generateCompoundName(industryData, keyword);
      nameType = "Compound";
    } else if (type === "phrase" || (type === "all" && Math.random() > 0.7)) {
      name = generatePhraseName(industryData, keyword);
      nameType = "Phrase";
    } else if (type === "verb" || (type === "all" && Math.random() > 0.6)) {
      name = generateVerbName(industryData, keyword);
      nameType = "Action";
    } else if (type === "short" || (type === "all" && Math.random() > 0.5)) {
      name = generateShortName(industryData, keyword);
      nameType = "Short";
    } else if (type === "acronym" && keyword) {
      name = generateAcronymName(keyword);
      nameType = "Acronym";
    } else if (type === "creative" || (type === "all" && Math.random() > 0.4)) {
      name = generateCreativeName(industryData, keyword);
      nameType = "Creative";
    } else {
      name = generatePhraseName(industryData, keyword);
      nameType = "Phrase";
    }

    return {
      name,
      domain: generateDomainSuggestion(name),
      type: nameType,
      favorite: false,
    };
  };

  const generateNames = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const uniqueNames = new Map<string, GeneratedName>();
      let safety = 0;
      
      while (uniqueNames.size < nameCount && safety < nameCount * 20) {
        const generated = generateBusinessName(nameStyle);
        if (generated.name && generated.name.length >= 3 && generated.name.length <= 40) {
          uniqueNames.set(generated.name.toLowerCase(), generated);
        }
        safety++;
      }
      
      setGeneratedNames(Array.from(uniqueNames.values()));
      setIsGenerating(false);
      notify.success(`Generated ${uniqueNames.size} unique business names!`);
    }, 100);
  };

  const toggleFavorite = (index: number) => {
    const updated = [...generatedNames];
    updated[index].favorite = !updated[index].favorite;
    setGeneratedNames(updated);
  };

  const copyToClipboard = async (text: string, label: string = "Name") => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        notify.success(`${label} copied to clipboard!`);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          notify.success(`${label} copied to clipboard!`);
        } catch {
          notify.error("Failed to copy");
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch {
      notify.error("Failed to copy");
    }
  };

  const copyAllToClipboard = async () => {
    if (generatedNames.length === 0) return;
    const text = generatedNames.map(n => `${n.name} (${n.domain})`).join("\n");
    await copyToClipboard(text, "All names");
  };

  const copyFavoritesToClipboard = async () => {
    const favorites = generatedNames.filter(n => n.favorite);
    if (favorites.length === 0) {
      notify.error("No favorites selected");
      return;
    }
    const text = favorites.map(n => `${n.name} (${n.domain})`).join("\n");
    await copyToClipboard(text, "Favorites");
  };

  const clearNames = () => {
    setGeneratedNames([]);
    notify.success("Cleared all names");
  };

  const favoriteCount = generatedNames.filter(n => n.favorite).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Business Name Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Keyword or Theme (optional)</Label>
            <Input
              placeholder="e.g. Cloud, Innovation, Swift..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Enter a word that describes your business, or leave blank for random suggestions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="food">Food & Beverage</SelectItem>
                  <SelectItem value="creative">Creative & Design</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Name Style</Label>
              <Select value={nameStyle} onValueChange={setNameStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles (Mix)</SelectItem>
                  <SelectItem value="compound">Compound (TechVenture)</SelectItem>
                  <SelectItem value="phrase">Phrase (Smart Solutions)</SelectItem>
                  <SelectItem value="short">Short & Modern (Techify)</SelectItem>
                  <SelectItem value="verb">Action-Based (BuildTech)</SelectItem>
                  <SelectItem value="creative">Creative Blend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of Names</Label>
              <Input
                type="number"
                min={5}
                max={50}
                value={nameCount}
                onChange={(e) =>
                  setNameCount(Math.min(50, Math.max(5, parseInt(e.target.value) || 15)))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={generateNames} 
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Names
                </>
              )}
            </Button>
            {generatedNames.length > 0 && (
              <>
                <Button onClick={generateNames} variant="outline" disabled={isGenerating}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
                </Button>
                <Button onClick={clearNames} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" /> Clear
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {generatedNames.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3">
              <CardTitle>
                Generated Names ({generatedNames.length})
              </CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                <div>
                  {favoriteCount > 0 && (
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                      {favoriteCount} favorites
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {favoriteCount > 0 && (
                    <Button size="sm" variant="outline" onClick={copyFavoritesToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Favorites
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={copyAllToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedNames.map((item, i) => (
                <div
                  key={i}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border transition-all ${
                    item.favorite ? "bg-amber-50 dark:bg-amber-950/10 border-amber-300 dark:border-amber-700/50" : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg break-words">{item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-mono break-all">{item.domain}</span>
                      <a
                        href={`https://${item.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        title="Check domain availability"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={item.favorite ? "default" : "outline"}
                      onClick={() => toggleFavorite(i)}
                      title={item.favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star className={`h-4 w-4 ${item.favorite ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(item.name, "Name")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tips for Choosing a Business Name</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Keep it short, memorable, and easy to spell</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Check domain availability before finalizing (click the link icon)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Make sure it's not trademarked or already in use</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Consider how it sounds when spoken aloud</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Choose a name that can grow with your business</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Test it with potential customers for feedback</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

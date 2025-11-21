import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RotateCcw, RefreshCw, Sparkles, ExternalLink, Star } from "lucide-react";
import { notify } from "@/lib/notify";

/* ------------------------------------------------------------------
   CONSTANTS & TYPES
------------------------------------------------------------------ */

type Style =
  | "all"
  | "compound"
  | "phrase"
  | "short"
  | "verb"
  | "creative"
  | "acronym";

type Industry =
  | "general"
  | "tech"
  | "healthcare"
  | "finance"
  | "retail"
  | "food"
  | "creative"
  | "consulting";

interface GeneratedName {
  name: string;
  domain: string;
  type: string;
  favorite: boolean;
}

const MIN_NAMES = 5;
const MAX_NAMES = 50;

/* ------------------------------------------------------------------
   HELPERS
------------------------------------------------------------------ */

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const sanitizeKeyword = (val: string) =>
  val.replace(/[^-a-zA-Z0-9 ']/g, "").trim().slice(0, 60);

const secureRandom = (max: number) => {
  const arr = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;

  while (true) {
    crypto.getRandomValues(arr);
    if (arr[0] < limit) return arr[0] % max;
  }
};

const pick = <T,>(arr: ArrayLike<T>) => arr[secureRandom(arr.length)] as T;
const pickChar = (s: string) => s[secureRandom(s.length)];

const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const generateDomain = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";

/* ------------------------------------------------------------------
   WORD LISTS (clean + deduplicated)
------------------------------------------------------------------ */

const adjectives = [
  "cool", "awesome", "amazing", "brilliant", "creative", "dynamic", "epic",
  "fantastic", "genius", "heroic", "incredible", "jovial", "keen", "legendary",
  "magnificent", "noble", "outstanding", "powerful", "quick", "radiant",
  "stellar", "titanic", "ultimate", "vibrant", "wonderful", "xenial",
  "youthful", "zealous"
];

const nouns = [
  "warrior", "ninja", "wizard", "knight", "hero", "champion", "legend",
  "master", "phoenix", "dragon", "tiger", "eagle", "wolf", "lion", "bear",
  "hunter", "explorer", "adventurer", "guardian", "protector", "savior",
  "guru", "sensei", "mentor", "leader"
];

const techWords = [
  "code", "byte", "pixel", "data", "cyber", "digital", "virtual", "quantum",
  "binary", "algorithm", "matrix", "neural", "crypto", "blockchain", "cloud",
  "server", "client", "database", "network", "protocol", "interface", "system"
];

const natureWords = [
  "forest", "mountain", "ocean", "river", "valley", "canyon", "meadow", "garden",
  "flower", "tree", "leaf", "stone", "crystal", "gem", "star", "moon", "sun",
  "sky", "cloud", "rain", "snow", "wind", "fire", "earth", "water"
];

const numbers = "0123456789";
const vowels = "aeiou";
const consonants = "bcdfghjklmnpqrstvwxyz";

/* ------------------------------------------------------------------
   INDUSTRY CONFIG
------------------------------------------------------------------ */

const INDUSTRIES: Record<
  Industry,
  {
    core: string[];
    modifiers: string[];
    verbs: string[];
    suffixes?: string[];
  }
> = {
  general: {
    core: ["Venture", "Enterprise", "Group", "Alliance", "Dynamics", "Network", "Partners"],
    modifiers: ["Prime", "Elite", "Global", "Peak", "True", "Grand"],
    verbs: ["Build", "Create", "Drive", "Launch", "Elevate"],
  },
  tech: {
    core: ["Tech", "Labs", "Digital", "Systems", "Cloud", "Data", "Logic"],
    modifiers: ["Smart", "Quantum", "Neural", "Cyber", "Swift", "Nexus"],
    verbs: ["Connect", "Sync", "Deploy", "Compute"],
    suffixes: ["AI", "io", "ly", "ify", "hub", "flow"],
  },
  healthcare: {
    core: ["Health", "Care", "Vital", "Life", "Pulse", "Wellness"],
    modifiers: ["Pure", "Advanced", "Premier"],
    verbs: ["Heal", "Restore", "Revive"],
  },
  finance: {
    core: ["Capital", "Wealth", "Equity", "Fund", "Bank", "Invest"],
    modifiers: ["Prime", "Secure", "United"],
    verbs: ["Grow", "Prosper", "Secure"],
  },
  retail: {
    core: ["Shop", "Store", "Market", "Plaza", "Boutique"],
    modifiers: ["Fresh", "Urban", "Modern"],
    verbs: ["Shop", "Buy", "Discover"],
  },
  food: {
    core: ["Kitchen", "Cafe", "Bistro", "Flavor", "Taste"],
    modifiers: ["Fresh", "Gourmet", "Artisan"],
    verbs: ["Cook", "Brew", "Savor"],
  },
  creative: {
    core: ["Studio", "Design", "Creative", "Media", "Canvas"],
    modifiers: ["Bold", "Vivid", "Bright"],
    verbs: ["Create", "Design", "Imagine"],
  },
  consulting: {
    core: ["Consulting", "Advisors", "Strategy", "Insight"],
    modifiers: ["Elite", "Trusted"],
    verbs: ["Guide", "Advise", "Lead"],
  },
};

/* ------------------------------------------------------------------
   NAME GENERATION FUNCTIONS
------------------------------------------------------------------ */

type IndustryConfig = {
  core: string[];
  modifiers: string[];
  verbs: string[];
  suffixes?: string[];
};

const makeCompound = (d: IndustryConfig, kw: string) =>
  [kw || pick(d.modifiers), pick(d.core)].filter(Boolean).join("");

const makePhrase = (d: IndustryConfig, kw: string) =>
  pick([
    `${kw} ${pick(d.core)}`,
    `${pick(d.modifiers)} ${pick(d.core)}`,
    `The ${kw || pick(d.modifiers)} ${pick(d.core)}`,
  ]);

const makeVerb = (d: IndustryConfig, kw: string) =>
  pick([
    `${pick(d.verbs)}${kw || pick(d.core)}`,
    `${pick(d.verbs)} ${pick(d.core)}`,
  ]);

const makeShort = (d: IndustryConfig, kw: string) => {
  const suffix = d.suffixes ? pick(d.suffixes) : "io";
  const base = (kw || pick(d.core)).toLowerCase().slice(0, 6);
  return base + suffix;
};

const makeAcronym = (kw: string) => {
  const words = kw.split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.map(w => w[0].toUpperCase()).join("");
  return kw.slice(0, 3).toUpperCase() + pick(["Tech", "Group", "Co", "Labs"]);
};

const makeCreative = (d: IndustryConfig) => {
  let s = "";
  for (let i = 0; i < 6; i++)
    s += i % 2 ? pick(vowels) : pick(consonants);
  return capitalize(s) + (d.suffixes ? pick(d.suffixes) : "");
};

const generateName = (
  style: Style,
  industry: Industry,
  keyword: string
): GeneratedName => {
  const d = INDUSTRIES[industry];
  const kw = keyword ? capitalize(keyword) : "";

  let name = "";
  let type = "";

  switch (style) {
    case "compound":
      name = makeCompound(d, kw);
      type = "Compound";
      break;
    case "phrase":
      name = makePhrase(d, kw);
      type = "Phrase";
      break;
    case "verb":
      name = makeVerb(d, kw);
      type = "Action";
      break;
    case "short":
      name = makeShort(d, kw);
      type = "Short";
      break;
    case "acronym":
      name = makeAcronym(kw);
      type = "Acronym";
      break;
    case "creative":
      name = makeCreative(d);
      type = "Creative";
      break;
    default:
      // mix of styles
      return generateName(
        pick(["compound", "phrase", "short", "verb", "creative"]) as Style,
        industry,
        keyword
      );
  }

  return {
    name,
    domain: generateDomain(name),
    type,
    favorite: false,
  };
};

/* ------------------------------------------------------------------
   COMPONENT
------------------------------------------------------------------ */

export const BusinessNameGenerator = () => {
  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState<Industry>("general");
  const [style, setStyle] = useState<Style>("all");
  // Allow the Number of Results input to be temporarily empty while typing
  const [count, setCount] = useState<string>("15");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedName[]>([]);

  const generateMany = useCallback(() => {
    setIsGenerating(true);

    setTimeout(() => {
      const parsed = Number(count);
      const limit = clamp(parsed || MIN_NAMES, MIN_NAMES, MAX_NAMES);
      const names = new Map<string, GeneratedName>();
      let tries = 0;

      while (names.size < limit && tries < limit * 15) {
        const n = generateName(style, industry, keyword);
        if (n.name.length >= 3) names.set(n.name.toLowerCase(), n);
        tries++;
      }

      setGenerated([...names.values()]);
      setIsGenerating(false);
      notify.success(`Generated ${names.size} business names!`);
    }, 120);
  }, [count, style, industry, keyword]);

  const toggleFav = (i: number) => {
    setGenerated(g => {
      const copy = [...g];
      copy[i] = { ...copy[i], favorite: !copy[i].favorite };
      return copy;
    });
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify.success("Copied!");
    } catch {
      notify.error("Failed to copy");
    }
  };

  const copyAll = () =>
    copy(generated.map(n => `${n.name} (${n.domain})`).join("\n"));

  const copyFavs = () => {
    const favs = generated.filter(n => n.favorite);
    if (!favs.length) return notify.error("No favorites selected");
    copy(favs.map(n => `${n.name} (${n.domain})`).join("\n"));
  };

  const favCount = generated.filter(n => n.favorite).length;

  /* ------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------ */

  return (
    <div className="space-y-6">

      {/* INPUT CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Business Name Generator
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Keyword */}
          <div className="space-y-2">
            <Label>Keyword (optional)</Label>
            <Input
              placeholder="e.g. Cloud, Nexus, Prime..."
              value={keyword}
              onChange={(e) => setKeyword(sanitizeKeyword(e.target.value))}
            />
          </div>

          {/* Selects */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Industry</Label>
              <Select value={industry} onValueChange={(v) => setIndustry(v as Industry)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(INDUSTRIES) as Industry[]).map(k => (
                    <SelectItem key={k} value={k as Industry}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Name Style</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as Style)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Mixed Styles</SelectItem>
                  <SelectItem value="compound">Compound</SelectItem>
                  <SelectItem value="phrase">Phrase</SelectItem>
                  <SelectItem value="short">Short + Modern</SelectItem>
                  <SelectItem value="verb">Action-Based</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="acronym">Acronym</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Number of Results</Label>
              <Input
                type="number"
                min={MIN_NAMES}
                max={MAX_NAMES}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                onBlur={() => {
                  const n = Number(count);
                  setCount(String(clamp(n || MIN_NAMES, MIN_NAMES, MAX_NAMES)));
                }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button disabled={isGenerating} onClick={generateMany}>
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>

            {generated.length > 0 && (
              <>
                <Button variant="outline" onClick={generateMany}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
                </Button>
                <Button variant="outline" onClick={() => setGenerated([])}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Clear
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* OUTPUT CARD */}
      {generated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Generated Names ({generated.length})
              {favCount > 0 && (
                <Badge className="ml-2 flex items-center">
                  <Star className="h-3 w-3 mr-1" /> {favCount} favorites
                </Badge>
              )}
              <div className="ml-auto hidden sm:flex gap-2">
                {favCount > 0 && (
                  <Button size="sm" variant="outline" onClick={copyFavs}>
                    <Copy className="h-4 w-4 mr-2" /> Copy Favorites
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={copyAll}>
                  <Copy className="h-4 w-4 mr-2" /> Copy All
                </Button>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {generated.map((item, i) => (
              <div
                key={i}
                className={`flex flex-col sm:flex-row justify-between gap-3 p-4 rounded-lg border ${
                  item.favorite
                    ? "bg-amber-50 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700"
                    : "bg-muted/50 dark:bg-muted/800"
                }`}
              >
                <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-lg break-all max-w-full">
                        {item.name}
                      </span>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {item.type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      <span className="font-mono break-all max-w-full">{item.domain}</span>
                      <a
                        href={`https://${item.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 flex-shrink-0"
                      >
                        <ExternalLink className="h-4 w-4 text-primary" />
                      </a>
                    </div>
                  </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={item.favorite ? "default" : "outline"}
                    onClick={() => toggleFav(i)}
                  >
                    <Star className={`h-4 w-4 ${item.favorite ? "fill-current" : ""}`} />
                  </Button>

                  <Button size="sm" variant="outline" onClick={() => copy(item.name)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TIPS */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Naming a Business</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Keep it short and memorable</li>
            <li>• Check domain availability</li>
            <li>• Avoid trademark conflicts</li>
            <li>• Choose a name that can scale with your brand</li>
            <li>• Test the name with real people</li>
          </ul>
        </CardContent>
      </Card>

    </div>
  );
};

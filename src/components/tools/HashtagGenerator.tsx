import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, RotateCcw, Hash } from "lucide-react";
import { notify } from "@/lib/notify";

/* -------------------------------------------------------------
   CONSTANTS
------------------------------------------------------------- */

const MAX_TOPIC_LENGTH = 200;
const MIN_COUNT = 1;
const MAX_COUNT = 50;

const ALLOWED_PLATFORMS = [
  "instagram",
  "twitter",
  "tiktok",
  "linkedin",
  "facebook",
  "pinterest",
] as const;

type Platform = (typeof ALLOWED_PLATFORMS)[number];

const PLATFORM_CONFIGS = [
  { label: "Instagram", value: "instagram", max: 30 },
  { label: "Twitter", value: "twitter", max: 5 },
  { label: "TikTok", value: "tiktok", max: 20 },
  { label: "LinkedIn", value: "linkedin", max: 5 },
  { label: "Facebook", value: "facebook", max: 10 },
  { label: "Pinterest", value: "pinterest", max: 20 },
] satisfies { label: string; value: Platform; max: number }[];

/* -------------------------------------------------------------
   HASHTAG DATABASE
------------------------------------------------------------- */

const HASHTAG_DB: Record<string, string[]> = {
  general: [
    "#trending", "#viral", "#popular", "#fyp", "#explore", "#discover",
    "#new", "#latest", "#hot", "#cool", "#amazing", "#awesome", "#incredible",
    "#fantastic", "#wonderful", "#beautiful", "#stunning", "#gorgeous",
    "#love", "#like", "#follow", "#share", "#comment", "#instagood",
    "#photooftheday", "#picoftheday",
  ],
  lifestyle: [
    "#lifestyle", "#life", "#living", "#daily", "#routine", "#motivation",
    "#inspiration", "#goals", "#dreams", "#success", "#happiness",
    "#positivity", "#mindset", "#selfcare", "#wellness", "#health",
    "#fitness", "#food", "#cooking", "#recipe", "#delicious", "#yummy",
    "#tasty", "#homemade", "#fresh",
  ],
  travel: [
    "#travel", "#wanderlust", "#adventure", "#explore", "#journey", "#trip",
    "#vacation", "#holiday", "#getaway", "#destination", "#world", "#globe",
    "#passport", "#suitcase", "#plane", "#flight", "#roadtrip", "#backpack",
    "#culture", "#local", "#authentic", "#experience", "#memories",
    "#photography", "#landscape", "#nature",
  ],
  fashion: [
    "#fashion", "#style", "#outfit", "#ootd", "#look", "#trend", "#chic",
    "#elegant", "#stylish", "#fashionista", "#clothes", "#dress", "#shirt",
    "#pants", "#shoes", "#accessories", "#jewelry", "#watch", "#bag",
    "#handbag", "#beauty", "#makeup", "#skincare", "#hair", "#nails",
    "#glamour", "#glow", "#radiant",
  ],
  business: [
    "#business", "#entrepreneur", "#startup", "#success", "#growth",
    "#marketing", "#brand", "#branding", "#strategy", "#leadership",
    "#management", "#innovation", "#technology", "#digital", "#online",
    "#socialmedia", "#networking", "#investment", "#finance", "#money",
    "#wealth", "#goals", "#motivation", "#inspiration", "#mindset",
  ],
  fitness: [
    "#fitness", "#workout", "#gym", "#exercise", "#training", "#muscle",
    "#strength", "#cardio", "#running", "#cycling", "#yoga", "#pilates",
    "#crossfit", "#bodybuilding", "#health", "#wellness", "#nutrition",
    "#diet", "#protein", "#motivation", "#goals", "#progress",
    "#transformation", "#fitspo", "#gains", "#strong", "#fit",
  ],
  food: [
    "#food", "#foodie", "#delicious", "#yummy", "#tasty", "#cooking",
    "#recipe", "#homemade", "#fresh", "#healthy", "#breakfast", "#lunch",
    "#dinner", "#snack", "#dessert", "#sweet", "#savory", "#spicy",
    "#flavor", "#taste", "#restaurant", "#cafe", "#coffee", "#tea",
    "#drink", "#beverage", "#chef", "#kitchen", "#ingredients",
  ],
  technology: [
    "#tech", "#technology", "#innovation", "#digital", "#ai",
    "#artificialintelligence", "#machinelearning", "#data", "#programming",
    "#coding", "#developer", "#software", "#app", "#mobile", "#web",
    "#design", "#ux", "#ui", "#startup", "#entrepreneur", "#business",
    "#future", "#smart", "#automation", "#robotics", "#gadgets",
  ],
  photography: [
    "#photography", "#photo", "#picture", "#image", "#camera", "#lens",
    "#shot", "#capture", "#moment", "#memory", "#portrait", "#landscape",
    "#nature", "#street", "#urban", "#architecture", "#travel",
    "#adventure", "#explore", "#art", "#creative", "#aesthetic",
    "#beautiful", "#stunning", "#gorgeous", "#amazing", "#wow",
  ],
};


/* -------------------------------------------------------------
   HELPERS (Sanitization + Randomness)
------------------------------------------------------------- */

// Unicode-safe topic sanitizer
const sanitizeTopic = (input: string): string =>
  [...input] // spreads into Unicode codepoints
    .filter((ch) => ch >= " " || ch === "\n" || ch === "\t")
    .join("")
    .slice(0, MAX_TOPIC_LENGTH);

// Ensure valid platform
const coercePlatform = (v: string): Platform =>
  ALLOWED_PLATFORMS.includes(v as Platform) ? (v as Platform) : "instagram";

// Clamp number safely
const clamp = (v: number, max: number): number =>
  Math.max(MIN_COUNT, Math.min(max, Math.floor(v || MIN_COUNT)));

// Crypto-safe random int
const randInt = (max: number): number => {
  const arr = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;
  while (true) {
    crypto.getRandomValues(arr);
    if (arr[0] < limit) return arr[0] % max;
  }
};

// Crypto Fisher-Yates shuffle
const shuffle = <T,>(a: T[]): T[] => {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Clipboard helper
const copyText = async (text: string, ok: string, err: string) => {
  try {
    await navigator.clipboard.writeText(text);
    notify.success(ok);
  } catch (e) {
    console.error(e);
    notify.error(err);
  }
};


/* -------------------------------------------------------------
   COMPONENT
------------------------------------------------------------- */

export const HashtagGenerator = () => {
  const [topic, setTopic] = useState("");
  const [platform, setPlatformState] = useState<Platform>("instagram");
  const [count, setCount] = useState(10);
  const [tags, setTags] = useState<string[]>([]);

  // Platform config lookup
  const platformCfg = useMemo(
    () => PLATFORM_CONFIGS.find((p) => p.value === platform)!,
    [platform]
  );

  // Setting platform must also clamp hashtag count (no extra useEffect)
  const setPlatform = (p: Platform) => {
    const cfg = PLATFORM_CONFIGS.find((x) => x.value === p)!;
    setPlatformState(p);
    setCount((prev) => clamp(prev, cfg.max));
  };

  /* -------------------------------------------------------------
     GENERATE
  ------------------------------------------------------------- */
  const generate = useCallback(() => {
    const clean = topic.trim();
    if (!clean) return;

    const words = clean.toLowerCase().split(/\s+/).filter(Boolean);

    const bucket = new Set<string>();

    // Topic keywords
    for (const w of words) {
      if (w.length > 2) {
        bucket.add(`#${w}`);
        bucket.add(`#${w}s`);
      }
    }

    // Fuzzy category matching
    for (const [category, list] of Object.entries(HASHTAG_DB)) {
      if (words.some((w) => w.includes(category) || category.includes(w))) {
        list.forEach((h) => bucket.add(h));
      }
    }

    // Always add general set
    HASHTAG_DB.general.forEach((h) => bucket.add(h));

    // Shuffle + limit
    const final = shuffle([...bucket]).slice(0, clamp(count, platformCfg.max));

    setTags(final);
    notify.success(`Generated ${final.length} hashtags!`);
  }, [topic, count, platformCfg.max]);

  const clear = () => {
    setTopic("");
    setTags([]);
    notify.success("Cleared all hashtags!");
  };


  /* -------------------------------------------------------------
     RENDER
  ------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* INPUT CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Hashtag Generator</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* TOPIC INPUT */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic or Keywords</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(sanitizeTopic(e.target.value))}
              maxLength={MAX_TOPIC_LENGTH}
              placeholder="e.g., fitness, travel, food, business"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PLATFORM SELECT */}
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(coercePlatform(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_CONFIGS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label} (max {p.max})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* COUNT */}
            <div className="space-y-2">
              <Label>Number of Hashtags</Label>
              <Input
                type="number"
                min={MIN_COUNT}
                max={platformCfg.max}
                inputMode="numeric"
                value={Number.isNaN(count) ? "" : String(count)}
                onChange={(e) => {
                  const raw = e.target.value;

                  // allow temporary clearing
                  if (raw === "") {
                    setCount(NaN); // still a number, no any
                    return;
                  }

                  // digits only
                  if (!/^\d+$/.test(raw)) return;

                  const num = Number(raw);

                  // hard block above platform max
                  if (num > platformCfg.max) {
                    setCount(platformCfg.max);
                    return;
                  }

                  // allow ≥ 1 while typing (no min clamp yet)
                  setCount(num);
                }}
                onBlur={() => {
                  // if empty/NaN after blur → fallback to MIN_COUNT
                  if (Number.isNaN(count)) {
                    setCount(MIN_COUNT);
                    return;
                  }

                  const fixed = Math.max(MIN_COUNT, Math.min(platformCfg.max, count));
                  setCount(fixed);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Max {platformCfg.max} for {platformCfg.label}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={generate} disabled={!topic.trim()}>
              <Hash className="h-4 w-4 mr-2" /> Generate Hashtags
            </Button>

            <Button variant="outline" onClick={clear}>
              <RotateCcw className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULTS */}
      {tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Hashtags</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* TAG CLOUD */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    onClick={() =>
                      copyText(tag, "Hashtag copied!", "Failed to copy hashtag")
                    }
                    className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-blue-200 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* TEXT VIEW */}
            <div className="text-sm text-muted-foreground space-y-1 px-1 break-all">
              <p><strong>As text:</strong> {tags.join(" ")}</p>
              <p><strong>Count:</strong> {tags.length}</p>
            </div>

            {/* COPY ALL */}
            <Button
              variant="outline"
              onClick={() =>
                copyText(
                  tags.join(" "),
                  "All hashtags copied!",
                  "Failed to copy hashtags"
                )
              }
            >
              <Copy className="h-4 w-4 mr-2" /> Copy All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TIPS */}
      <Card>
        <CardHeader>
          <CardTitle>Hashtag Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use a mix of popular and niche hashtags</li>
            <li>• Research current trends in your niche</li>
            <li>• Avoid using too many low-quality hashtags</li>
            <li>• Create unique branded hashtags</li>
            <li>• Use local hashtags for geographic targeting</li>
            <li>• Keep hashtags relevant to your content</li>
            <li>• Avoid banned or restricted hashtags</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

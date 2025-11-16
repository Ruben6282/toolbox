import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, RotateCcw } from "lucide-react";
import { notify } from "@/lib/notify";

/* -----------------------------
   CONSTANTS
----------------------------- */

const MIN_COUNT = 1;
const MAX_COUNT = 50;

const MIN_LEN = 3;
const MAX_LEN = 30;

type Style = "mixed" | "adjective-noun" | "tech" | "nature";
const ALLOWED_STYLES: Style[] = ["mixed", "adjective-noun", "tech", "nature"];

/* -----------------------------
   SECURE UNBIASED RANDOM
----------------------------- */

const secureRandom = (max: number): number => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / max) * max; // unbiased region

    while (true) {
      crypto.getRandomValues(arr);
      if (arr[0] < limit) return arr[0] % max;
    }
  }

  // fallback—uniform but not secure
  return Math.floor(Math.random() * max);
};

/* -----------------------------
   WORD BANKS (deduplicated)
----------------------------- */

const adjectives = [
  "cool", "awesome", "amazing", "brilliant", "creative", "dynamic", "epic",
  "fantastic", "genius", "heroic", "incredible", "jovial", "keen", "legendary",
  "magnificent", "noble", "outstanding", "powerful", "quick", "radiant", "stellar",
  "titanic", "ultimate", "vibrant", "wonderful", "xenial", "youthful", "zealous"
];

const nouns = [
  "warrior", "ninja", "wizard", "knight", "hero", "champion", "legend", "master",
  "phoenix", "dragon", "tiger", "eagle", "wolf", "lion", "bear", "hunter",
  "explorer", "adventurer", "guardian", "protector", "savior", "guru", "sensei",
  "mentor", "leader"
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
const specialChars = "!@#$%^&*";

/* -----------------------------
   GENERATION HELPERS
----------------------------- */

const coerceStyle = (val: string): Style =>
  ALLOWED_STYLES.includes(val as Style) ? (val as Style) : "mixed";

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

const pick = (arr: string[]) => arr[secureRandom(arr.length)];
const pickChar = (str: string) => str[secureRandom(str.length)];

function makeBaseName(style: Style): string {
  switch (style) {
    case "adjective-noun":
      return pick(adjectives) + pick(nouns);
    case "tech":
      return pick(techWords) + pick(techWords);
    case "nature":
      return pick(natureWords) + pick(natureWords);
    default:
        {
          const all = [...adjectives, ...nouns, ...techWords, ...natureWords];
          return pick(all) + pick(all);
        }
  }
}

function padToLength(name: string, minLength: number): string {
  while (name.length < minLength) {
    name += pickChar(numbers);
  }
  return name;
}

function trimToLength(name: string, maxLength: number): string {
  return name.length > maxLength ? name.slice(0, maxLength) : name;
}

/* -----------------------------
   COMPONENT
----------------------------- */

export const UsernameGenerator = () => {
  const [usernameCount, setUsernameCount] = useState(5);
  const [style, setStyle] = useState<Style>("mixed");
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSpecialChars, setIncludeSpecialChars] = useState(false);
  const [minLength, setMinLength] = useState(6);
  const [maxLength, setMaxLength] = useState(12);
  const [generated, setGenerated] = useState<string[]>([]);

  const generateOne = (): string => {
    let name = makeBaseName(style);

    if (includeNumbers) {
      const count = secureRandom(3) + 1; // 1–3 numbers
      for (let i = 0; i < count; i++) name += pickChar(numbers);
    }

    if (includeSpecialChars) {
      const count = secureRandom(2) + 1; // 1–2 specials
      for (let i = 0; i < count; i++) name += pickChar(specialChars);
    }

    const minL = clamp(minLength, MIN_LEN, MAX_LEN);
    const maxL = clamp(maxLength, minL, MAX_LEN);

    name = padToLength(name, minL);
    name = trimToLength(name, maxL);

    return name;
  };

  const generateMany = () => {
    const count = clamp(usernameCount, MIN_COUNT, MAX_COUNT);
    const result = new Set<string>();
    const limit = count * 5;

    let attempts = 0;
    while (result.size < count && attempts < limit) {
      result.add(generateOne());
      attempts++;
    }

    setGenerated([...result]);
    notify.success(`Generated ${result.size} usernames!`);
  };

  const copyOne = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      notify.success("Username copied!");
    } catch {
      notify.error("Failed to copy");
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(generated.join("\n"));
      notify.success("All usernames copied!");
    } catch {
      notify.error("Failed to copy usernames");
    }
  };

  return (
    <div className="space-y-6">
      {/* INPUT CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Username Generator</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            
            <div>
              <Label>Number of Usernames</Label>
              <Input
                type="number"
                min={MIN_COUNT}
                max={MAX_COUNT}
                value={usernameCount}
                onChange={(e) =>
                  setUsernameCount(clamp(parseInt(e.target.value) || 1, MIN_COUNT, MAX_COUNT))
                }
              />
            </div>

            <div>
              <Label>Style</Label>
              <Select value={style} onValueChange={(v) => setStyle(coerceStyle(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="adjective-noun">Adjective + Noun</SelectItem>
                  <SelectItem value="tech">Tech-Themed</SelectItem>
                  <SelectItem value="nature">Nature-Themed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Minimum Length</Label>
              <Input
                type="number"
                min={MIN_LEN}
                max={MAX_LEN}
                value={minLength}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setMinLength(clamp(isNaN(n) ? MIN_LEN : n, MIN_LEN, MAX_LEN));
                }}
              />
            </div>

            <div>
              <Label>Maximum Length</Label>
              <Input
                type="number"
                min={MIN_LEN}
                max={MAX_LEN}
                value={maxLength}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setMaxLength(clamp(isNaN(n) ? MAX_LEN : n, MIN_LEN, MAX_LEN));
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-numbers"
                checked={includeNumbers}
                onCheckedChange={(v) => setIncludeNumbers(!!v)}
              />
              <Label htmlFor="include-numbers" className="cursor-pointer">Include Numbers</Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="include-special"
                checked={includeSpecialChars}
                onCheckedChange={(v) => setIncludeSpecialChars(!!v)}
              />
              <Label htmlFor="include-special" className="cursor-pointer">Include Special Characters</Label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={generateMany}>Generate</Button>
            <Button variant="outline" onClick={() => setGenerated([])}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* OUTPUT CARD */}
      {generated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Usernames</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {generated.map((name, i) => (
                <div key={i} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                  <span className="font-mono text-sm">{name}</span>
                  <Button size="sm" variant="outline" onClick={() => copyOne(name)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={copyAll}>
              <Copy className="h-4 w-4 mr-2" /> Copy All
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

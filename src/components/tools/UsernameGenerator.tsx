import { useState, useCallback } from "react";
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
   SECURE RANDOM
----------------------------- */
const secureRandom = (max: number): number => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / max) * max;
    while (true) {
      crypto.getRandomValues(arr);
      if (arr[0] < limit) return arr[0] % max;
    }
  }
  return Math.floor(Math.random() * max);
};

/* -----------------------------
   WORD BANKS (deduped)
----------------------------- */

const uniq = (arr: string[]) => Array.from(new Set(arr));

const adjectives = uniq([
  "cool","awesome","amazing","brilliant","creative","dynamic","epic",
  "fantastic","genius","heroic","incredible","jovial","keen","legendary",
  "magnificent","noble","outstanding","powerful","quick","radiant","stellar",
  "titanic","ultimate","vibrant","wonderful","xenial","youthful","zealous"
]);

const nouns = uniq([
  "warrior","ninja","wizard","knight","hero","champion","legend","master",
  "phoenix","dragon","tiger","eagle","wolf","lion","bear","hunter",
  "explorer","adventurer","guardian","protector","savior","guru","sensei",
  "mentor","leader"
]);

const techWords = uniq([
  "code","byte","pixel","data","cyber","digital","virtual","quantum",
  "binary","algorithm","matrix","neural","crypto","blockchain","cloud",
  "server","client","database","network","protocol","interface","system"
]);

const natureWords = uniq([
  "forest","mountain","ocean","river","valley","canyon","meadow","garden",
  "flower","tree","leaf","stone","crystal","gem","star","moon","sun",
  "sky","cloud","rain","snow","wind","fire","earth","water"
]);

const numbers = "0123456789";
const specialChars = "!@#$%^&*";

/* -----------------------------
   HELPERS
----------------------------- */

const coerceStyle = (val: string): Style =>
  ALLOWED_STYLES.includes(val as Style) ? (val as Style) : "mixed";

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

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
    default: {
      const all = [...adjectives, ...nouns, ...techWords, ...natureWords];
      return pick(all) + pick(all);
    }
  }
}

function padToLength(name: string, minLength: number) {
  while (name.length < minLength) name += pickChar(numbers);
  return name;
}

function trimToLength(name: string, maxLength: number) {
  const trimmed = name.slice(0, maxLength);
  return trimmed.length === 0 ? pick(adjectives) : trimmed;
}

/* -----------------------------
   COMPONENT
----------------------------- */

export const UsernameGenerator = () => {
  const [usernameCount, setUsernameCount] = useState("5");
  const [style, setStyle] = useState<Style>("mixed");
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSpecialChars, setIncludeSpecialChars] = useState(false);
  const [minLength, setMinLength] = useState("6");
  const [maxLength, setMaxLength] = useState("12");
  const [generated, setGenerated] = useState<string[]>([]);

  /* -----------------------------
     GENERATE ONE
  ----------------------------- */
  const generateOne = useCallback((overrideMin?: number, overrideMax?: number): string => {
    let name = makeBaseName(style);

    if (includeNumbers) {
      const count = secureRandom(3) + 1;
      for (let i = 0; i < count; i++) name += pickChar(numbers);
    }

    if (includeSpecialChars) {
      const count = secureRandom(2) + 1;
      for (let i = 0; i < count; i++) name += pickChar(specialChars);
    }

    const parsedMin = typeof overrideMin === "number" ? overrideMin : Number(minLength);
    const parsedMax = typeof overrideMax === "number" ? overrideMax : Number(maxLength);

    const minNum = clamp(parsedMin || MIN_LEN, MIN_LEN, MAX_LEN);
    let maxNum = clamp(parsedMax || MAX_LEN, MIN_LEN, MAX_LEN);

    if (maxNum < minNum) maxNum = minNum; // 🔒 guarantee max ≥ min

    name = padToLength(name, minNum);
    name = trimToLength(name, maxNum);

    return name;
  }, [includeNumbers, includeSpecialChars, minLength, maxLength, style]);

  /* -----------------------------
     GENERATE MANY
  ----------------------------- */
  const generateMany = useCallback(() => {
    const parsed = Number(usernameCount);
    const count = clamp(parsed || MIN_COUNT, MIN_COUNT, MAX_COUNT);

    // Sanitize and enforce min/max length relationship before generating
    const parsedMin = Number(minLength);
    const parsedMax = Number(maxLength);
    const minNum = clamp(parsedMin || MIN_LEN, MIN_LEN, MAX_LEN);
    let maxNum = clamp(parsedMax || MAX_LEN, MIN_LEN, MAX_LEN);
    if (maxNum < minNum) maxNum = minNum;

    // Reflect sanitized values back into the inputs so the UI shows corrected values
    setMinLength(String(minNum));
    setMaxLength(String(maxNum));
    setUsernameCount(String(count));

    const result = new Set<string>();
    const attemptsLimit = count * 5;

    let attempts = 0;
    while (result.size < count && attempts < attemptsLimit) {
      result.add(generateOne(minNum, maxNum));
      attempts++;
    }

    setGenerated([...result]);

    if (result.size < count) {
      notify.warning(
        `Generated ${result.size} unique usernames — word bank exhausted.`
      );
    } else {
      notify.success(`Generated ${result.size} usernames!`);
    }
  }, [usernameCount, generateOne, minLength, maxLength]);

  /* -----------------------------
     COPY HANDLERS
  ----------------------------- */
  const copyOne = useCallback(async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      notify.success("Username copied!");
    } catch {
      notify.error("Failed to copy");
    }
  }, []);

  const copyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generated.join("\n"));
      notify.success("All usernames copied!");
    } catch {
      notify.error("Failed to copy usernames");
    }
  }, [generated]);

  /* -----------------------------
     RENDER
  ----------------------------- */

  return (
    <div className="space-y-6">
      {/* INPUT CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Username Generator</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* COUNT */}
            <div>
              <Label>Number of Usernames</Label>
              <Input
                type="number"
                min={MIN_COUNT}
                max={MAX_COUNT}
                inputMode="numeric"
                value={usernameCount}
                onChange={(e) => {
                  const raw = e.target.value;

                  // allow empty temporarily
                  if (raw === "") {
                    setUsernameCount("");
                    return;
                  }

                  // must be digits only
                  if (!/^\d+$/.test(raw)) return;

                  const num = Number(raw);

                  // hard block max
                  if (num > MAX_COUNT) {
                    setUsernameCount(String(MAX_COUNT));
                    return;
                  }

                  // allow any value >= min (do NOT clamp min while typing)
                  setUsernameCount(raw);
                }}
                onBlur={() => {
                  // empty → fallback to MIN
                  if (usernameCount.trim() === "") {
                    setUsernameCount(String(MIN_COUNT));
                    return;
                  }

                  const n = Number(usernameCount);
                  setUsernameCount(String(clamp(n, MIN_COUNT, MAX_COUNT)));
                }}
              />
            </div>

            {/* STYLE */}
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

            {/* MIN LENGTH */}
            <div>
              <Label>Minimum Length</Label>
              <Input
                type="number"
                min={MIN_LEN}
                max={MAX_LEN}
                inputMode="numeric"
                value={minLength}
                onChange={(e) => {
                  const raw = e.target.value;

                  if (raw === "") {
                    setMinLength("");
                    return;
                  }

                  if (!/^\d+$/.test(raw)) return;

                  const num = Number(raw);

                  // prevent typing above max
                  if (num > MAX_LEN) {
                    setMinLength(String(MAX_LEN));
                    return;
                  }

                  setMinLength(raw);
                }}
                onBlur={() => {
                  if (minLength.trim() === "") {
                    setMinLength(String(MIN_LEN));
                    return;
                  }

                  const n = Number(minLength);
                  setMinLength(String(clamp(n, MIN_LEN, MAX_LEN)));
                }}
              />
            </div>

            {/* MAX LENGTH */}
            <div>
              <Label>Maximum Length</Label>
              <Input
                type="number"
                min={MIN_LEN}
                max={MAX_LEN}
                inputMode="numeric"
                value={maxLength}
                onChange={(e) => {
                  const raw = e.target.value;

                  if (raw === "") {
                    setMaxLength("");
                    return;
                  }

                  if (!/^\d+$/.test(raw)) return;

                  const num = Number(raw);

                  // hard block above MAX_LEN
                  if (num > MAX_LEN) {
                    setMaxLength(String(MAX_LEN));
                    return;
                  }

                  setMaxLength(raw);
                }}
                onBlur={() => {
                  if (maxLength.trim() === "") {
                    setMaxLength(String(MAX_LEN));
                    return;
                  }

                  const n = Number(maxLength);
                  let fixed = clamp(n, MIN_LEN, MAX_LEN);

                  const minNum = clamp(Number(minLength) || MIN_LEN, MIN_LEN, MAX_LEN);
                  if (fixed < minNum) fixed = minNum; // ensure max ≥ min

                  setMaxLength(String(fixed));
                }}
              />
            </div>
          </div>

          {/* OPTIONS */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-numbers"
                checked={includeNumbers}
                onCheckedChange={(v) => setIncludeNumbers(Boolean(v))}
              />
              <Label htmlFor="include-numbers" className="cursor-pointer">
                Include Numbers
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="include-special"
                checked={includeSpecialChars}
                onCheckedChange={(v) => setIncludeSpecialChars(Boolean(v))}
              />
              <Label htmlFor="include-special" className="cursor-pointer">
                Include Special Characters
              </Label>
            </div>
          </div>

          {/* BUTTONS */}
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
                <div
                  key={i}
                  className="flex items-center justify-between bg-muted p-3 rounded-lg overflow-hidden"
                >
                  <span className="font-mono text-sm break-all pr-2">{name}</span>

                  {/* Mobile-safe button container */}
                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="whitespace-nowrap"
                      onClick={() => copyOne(name)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
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

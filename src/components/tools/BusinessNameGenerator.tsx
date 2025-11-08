import { useState } from "react";
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
import { Copy, RotateCcw, RefreshCw } from "lucide-react";
import { notify } from "@/lib/notify";

export const BusinessNameGenerator = () => {
  const [nameCount, setNameCount] = useState(10);
  const [industry, setIndustry] = useState("general");
  const [style, setStyle] = useState("modern");
  const [customWords, setCustomWords] = useState("");
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);

  const industries = {
    general: {
      prefixes: ["Prime", "Elite", "Pro", "Ultra", "Max", "Super", "Grand", "Royal", "Noble"],
      suffixes: ["Solutions", "Systems", "Group", "Ventures", "Dynamics", "Collective"],
    },
    tech: {
      prefixes: ["Cyber", "Digital", "Tech", "Data", "Cloud", "Quantum", "Neural", "Virtual", "Smart", "AI"],
      suffixes: ["Tech", "Systems", "Labs", "Works", "Innovations", "Networks", "Dynamics"],
    },
    healthcare: {
      prefixes: ["Med", "Health", "Care", "Vital", "Life", "Bio", "Thera", "Healing"],
      suffixes: ["Care", "Health", "Clinic", "Center", "Solutions", "Group"],
    },
    finance: {
      prefixes: ["Capital", "Finance", "Wealth", "Money", "Equity", "Asset"],
      suffixes: ["Capital", "Finance", "Advisors", "Partners", "Group", "Investments"],
    },
    retail: {
      prefixes: ["Shop", "Market", "Boutique", "Emporium", "Hub"],
      suffixes: ["Store", "Plaza", "Mall", "Center", "Market"],
    },
    food: {
      prefixes: ["Fresh", "Gourmet", "Delish", "Spice", "Flavor", "Cafe", "Bistro"],
      suffixes: ["Kitchen", "Cafe", "Bistro", "Restaurant", "Grill", "Catering"],
    },
  };

  const styles = {
    modern: ["Tech", "Digital", "Smart", "Prime", "Next", "Nova", "Pulse", "Edge"],
    classic: ["Royal", "Grand", "Noble", "Imperial", "Majestic", "Premier"],
    creative: ["Creative", "Vivid", "Spark", "Idea", "Vision", "Wave", "Studio", "Forge"],
    professional: ["Expert", "Master", "Elite", "Advanced", "Quality", "Pro", "Solutions"],
  };

  const connectors = ["Labs", "Hub", "Works", "Studio", "Nexus", "Forge", "Collective", "&"];

  const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const generateBusinessName = (): string => {
    const industryData = industries[industry as keyof typeof industries];
    const styleWords = styles[style as keyof typeof styles];

    const customList = customWords
      .split(",")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    const prefixPool = [...industryData.prefixes, ...styleWords, ...customList];
    const suffixPool = [...industryData.suffixes, ...customList];

    const prefix = getRandom(prefixPool);
    const suffix = getRandom(suffixPool);
    const connector = getRandom(connectors);

    const structures = [
      `${prefix} ${suffix}`,
      `${prefix}${suffix}`,
      `${prefix} ${connector}`,
      `${prefix} ${suffix} ${connector}`,
      `${prefix} & ${suffix}`,
      `${suffix} by ${prefix}`,
      `${prefix}-${suffix}`,
      `${prefix} ${suffix} Co.`,
    ];

    let name = getRandom(structures).replace(/\s+/g, " ").trim();

    // Remove consecutive duplicates (Tech Tech → Tech)
    const parts = name.split(" ");
    const uniqueParts = parts.filter((p, i) => p.toLowerCase() !== parts[i - 1]?.toLowerCase());
    name = uniqueParts.join(" ");

    // Limit to 4 words max
    name = name.split(" ").slice(0, 4).join(" ");

    return name;
  };

  const generateNames = () => {
    const uniqueNames = new Set<string>();
    let safety = 0;
    while (uniqueNames.size < nameCount && safety < nameCount * 10) {
      uniqueNames.add(generateBusinessName());
      safety++;
    }
    setGeneratedNames(Array.from(uniqueNames));
  };

  const copyToClipboard = async (name: string) => {
    await navigator.clipboard.writeText(name);
  notify.success(`Copied "${name}"`);
  };

  const copyAllToClipboard = async () => {
    if (generatedNames.length === 0) return;
    await navigator.clipboard.writeText(generatedNames.join("\n"));
  notify.success("All names copied to clipboard!");
  };

  const clearNames = () => setGeneratedNames([]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Name Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Number of Names</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={nameCount}
                onChange={(e) =>
                  setNameCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(industries).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key[0].toUpperCase() + key.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(styles).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key[0].toUpperCase() + key.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Words (comma-separated)</Label>
              <Input
                placeholder="e.g. Innovation, Future, Cloud"
                value={customWords}
                onChange={(e) => setCustomWords(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={generateNames}>Generate Names</Button>
            <Button onClick={clearNames} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" /> Clear
            </Button>
            {generatedNames.length > 0 && (
              <Button variant="secondary" onClick={generateNames}>
                <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {generatedNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Business Names</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {generatedNames.map((name, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-muted p-3 rounded-lg hover:bg-muted/80 transition"
                >
                  <span className="font-medium">{name}</span>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(name)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button onClick={copyAllToClipboard} variant="outline" className="mt-2">
              <Copy className="h-4 w-4 mr-2" /> Copy All
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

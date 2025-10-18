import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RotateCcw } from "lucide-react";

export const BusinessNameGenerator = () => {
  const [nameCount, setNameCount] = useState(10);
  const [industry, setIndustry] = useState("general");
  const [style, setStyle] = useState("modern");
  const [customWords, setCustomWords] = useState("");
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);

  const industries = {
    general: {
      prefixes: ["Prime", "Elite", "Pro", "Ultra", "Max", "Super", "Mega", "Grand", "Royal", "Noble"],
      suffixes: ["Solutions", "Systems", "Group", "Corp", "Enterprises", "Industries", "Partners", "Associates", "Ventures", "Dynamics"]
    },
    tech: {
      prefixes: ["Cyber", "Digital", "Tech", "Data", "Cloud", "Quantum", "Neural", "Virtual", "Smart", "AI"],
      suffixes: ["Tech", "Systems", "Solutions", "Labs", "Works", "Studios", "Innovations", "Dynamics", "Networks", "Platforms"]
    },
    healthcare: {
      prefixes: ["Med", "Health", "Care", "Wellness", "Vital", "Life", "Bio", "Medical", "Therapeutic", "Healing"],
      suffixes: ["Care", "Health", "Medical", "Wellness", "Clinic", "Center", "Services", "Solutions", "Group", "Associates"]
    },
    finance: {
      prefixes: ["Capital", "Finance", "Wealth", "Money", "Gold", "Silver", "Investment", "Financial", "Asset", "Equity"],
      suffixes: ["Capital", "Finance", "Investments", "Wealth", "Advisors", "Partners", "Group", "Associates", "Services", "Solutions"]
    },
    retail: {
      prefixes: ["Shop", "Store", "Market", "Boutique", "Emporium", "Mart", "Plaza", "Square", "Hub", "Center"],
      suffixes: ["Shop", "Store", "Market", "Boutique", "Emporium", "Plaza", "Square", "Hub", "Center", "Mall"]
    },
    food: {
      prefixes: ["Fresh", "Gourmet", "Delicious", "Tasty", "Savory", "Flavor", "Spice", "Kitchen", "Cafe", "Bistro"],
      suffixes: ["Kitchen", "Cafe", "Bistro", "Restaurant", "Grill", "Bar", "Eatery", "Dining", "Foods", "Catering"]
    }
  };

  const styles = {
    modern: ["Tech", "Digital", "Smart", "Pro", "Elite", "Prime", "Ultra", "Max", "Super", "Mega"],
    classic: ["Royal", "Grand", "Noble", "Imperial", "Majestic", "Supreme", "Premier", "Exclusive", "Premium", "Luxury"],
    creative: ["Creative", "Artistic", "Innovative", "Dynamic", "Vibrant", "Bold", "Bright", "Fresh", "New", "Next"],
    professional: ["Professional", "Expert", "Specialist", "Master", "Elite", "Advanced", "Superior", "Quality", "Excellence", "Prime"]
  };

  const generateBusinessName = (): string => {
    const industryData = industries[industry as keyof typeof industries];
    const styleWords = styles[style as keyof typeof styles];
    const customWordsList = customWords.split(',').map(w => w.trim()).filter(w => w.length > 0);
    
    const allPrefixes = [...industryData.prefixes, ...styleWords, ...customWordsList];
    const allSuffixes = industryData.suffixes;

    const prefix = allPrefixes[Math.floor(Math.random() * allPrefixes.length)];
    const suffix = allSuffixes[Math.floor(Math.random() * allSuffixes.length)];

    // Randomly choose between different name structures
    const structures = [
      () => `${prefix} ${suffix}`,
      () => `${prefix}${suffix}`,
      () => `${suffix} ${prefix}`,
      () => `${prefix} & ${suffix}`,
      () => `${prefix} ${suffix} Group`,
      () => `${prefix} ${suffix} Co.`,
      () => `${prefix} ${suffix} LLC`,
      () => `${prefix} ${suffix} Inc.`
    ];

    const structure = structures[Math.floor(Math.random() * structures.length)];
    return structure();
  };

  const generateNames = () => {
    const names: string[] = [];
    const maxAttempts = nameCount * 3;
    let attempts = 0;

    while (names.length < nameCount && attempts < maxAttempts) {
      const name = generateBusinessName();
      if (!names.includes(name)) {
        names.push(name);
      }
      attempts++;
    }

    setGeneratedNames(names);
  };

  const copyToClipboard = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const copyAllToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedNames.join('\n'));
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const clearNames = () => {
    setGeneratedNames([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Name Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name-count">Number of Names</Label>
              <Input
                id="name-count"
                type="number"
                min="1"
                max="50"
                value={nameCount}
                onChange={(e) => setNameCount(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry-select">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Business</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="food">Food & Beverage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style-select">Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-words">Custom Words (comma-separated)</Label>
              <Input
                id="custom-words"
                placeholder="e.g., Innovation, Quality, Excellence"
                value={customWords}
                onChange={(e) => setCustomWords(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateNames}>
              Generate Business Names
            </Button>
            <Button onClick={clearNames} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
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
              {generatedNames.map((name, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                  <span className="font-medium">{name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(name)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={copyAllToClipboard} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business Name Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Choose a name that's easy to pronounce and remember</li>
            <li>• Make sure it's available as a domain name and on social media</li>
            <li>• Consider how it will look on business cards and signage</li>
            <li>• Avoid names that are too similar to existing businesses</li>
            <li>• Think about how it will sound in different languages if you plan to expand</li>
            <li>• Keep it simple and avoid overly complex or long names</li>
            <li>• Consider trademark availability before finalizing your choice</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

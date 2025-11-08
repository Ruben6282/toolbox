import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, RotateCcw } from "lucide-react";
import { notify } from "@/lib/notify";

export const UsernameGenerator = () => {
  const [usernameCount, setUsernameCount] = useState(5);
  const [style, setStyle] = useState("mixed");
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSpecialChars, setIncludeSpecialChars] = useState(false);
  const [minLength, setMinLength] = useState(6);
  const [maxLength, setMaxLength] = useState(12);
  const [generatedUsernames, setGeneratedUsernames] = useState<string[]>([]);

  const adjectives = [
    "cool", "awesome", "amazing", "brilliant", "creative", "dynamic", "epic", "fantastic",
    "genius", "heroic", "incredible", "jovial", "keen", "legendary", "magnificent", "noble",
    "outstanding", "powerful", "quick", "radiant", "stellar", "titanic", "ultimate", "vibrant",
    "wonderful", "xenial", "youthful", "zealous"
  ];

  const nouns = [
    "warrior", "ninja", "wizard", "knight", "hero", "champion", "legend", "master",
    "genius", "phoenix", "dragon", "tiger", "eagle", "wolf", "lion", "bear",
    "hunter", "explorer", "adventurer", "guardian", "protector", "savior", "hero",
    "champion", "legend", "master", "guru", "sensei", "mentor", "leader"
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

  const generateUsername = (): string => {
    let username = "";
    
    switch (style) {
      case "adjective-noun": {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        username = adj + noun;
        break;
      }
      case "tech": {
        const tech1 = techWords[Math.floor(Math.random() * techWords.length)];
        const tech2 = techWords[Math.floor(Math.random() * techWords.length)];
        username = tech1 + tech2;
        break;
      }
      case "nature": {
        const nature1 = natureWords[Math.floor(Math.random() * natureWords.length)];
        const nature2 = natureWords[Math.floor(Math.random() * natureWords.length)];
        username = nature1 + nature2;
        break;
      }
      case "mixed":
      default: {
        const allWords = [...adjectives, ...nouns, ...techWords, ...natureWords];
        const word1 = allWords[Math.floor(Math.random() * allWords.length)];
        const word2 = allWords[Math.floor(Math.random() * allWords.length)];
        username = word1 + word2;
        break;
      }
    }

    // Add numbers if enabled
    if (includeNumbers) {
      const numCount = Math.floor(Math.random() * 3) + 1; // 1-3 numbers
      for (let i = 0; i < numCount; i++) {
        username += numbers[Math.floor(Math.random() * numbers.length)];
      }
    }

    // Add special characters if enabled
    if (includeSpecialChars) {
      const specialCount = Math.floor(Math.random() * 2) + 1; // 1-2 special chars
      for (let i = 0; i < specialCount; i++) {
        username += specialChars[Math.floor(Math.random() * specialChars.length)];
      }
    }

    // Ensure length constraints
    if (username.length < minLength) {
      const needed = minLength - username.length;
      for (let i = 0; i < needed; i++) {
        username += numbers[Math.floor(Math.random() * numbers.length)];
      }
    }

    if (username.length > maxLength) {
      username = username.substring(0, maxLength);
    }

    return username;
  };

  const generateUsernames = () => {
    const usernames: string[] = [];
    const maxAttempts = usernameCount * 3; // Prevent infinite loops
    let attempts = 0;

    while (usernames.length < usernameCount && attempts < maxAttempts) {
      const username = generateUsername();
      if (!usernames.includes(username)) {
        usernames.push(username);
      }
      attempts++;
    }

    setGeneratedUsernames(usernames);
  };

  const copyToClipboard = async (username: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(username);
  notify.success("Username copied!");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = username;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          notify.success("Username copied!");
        } else {
          notify.error("Failed to copy username");
        }
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
  notify.error("Failed to copy username");
    }
  };

  const copyAllToClipboard = async () => {
    const all = generatedUsernames.join('\n');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(all);
  notify.success("All usernames copied!");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = all;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          notify.success("All usernames copied!");
        } else {
          notify.error("Failed to copy");
        }
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
  notify.error("Failed to copy");
    }
  };

  const clearUsernames = () => {
    setGeneratedUsernames([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Username Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username-count">Number of Usernames</Label>
              <Input
                id="username-count"
                type="number"
                min="1"
                max="20"
                value={usernameCount}
                onChange={(e) => setUsernameCount(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="style-select">Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="adjective-noun">Adjective + Noun</SelectItem>
                  <SelectItem value="tech">Tech-themed</SelectItem>
                  <SelectItem value="nature">Nature-themed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-length">Minimum Length</Label>
              <Input
                id="min-length"
                type="number"
                min="3"
                max="20"
                value={minLength}
                onChange={(e) => setMinLength(parseInt(e.target.value) || 6)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-length">Maximum Length</Label>
              <Input
                id="max-length"
                type="number"
                min="3"
                max="30"
                value={maxLength}
                onChange={(e) => setMaxLength(parseInt(e.target.value) || 12)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-numbers"
                checked={includeNumbers}
                onCheckedChange={(checked) => setIncludeNumbers(checked as boolean)}
              />
              <Label htmlFor="include-numbers">Include Numbers</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-special"
                checked={includeSpecialChars}
                onCheckedChange={(checked) => setIncludeSpecialChars(checked as boolean)}
              />
              <Label htmlFor="include-special">Include Special Characters</Label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <Button onClick={generateUsernames} className="w-full sm:w-auto">
              Generate Usernames
            </Button>
            <Button onClick={clearUsernames} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedUsernames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Usernames</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {generatedUsernames.map((username, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                  <span className="font-mono text-sm">{username}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(username)}
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
          <CardTitle>Username Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Choose a username that reflects your personality or interests</li>
            <li>• Avoid using personal information like your real name or birthdate</li>
            <li>• Make it memorable but not too common</li>
            <li>• Consider how it sounds when spoken aloud</li>
            <li>• Check availability on your desired platforms</li>
            <li>• Keep it professional if using for business purposes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

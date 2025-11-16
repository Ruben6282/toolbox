import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { notify } from "@/lib/notify";
import { Copy, RefreshCw } from "lucide-react";

const MIN_LENGTH = 4;
const MAX_LENGTH = 128;

// 🟦 Rejection sampling to avoid modulo bias
const secureRandom = (max: number): number => {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Secure random generator is not available in this environment.");
  }

  const arr = new Uint32Array(1);
  const range = 0xffffffff;
  const limit = Math.floor(range / max) * max;

  while (true) {
    crypto.getRandomValues(arr);
    if (arr[0] < limit) {
      return arr[0] % max;
    }
  }
};

// 🟦 Fisher–Yates shuffle (secure + optimal)
const shuffleArray = (arr: string[]): void => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

export const PasswordGenerator = () => {
  const [length, setLength] = useState(16);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState("");

  // Character sets (expanded symbol list)
  const sets = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: `!@#$%^&*()_+-=[]{}|;:',.<>/?~"\\`,
  };

  const generate = () => {
    const selectedSets: string[] = [];

    if (useUppercase) selectedSets.push(sets.uppercase);
    if (useLowercase) selectedSets.push(sets.lowercase);
    if (useNumbers) selectedSets.push(sets.numbers);
    if (useSymbols) selectedSets.push(sets.symbols);

    if (selectedSets.length === 0) {
      notify.error("Select at least one character type!");
      return;
    }

    // 🟩 First ensure at least 1 char from each selected category
    const requiredChars = selectedSets.map(
      (set) => set[secureRandom(set.length)]
    );

    // 🟩 Combine everything into a full pool
    const fullPool = selectedSets.join("");

    // 🟩 Generate remaining random characters
    const remainingCount = Math.max(0, length - requiredChars.length);
    const randomChars: string[] = [];

    for (let i = 0; i < remainingCount; i++) {
      const index = secureRandom(fullPool.length);
      randomChars.push(fullPool[index]);
    }

    // 🟩 Merge + shuffle
    const final = [...requiredChars, ...randomChars];
    shuffleArray(final);

    const finalPassword = final.join("");
    setPassword(finalPassword);
    notify.success("Password generated!");
  };

  const copyToClipboard = async () => {
    if (!password) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(password);
        notify.success("Password copied!");
        return;
      }

      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = password;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (ok) {
        notify.success("Password copied!");
      } else {
        notify.error("Copy failed");
      }
    } catch {
      notify.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-4">
      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle>Password Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Length */}
          <div className="space-y-2">
            <Label>Password Length: {length}</Label>
            <Input
              type="range"
              min={MIN_LENGTH}
              max={MAX_LENGTH}
              value={length}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setLength(Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, n)));
              }}
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="uppercase"
                checked={useUppercase}
                onCheckedChange={(v) => setUseUppercase(!!v)}
              />
              <Label htmlFor="uppercase" className="cursor-pointer">
                Uppercase (A-Z)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lowercase"
                checked={useLowercase}
                onCheckedChange={(v) => setUseLowercase(!!v)}
              />
              <Label htmlFor="lowercase" className="cursor-pointer">
                Lowercase (a-z)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="numbers"
                checked={useNumbers}
                onCheckedChange={(v) => setUseNumbers(!!v)}
              />
              <Label htmlFor="numbers" className="cursor-pointer">
                Numbers (0-9)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="symbols"
                checked={useSymbols}
                onCheckedChange={(v) => setUseSymbols(!!v)}
              />
              <Label htmlFor="symbols" className="cursor-pointer">
                Symbols (!@#$%...)
              </Label>
            </div>
          </div>

          {/* Generate button */}
          <Button className="w-full gap-2" onClick={generate}>
            <RefreshCw className="h-4 w-4" />
            Generate Password
          </Button>
        </CardContent>
      </Card>

      {/* Output */}
      {password && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Password</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input value={password} readOnly className="font-mono" />
              <Button size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

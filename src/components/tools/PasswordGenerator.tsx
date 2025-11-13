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

// Secure random integer
const secureRandom = (max: number): number => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
};

export const PasswordGenerator = () => {
  const [length, setLength] = useState(16);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState("");

  const generate = () => {
    let chars = "";
    if (useUppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useLowercase) chars += "abcdefghijklmnopqrstuvwxyz";
    if (useNumbers) chars += "0123456789";
    if (useSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (chars === "") {
      notify.error("Select at least one character type!");
      return;
    }

    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(secureRandom(chars.length));
    }
    setPassword(result);
    notify.success("Password generated!");
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(password);
        notify.success("Password copied!");
        return;
      }

      // Fallback for older browsers/mobile
      const textArea = document.createElement("textarea");
      textArea.value = password;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        notify.success("Password copied!");
      } else {
        notify.error("Failed to copy");
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      notify.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Password Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password Length: {length}</Label>
            <Input
              type="range"
              min={MIN_LENGTH}
              max={MAX_LENGTH}
              value={length}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                const clamped = Math.max(MIN_LENGTH, Math.min(MAX_LENGTH, val));
                setLength(clamped);
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="uppercase" checked={useUppercase} onCheckedChange={(c) => setUseUppercase(!!c)} />
              <Label htmlFor="uppercase" className="cursor-pointer">Uppercase (A-Z)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="lowercase" checked={useLowercase} onCheckedChange={(c) => setUseLowercase(!!c)} />
              <Label htmlFor="lowercase" className="cursor-pointer">Lowercase (a-z)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="numbers" checked={useNumbers} onCheckedChange={(c) => setUseNumbers(!!c)} />
              <Label htmlFor="numbers" className="cursor-pointer">Numbers (0-9)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="symbols" checked={useSymbols} onCheckedChange={(c) => setUseSymbols(!!c)} />
              <Label htmlFor="symbols" className="cursor-pointer">Symbols (!@#$%...)</Label>
            </div>
          </div>

          <Button onClick={generate} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Generate Password
          </Button>
        </CardContent>
      </Card>

      {password && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Password</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input value={password} readOnly className="font-mono" />
              <Button onClick={copyToClipboard} size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

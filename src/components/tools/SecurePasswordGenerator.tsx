import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, RotateCcw, Shield, Eye, EyeOff } from "lucide-react";
import { notify } from "@/lib/notify";

const MIN_LENGTH = 4;
const MAX_LENGTH = 128;

// Cryptographically secure random integer in [0, max)
const secureRandom = (max: number): number => {
  if (max <= 0) {
    throw new Error("max must be a positive integer");
  }

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const range = 0x100000000; // 2^32
    const limit = range - (range % max);
    const arr = new Uint32Array(1);

    let rand: number;
    do {
      crypto.getRandomValues(arr);
      rand = arr[0];
    } while (rand >= limit);

    return rand % max;
  }

  // Fallback – not cryptographically secure, but prevents crashes in very old browsers
  return Math.floor(Math.random() * max);
};

export const SecurePasswordGenerator = () => {
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [entropyBits, setEntropyBits] = useState<number | null>(null);

  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  // Expanded symbol set is possible, but this is a good default
  const symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const similarChars = "il1Lo0O";
  const ambiguousChars = "{}[]()/\\'\"`~,;.<>";

  const calculatePasswordStrength = (password: string, charsetSize: number) => {
    if (!password || charsetSize <= 0) {
      setPasswordStrength("");
      setEntropyBits(null);
      return;
    }

    const entropy = password.length * Math.log2(charsetSize);
    setEntropyBits(entropy);

    let strength = "";

    if (entropy < 40) {
      strength = "Weak";
    } else if (entropy < 60) {
      strength = "Fair";
    } else if (entropy < 80) {
      strength = "Good";
    } else {
      strength = "Strong";
    }

    setPasswordStrength(strength);
  };

  const generatePassword = () => {
    // Clamp length
    const length = Math.max(MIN_LENGTH, Math.min(MAX_LENGTH, passwordLength));

    type CharSet = {
      id: "uppercase" | "lowercase" | "numbers" | "symbols";
      enabled: boolean;
      chars: string;
    };

    const rawSets: CharSet[] = [
      { id: "uppercase", enabled: includeUppercase, chars: uppercaseChars },
      { id: "lowercase", enabled: includeLowercase, chars: lowercaseChars },
      { id: "numbers", enabled: includeNumbers, chars: numberChars },
      { id: "symbols", enabled: includeSymbols, chars: symbolChars },
    ];

    // Apply filters (exclude similar/ambiguous) to each enabled set
    const filteredSets = rawSets
      .filter((set) => set.enabled)
      .map((set) => {
        let chars = set.chars;

        if (excludeSimilar) {
          chars = chars
            .split("")
            .filter((char) => !similarChars.includes(char))
            .join("");
        }

        if (excludeAmbiguous) {
          chars = chars
            .split("")
            .filter((char) => !ambiguousChars.includes(char))
            .join("");
        }

        return { ...set, chars };
      })
      // Remove sets that became empty due to exclusions
      .filter((set) => set.chars.length > 0);

    if (filteredSets.length === 0) {
      setGeneratedPassword("");
      setPasswordStrength("");
      setEntropyBits(null);
      notify.error("Please select at least one valid character type!");
      return;
    }

    const fullCharset = filteredSets.map((set) => set.chars).join("");

    // Use unique characters for entropy calculation
    const uniqueCharsetSize = new Set(fullCharset).size;

    // Ensure at least one character from each selected set
    const passwordChars: string[] = [];

    filteredSets.forEach((set) => {
      const idx = secureRandom(set.chars.length);
      passwordChars.push(set.chars.charAt(idx));
    });

    // Fill the rest of the password with random characters from the full charset
    const remainingLength = Math.max(0, length - passwordChars.length);
    for (let i = 0; i < remainingLength; i++) {
      const idx = secureRandom(fullCharset.length);
      passwordChars.push(fullCharset.charAt(idx));
    }

    // Fisher–Yates shuffle to randomize positions
    for (let i = passwordChars.length - 1; i > 0; i--) {
      const j = secureRandom(i + 1);
      [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    }

    const password = passwordChars.join("");

    setGeneratedPassword(password);
    calculatePasswordStrength(password, uniqueCharsetSize);
    notify.success("Secure password generated!");
  };

  const copyToClipboard = async () => {
    if (!generatedPassword) {
      notify.error("No password to copy");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedPassword);
        notify.success("Password copied to clipboard!");
        return;
      }

      // Fallback for older browsers/mobile
      const textArea = document.createElement("textarea");
      textArea.value = generatedPassword;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        notify.success("Password copied to clipboard!");
      } else {
        notify.error("Failed to copy password");
      }
    } catch (err) {
      console.error("Failed to copy: ", err);
      notify.error("Failed to copy password");
    }
  };

  const clearPassword = () => {
    setGeneratedPassword("");
    setPasswordStrength("");
    setEntropyBits(null);
    setShowPassword(false);
    notify.success("Password cleared!");
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "Weak":
        return "text-red-600 bg-red-50 border-red-200";
      case "Fair":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Good":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "Strong":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Secure Password Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password Length: {passwordLength} characters</Label>
            <Slider
              value={[passwordLength]}
              onValueChange={(value) => setPasswordLength(value[0])}
              min={MIN_LENGTH}
              max={MAX_LENGTH}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label>Character Types</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-uppercase"
                  checked={includeUppercase}
                  onCheckedChange={(checked) =>
                    setIncludeUppercase(!!checked)
                  }
                />
                <Label htmlFor="include-uppercase" className="text-sm">
                  Uppercase (A-Z)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-lowercase"
                  checked={includeLowercase}
                  onCheckedChange={(checked) =>
                    setIncludeLowercase(!!checked)
                  }
                />
                <Label htmlFor="include-lowercase" className="text-sm">
                  Lowercase (a-z)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-numbers"
                  checked={includeNumbers}
                  onCheckedChange={(checked) =>
                    setIncludeNumbers(!!checked)
                  }
                />
                <Label htmlFor="include-numbers" className="text-sm">
                  Numbers (0-9)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-symbols"
                  checked={includeSymbols}
                  onCheckedChange={(checked) =>
                    setIncludeSymbols(!!checked)
                  }
                />
                <Label htmlFor="include-symbols" className="text-sm">
                  Symbols (!@#$)
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Security Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exclude-similar"
                  checked={excludeSimilar}
                  onCheckedChange={(checked) =>
                    setExcludeSimilar(!!checked)
                  }
                />
                <Label htmlFor="exclude-similar" className="text-sm">
                  Exclude similar characters (il1Lo0O)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exclude-ambiguous"
                  checked={excludeAmbiguous}
                  onCheckedChange={(checked) =>
                    setExcludeAmbiguous(!!checked)
                  }
                />
                <Label htmlFor="exclude-ambiguous" className="text-sm">
                  Exclude ambiguous characters <span className="font-mono">({ambiguousChars})</span>
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <Button onClick={generatePassword} className="w-full sm:w-auto">
              <Shield className="h-4 w-4 mr-2" />
              Generate Password
            </Button>
            <Button
              onClick={clearPassword}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedPassword && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                type={showPassword ? "text" : "password"}
                value={generatedPassword}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button onClick={copyToClipboard} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className={`p-3 rounded-lg border ${getPasswordStrengthColor()}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Password Strength:</span>
                <span className="font-bold">{passwordStrength || "—"}</span>
              </div>
              {entropyBits !== null && (
                <div className="mt-1 text-xs opacity-80">
                  ~{entropyBits.toFixed(1)} bits of entropy
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Length:</span>
                <span className="ml-2 font-medium">
                  {generatedPassword.length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Uppercase:</span>
                <span className="ml-2 font-medium">
                  {/[A-Z]/.test(generatedPassword) ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Lowercase:</span>
                <span className="ml-2 font-medium">
                  {/[a-z]/.test(generatedPassword) ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Numbers:</span>
                <span className="ml-2 font-medium">
                  {/[0-9]/.test(generatedPassword) ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Symbols:</span>
                <span className="ml-2 font-medium">
                  {/[^A-Za-z0-9]/.test(generatedPassword) ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Password Security Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use at least 12 characters for better security</li>
            <li>• Include a mix of uppercase, lowercase, numbers, and symbols</li>
            <li>• Avoid using personal information or common words</li>
            <li>• Don't reuse passwords across different accounts</li>
            <li>• Consider using a password manager to store passwords securely</li>
            <li>• Enable two-factor authentication when available</li>
            <li>• Change passwords regularly, especially for sensitive accounts</li>
            <li>• Never share your passwords with others</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

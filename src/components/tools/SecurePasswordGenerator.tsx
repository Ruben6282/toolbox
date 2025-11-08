import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, RotateCcw, Shield, Eye, EyeOff } from "lucide-react";
import { notify } from "@/lib/notify";

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

  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const similarChars = "il1Lo0O";
  const ambiguousChars = "{}[]()/\\'\"`~,;.<>";

  const generatePassword = () => {
    let charset = "";
    
    if (includeUppercase) charset += uppercaseChars;
    if (includeLowercase) charset += lowercaseChars;
    if (includeNumbers) charset += numberChars;
    if (includeSymbols) charset += symbolChars;
    
    if (excludeSimilar) {
      charset = charset.split('').filter(char => !similarChars.includes(char)).join('');
    }
    
    if (excludeAmbiguous) {
      charset = charset.split('').filter(char => !ambiguousChars.includes(char)).join('');
    }

    if (charset.length === 0) {
      setGeneratedPassword("Please select at least one character type");
      setPasswordStrength("Invalid");
      return;
    }

    let password = "";
    for (let i = 0; i < passwordLength; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setGeneratedPassword(password);
    calculatePasswordStrength(password);
  };

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    const feedback = [];

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Common patterns
    if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
    if (!/123|abc|qwe/i.test(password)) score += 1; // No common sequences

    let strength = "";
    let color = "";
    
    if (score <= 3) {
      strength = "Weak";
      color = "text-red-600";
    } else if (score <= 5) {
      strength = "Fair";
      color = "text-yellow-600";
    } else if (score <= 7) {
      strength = "Good";
      color = "text-blue-600";
    } else {
      strength = "Strong";
      color = "text-green-600";
    }

    setPasswordStrength(strength);
  };

  const copyToClipboard = async () => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedPassword);
  notify.success("Password copied to clipboard!");
      } else {
        // Fallback for mobile/older browsers
        const textArea = document.createElement("textarea");
        textArea.value = generatedPassword;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            notify.success("Password copied to clipboard!");
          } else {
            notify.error("Failed to copy password");
          }
        } catch (err) {
          notify.error("Failed to copy password");
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
  notify.error("Failed to copy password");
    }
  };

  const clearPassword = () => {
    setGeneratedPassword("");
    setPasswordStrength("");
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "Weak": return "text-red-600 bg-red-50 border-red-200";
      case "Fair": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Good": return "text-blue-600 bg-blue-50 border-blue-200";
      case "Strong": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
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
              min={4}
              max={128}
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
                  onCheckedChange={(checked) => setIncludeUppercase(checked as boolean)}
                />
                <Label htmlFor="include-uppercase" className="text-sm">Uppercase (A-Z)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-lowercase"
                  checked={includeLowercase}
                  onCheckedChange={(checked) => setIncludeLowercase(checked as boolean)}
                />
                <Label htmlFor="include-lowercase" className="text-sm">Lowercase (a-z)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-numbers"
                  checked={includeNumbers}
                  onCheckedChange={(checked) => setIncludeNumbers(checked as boolean)}
                />
                <Label htmlFor="include-numbers" className="text-sm">Numbers (0-9)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-symbols"
                  checked={includeSymbols}
                  onCheckedChange={(checked) => setIncludeSymbols(checked as boolean)}
                />
                <Label htmlFor="include-symbols" className="text-sm">Symbols (!@#$)</Label>
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
                  onCheckedChange={(checked) => setExcludeSimilar(checked as boolean)}
                />
                <Label htmlFor="exclude-similar" className="text-sm">Exclude similar characters (il1Lo0O)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exclude-ambiguous"
                  checked={excludeAmbiguous}
                  onCheckedChange={(checked) => setExcludeAmbiguous(checked as boolean)}
                />
                <Label htmlFor="exclude-ambiguous" className="text-sm">Exclude ambiguous characters ({}{}[]())</Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <Button onClick={generatePassword} className="w-full sm:w-auto">
              <Shield className="h-4 w-4 mr-2" />
              Generate Password
            </Button>
            <Button onClick={clearPassword} variant="outline" className="w-full sm:w-auto">
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
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button onClick={copyToClipboard} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className={`p-3 rounded-lg border ${getPasswordStrengthColor()}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Password Strength:</span>
                <span className="font-bold">{passwordStrength}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Length:</span>
                <span className="ml-2 font-medium">{generatedPassword.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Uppercase:</span>
                <span className="ml-2 font-medium">{/[A-Z]/.test(generatedPassword) ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Numbers:</span>
                <span className="ml-2 font-medium">{/[0-9]/.test(generatedPassword) ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Symbols:</span>
                <span className="ml-2 font-medium">{/[^A-Za-z0-9]/.test(generatedPassword) ? "Yes" : "No"}</span>
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

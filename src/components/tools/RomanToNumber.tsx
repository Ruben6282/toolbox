import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, Copy } from "lucide-react";
import { notify } from "@/lib/notify";
import { safeNumber } from "@/lib/safe-number";

const MAX_ROMAN_LENGTH = 20;
const MAX_DECIMAL_DIGITS = 10; // can be long, validated only on convert

const STRICT_ROMAN_REGEX =
  /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

const sanitizeRoman = (val: string): string =>
  val.toUpperCase().replace(/[^IVXLCDM]/g, "").slice(0, MAX_ROMAN_LENGTH);

const sanitizeDecimal = (val: string): string =>
  val.replace(/[^0-9]/g, "").slice(0, MAX_DECIMAL_DIGITS);

// Roman → Number
const romanToDecimal = (roman: string): number => {
  const map: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };

  let total = 0;
  let prev = 0;

  for (let i = roman.length - 1; i >= 0; i--) {
    const value = map[roman[i]];
    if (!value) throw new Error(`Invalid Roman numeral: ${roman[i]}`);

    if (value < prev) total -= value;
    else total += value;
    prev = value;
  }

  return total;
};

// Number → Roman
const decimalToRoman = (num: number): string => {
  if (num < 1 || num > 3999) throw new Error("Number must be 1–3999");

  const values = [
    1000, 900, 500, 400, 100, 90,
    50, 40, 10, 9, 5, 4, 1,
  ];

  const symbols = [
    "M", "CM", "D", "CD", "C", "XC",
    "L", "XL", "X", "IX", "V", "IV", "I",
  ];

  let result = "";
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      num -= values[i];
      result += symbols[i];
    }
  }

  return result;
};

export const RomanToNumber = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | number | null>(null);
  const [convertedInput, setConvertedInput] = useState("");
  const [error, setError] = useState("");

  const handleInputChange = (val: string) => {
    // The user can freely type anything — validation happens only on convert
    if (/^[0-9]+$/.test(val)) setInput(sanitizeDecimal(val));
    else setInput(sanitizeRoman(val));
  };

  const convertRoman = () => {
    const raw = sanitizeRoman(input.trim());

    if (!raw) {
      setError("Please enter a Roman numeral");
      notify.error("Please enter a Roman numeral");
      setResult(null);
      return;
    }

    if (!STRICT_ROMAN_REGEX.test(raw)) {
      setError("Invalid Roman numeral format");
      notify.error("Invalid Roman numeral format");
      setResult(null);
      return;
    }

    let decimal: number;
    try {
      decimal = romanToDecimal(raw);
    } catch {
      setError("Invalid Roman numeral");
      notify.error("Invalid Roman numeral");
      setResult(null);
      return;
    }

    if (decimal > 3999) {
      setError("Roman numeral value cannot exceed 3999");
      notify.error("Roman numeral value cannot exceed 3999");
      setResult(null);
      return;
    }

    setError("");
    setResult(decimal);
    setConvertedInput(raw);
    notify.success(`Converted to decimal: ${decimal}`);
  };

  const convertDecimal = () => {
    const num = safeNumber(input, { min: 1, max: Infinity, allowDecimal: false });

    if (num === null) {
      setError("Enter a valid number");
      notify.error("Enter a valid number");
      setResult(null);
      return;
    }

    // Only validate max when converting
    if (num > 3999) {
      setError("Maximum allowed value is 3999");
      notify.error("Maximum allowed value is 3999");
      setResult(null);
      return;
    }

    try {
      const roman = decimalToRoman(num);
      setError("");
      setResult(roman);
      setConvertedInput(String(num));
      notify.success(`Converted to Roman: ${roman}`);
    } catch {
      setError("Invalid number");
      notify.error("Invalid number");
      setResult(null);
    }
  };

  const copyToClipboard = async () => {
    if (result === null) return;
    try {
      await navigator.clipboard.writeText(String(result));
      notify.success("Copied!");
    } catch {
      notify.error("Failed to copy");
    }
  };

  const clearAll = () => {
    setInput("");
    setResult(null);
    setConvertedInput("");
    setError("");
    notify.success("Cleared!");
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle>Roman Numeral Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label>Enter Roman Numeral or Number</Label>
          <Input
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="e.g., MMXXIV or 2024"
            maxLength={MAX_ROMAN_LENGTH}
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={convertRoman} disabled={!input.trim()}>
              Convert Roman → Number
            </Button>
            <Button onClick={convertDecimal} disabled={!input.trim()}>
              Convert Number → Roman
            </Button>

            <Button variant="outline" onClick={clearAll}>
              <RotateCcw className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result !== null && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Conversion Result
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="bg-muted p-6 rounded-lg text-center">
              <div className="text-3xl font-bold mb-2 break-words">{result}</div>
              <p className="text-sm text-muted-foreground">
                {typeof result === "number"
                  ? `Roman numeral "${convertedInput}" = ${result}`
                  : `Number ${convertedInput} = "${result}"`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

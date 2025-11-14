import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, Copy } from "lucide-react";
import { notify } from "@/lib/notify";
import { safeNumber } from "@/lib/safe-number";

const MAX_INPUT_LENGTH = 50; // Max length for Roman numeral or decimal

// Sanitize Roman numeral: allow only I,V,X,L,C,D,M (case-insensitive)
const sanitizeRoman = (val: string): string => {
  return val.toUpperCase().replace(/[^IVXLCDM]/g, "").substring(0, MAX_INPUT_LENGTH);
};

// Sanitize decimal: allow only digits
const sanitizeDecimal = (val: string): string => {
  return val.replace(/[^0-9]/g, "").substring(0, MAX_INPUT_LENGTH);
};

export const RomanToNumber = () => {
  const [romanNumeral, setRomanNumeral] = useState("");
  const [result, setResult] = useState<number | string | null>(null);
  const [error, setError] = useState("");

  const romanToDecimal = (roman: string): number => {
    const romanMap: { [key: string]: number } = {
      'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000
    };

    let result = 0;
    let prevValue = 0;

    for (let i = roman.length - 1; i >= 0; i--) {
      const currentValue = romanMap[roman[i].toUpperCase()];
      
      if (currentValue === undefined) {
        throw new Error(`Invalid Roman numeral: ${roman[i]}`);
      }

      if (currentValue < prevValue) {
        result -= currentValue;
      } else {
        result += currentValue;
      }
      
      prevValue = currentValue;
    }

    return result;
  };

  const decimalToRoman = (num: number): string => {
    if (num <= 0 || num > 3999) {
      throw new Error("Number must be between 1 and 3999");
    }

    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    
    let result = '';
    
    for (let i = 0; i < values.length; i++) {
      while (num >= values[i]) {
        result += symbols[i];
        num -= values[i];
      }
    }
    
    return result;
  };

  const convertRoman = () => {
    if (!romanNumeral.trim()) {
      setError("Please enter a Roman numeral");
      setResult(null);
      notify.error("Please enter a Roman numeral");
      return;
    }

    try {
      const decimal = romanToDecimal(romanNumeral.trim());
      setResult(decimal);
      setError("");
      notify.success(`Converted to decimal: ${decimal}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid Roman numeral");
      setResult(null);
      notify.error(err instanceof Error ? err.message : "Invalid Roman numeral");
    }
  };

  const convertDecimal = () => {
    const num = safeNumber(romanNumeral, { min: 1, max: 3999, allowDecimal: false });
    if (num === null) {
      setError("Please enter a valid number between 1 and 3999");
      setResult(null);
      notify.error("Please enter a valid number between 1 and 3999");
      return;
    }

    try {
      const roman = decimalToRoman(num);
      setResult(roman);
      setError("");
      notify.success(`Converted to Roman: ${roman}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid number");
      setResult(null);
      notify.error(err instanceof Error ? err.message : "Invalid number");
    }
  };

  const copyToClipboard = async () => {
    if (result === null) return;
    try {
      // Modern approach - works on most browsers including mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(result.toString());
        notify.success("Result copied to clipboard!");
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement("textarea");
        textArea.value = result.toString();
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            notify.success("Result copied to clipboard!");
          } else {
            notify.error("Failed to copy!");
          }
        } catch (err) {
          console.error('Fallback: Failed to copy', err);
          notify.error("Failed to copy to clipboard!");
        }
        
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      notify.error("Failed to copy to clipboard!");
    }
  };

  const clearAll = () => {
    setRomanNumeral("");
    setResult(null);
    setError("");
    notify.success("Cleared all values!");
  };

  const romanExamples = [
    { roman: "I", decimal: 1 },
    { roman: "IV", decimal: 4 },
    { roman: "V", decimal: 5 },
    { roman: "IX", decimal: 9 },
    { roman: "X", decimal: 10 },
    { roman: "XL", decimal: 40 },
    { roman: "L", decimal: 50 },
    { roman: "XC", decimal: 90 },
    { roman: "C", decimal: 100 },
    { roman: "CD", decimal: 400 },
    { roman: "D", decimal: 500 },
    { roman: "CM", decimal: 900 },
    { roman: "M", decimal: 1000 },
    { roman: "MMXXIV", decimal: 2024 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Roman Numeral Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roman-input">Enter Roman Numeral or Number</Label>
            <Input
              id="roman-input"
              placeholder="e.g., MMXXIV or 2024"
              value={romanNumeral}
              onChange={(e) => {
                // Allow typing either Roman numerals or decimal numbers
                const val = e.target.value;
                if (/^[0-9]*$/.test(val)) {
                  // Pure digits - sanitize as decimal
                  setRomanNumeral(sanitizeDecimal(val));
                } else {
                  // Contains letters - sanitize as Roman
                  setRomanNumeral(sanitizeRoman(val));
                }
              }}
              maxLength={MAX_INPUT_LENGTH}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={convertRoman} disabled={!romanNumeral.trim()} className="w-full sm:w-auto">
              Convert Roman to Number
            </Button>
            <Button onClick={convertDecimal} disabled={!romanNumeral.trim()} className="w-full sm:w-auto">
              Convert Number to Roman
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {result !== null && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span>Conversion Result</span>
              <Button size="sm" variant="outline" onClick={copyToClipboard} className="w-full sm:w-auto">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 sm:p-6 rounded-lg text-center">
              <div className="text-2xl sm:text-3xl font-bold mb-2 break-words px-2">{result}</div>
              <p className="text-xs sm:text-sm text-muted-foreground break-words px-2">
                {typeof result === 'number' 
                  ? `Roman numeral "${romanNumeral}" equals ${result}`
                  : `Number ${romanNumeral} equals "${result}" in Roman numerals`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Roman Numeral Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {romanExamples.map((example, index) => (
              <div key={index} className="bg-muted p-2 sm:p-3 rounded-lg text-center">
                <div className="font-medium text-sm sm:text-base">{example.roman}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{example.decimal}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roman Numeral Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Basic Symbols:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000</li>
              </ul>
            </div>
            <div>
              <strong>Subtraction Rule:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>I before V or X: IV = 4, IX = 9</li>
                <li>X before L or C: XL = 40, XC = 90</li>
                <li>C before D or M: CD = 400, CM = 900</li>
              </ul>
            </div>
            <div>
              <strong>Addition Rule:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>Symbols are added when a smaller symbol follows a larger one</li>
                <li>Example: VI = 5 + 1 = 6, XII = 10 + 1 + 1 = 12</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

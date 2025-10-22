import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, Copy, Calculator } from "lucide-react";

export const HexToDecimalConverter = () => {
  const [hex, setHex] = useState("");
  const [decimal, setDecimal] = useState("");

  const convertHexToDecimal = (hexStr: string) => {
    if (!hexStr || !/^[0-9A-Fa-f]+$/.test(hexStr)) {
      return { result: 0, error: "Invalid hexadecimal number. Only 0-9 and A-F are allowed." };
    }

    let decimal = 0;
    let power = hexStr.length - 1;

    for (let i = 0; i < hexStr.length; i++) {
      const digit = parseInt(hexStr[i], 16);
      decimal += digit * Math.pow(16, power);
      power--;
    }

    return { result: decimal, error: null };
  };

  const convertDecimalToHex = (decimalNum: number) => {
    if (decimalNum < 0) {
      return { result: "", error: "Negative numbers not supported" };
    }

    if (decimalNum === 0) {
      return { result: "0", error: null };
    }

    let hex = "";
    let num = Math.floor(decimalNum);

    while (num > 0) {
      const remainder = num % 16;
      hex = (remainder < 10 ? remainder.toString() : String.fromCharCode(65 + remainder - 10)) + hex;
      num = Math.floor(num / 16);
    }

    return { result: hex, error: null };
  };

  const handleHexChange = (value: string) => {
    setHex(value.toUpperCase());
    if (value.trim() === "") {
      setDecimal("");
      return;
    }

    const result = convertHexToDecimal(value);
    if (result.error) {
      setDecimal("");
    } else {
      setDecimal(result.result.toString());
    }
  };

  const handleDecimalChange = (value: string) => {
    setDecimal(value);
    if (value.trim() === "") {
      setHex("");
      return;
    }

    const num = parseInt(value);
    if (isNaN(num) || num < 0) {
      setHex("");
    } else {
      const result = convertDecimalToHex(num);
      if (result.error) {
        setHex("");
      } else {
        setHex(result.result);
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const clearAll = () => {
    setHex("");
    setDecimal("");
  };

  const getHexValidation = () => {
    if (!hex) return { isValid: true, message: "" };
    if (!/^[0-9A-Fa-f]+$/.test(hex)) {
      return { isValid: false, message: "Hexadecimal numbers can only contain 0-9 and A-F" };
    }
    if (hex.length > 8) {
      return { isValid: false, message: "Hexadecimal number too long (max 8 digits)" };
    }
    return { isValid: true, message: "" };
  };

  const getDecimalValidation = () => {
    if (!decimal) return { isValid: true, message: "" };
    const num = parseInt(decimal);
    if (isNaN(num)) {
      return { isValid: false, message: "Please enter a valid number" };
    }
    if (num < 0) {
      return { isValid: false, message: "Negative numbers not supported" };
    }
    if (num > 4294967295) {
      return { isValid: false, message: "Number too large (max 4,294,967,295)" };
    }
    return { isValid: true, message: "" };
  };

  const hexValidation = getHexValidation();
  const decimalValidation = getDecimalValidation();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hexadecimal to Decimal Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hex">Hexadecimal Number</Label>
            <div className="flex gap-2">
              <Input
                id="hex"
                placeholder="Enter hex number (e.g., FF)"
                value={hex}
                onChange={(e) => handleHexChange(e.target.value)}
                className={!hexValidation.isValid ? "border-red-500" : ""}
              />
              <Button
                onClick={() => copyToClipboard(hex)}
                variant="outline"
                disabled={!hex}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {!hexValidation.isValid && (
              <p className="text-sm text-red-600">{hexValidation.message}</p>
            )}
            {hexValidation.isValid && hex && (
              <p className="text-sm text-green-600">✓ Valid hexadecimal number</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="decimal">Decimal Number</Label>
            <div className="flex gap-2">
              <Input
                id="decimal"
                placeholder="Enter decimal number (e.g., 255)"
                value={decimal}
                onChange={(e) => handleDecimalChange(e.target.value)}
                className={!decimalValidation.isValid ? "border-red-500" : ""}
              />
              <Button
                onClick={() => copyToClipboard(decimal)}
                variant="outline"
                disabled={!decimal}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {!decimalValidation.isValid && (
              <p className="text-sm text-red-600">{decimalValidation.message}</p>
            )}
            {decimalValidation.isValid && decimal && (
              <p className="text-sm text-green-600">✓ Valid decimal number</p>
            )}
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {hex && decimal && hexValidation.isValid && decimalValidation.isValid && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {hex}
                </div>
                <div className="text-sm text-muted-foreground">Hexadecimal</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {decimal}
                </div>
                <div className="text-sm text-muted-foreground">Decimal</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Conversion Details</h4>
              <div className="text-sm space-y-2">
                <p>
                  <strong>Hexadecimal:</strong> {hex} (base 16)
                </p>
                <p>
                  <strong>Decimal:</strong> {decimal} (base 10)
                </p>
                <p>
                  <strong>Digits:</strong> {hex.length} digit{hex.length !== 1 ? 's' : ''}
                </p>
                {parseInt(decimal) > 0 && (
                  <p>
                    <strong>Power of 16:</strong>{" "}
                    16^{(Math.log(parseInt(decimal)) / Math.log(16)).toFixed(4)} = {parseInt(decimal)}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Step-by-Step Conversion</h4>
              <div className="text-sm space-y-1">
                {parseInt(decimal) > 0 && (
                  <div>
                    <p className="font-medium">Converting {hex} to decimal:</p>
                    <div className="mt-2 space-y-1">
                      {(() => {
                        const steps = [];
                        for (let i = 0; i < hex.length; i++) {
                          const digit = parseInt(hex[i], 16);
                          const power = hex.length - 1 - i;
                          steps.push(
                            <div key={i}>
                              {hex[i]} × 16^{power} = {digit} × {Math.pow(16, power)} = {digit * Math.pow(16, power)}
                            </div>
                          );
                        }
                        return steps;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hexadecimal Number System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              The hexadecimal number system uses 16 digits: 0-9 and A-F. Each position represents a power of 16.
            </p>
            <p>
              <strong>Example:</strong> FF in hex = 15×16¹ + 15×16⁰ = 240 + 15 = 255 in decimal
            </p>
            <p>
              Hexadecimal is commonly used in computing for memory addresses, color codes, and binary data representation.
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium mb-2">Common Hexadecimal Values</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>0 = 0</div>
                <div>1 = 1</div>
                <div>2 = 2</div>
                <div>3 = 3</div>
                <div>4 = 4</div>
                <div>5 = 5</div>
                <div>6 = 6</div>
                <div>7 = 7</div>
                <div>8 = 8</div>
                <div>9 = 9</div>
                <div>A = 10</div>
                <div>B = 11</div>
                <div>C = 12</div>
                <div>D = 13</div>
                <div>E = 14</div>
                <div>F = 15</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

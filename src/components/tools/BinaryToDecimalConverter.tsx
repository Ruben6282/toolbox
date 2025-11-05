import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, Copy, Calculator } from "lucide-react";

export const BinaryToDecimalConverter = () => {
  const [binary, setBinary] = useState("");
  const [decimal, setDecimal] = useState("");
  const [conversionType, setConversionType] = useState("binary-to-decimal");

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const convertBinaryToDecimal = (binaryStr: string) => {
    if (!binaryStr || !/^[01]+$/.test(binaryStr)) {
      return { result: 0, error: "Invalid binary number. Only 0s and 1s are allowed." };
    }

    let decimal = 0;
    let power = binaryStr.length - 1;

    for (let i = 0; i < binaryStr.length; i++) {
      if (binaryStr[i] === '1') {
        decimal += Math.pow(2, power);
      }
      power--;
    }

    return { result: decimal, error: null };
  };

  const convertDecimalToBinary = (decimalNum: number) => {
    if (decimalNum < 0) {
      return { result: "", error: "Negative numbers not supported" };
    }

    if (decimalNum === 0) {
      return { result: "0", error: null };
    }

    let binary = "";
    let num = Math.floor(decimalNum);

    while (num > 0) {
      binary = (num % 2) + binary;
      num = Math.floor(num / 2);
    }

    return { result: binary, error: null };
  };

  const handleBinaryChange = (value: string) => {
    setBinary(value);
    if (value.trim() === "") {
      setDecimal("");
      return;
    }

    const result = convertBinaryToDecimal(value);
    if (result.error) {
      setDecimal("");
    } else {
      setDecimal(result.result.toString());
    }
  };

  const handleDecimalChange = (value: string) => {
    setDecimal(value);
    if (value.trim() === "") {
      setBinary("");
      return;
    }

    const num = parseInt(value);
    if (isNaN(num) || num < 0) {
      setBinary("");
    } else {
      const result = convertDecimalToBinary(num);
      if (result.error) {
        setBinary("");
      } else {
        setBinary(result.result);
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
    setBinary("");
    setDecimal("");
  };

  const getBinaryValidation = () => {
    if (!binary) return { isValid: true, message: "" };
    if (!/^[01]+$/.test(binary)) {
      return { isValid: false, message: "Binary numbers can only contain 0s and 1s" };
    }
    if (binary.length > 32) {
      return { isValid: false, message: "Binary number too long (max 32 bits)" };
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

  const binaryValidation = getBinaryValidation();
  const decimalValidation = getDecimalValidation();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Binary to Decimal Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="binary">Binary Number</Label>
            <div className="flex gap-2">
              <Input
                id="binary"
                placeholder="Enter binary number (e.g., 1010)"
                value={binary}
                onChange={(e) => handleBinaryChange(e.target.value)}
                className={!binaryValidation.isValid ? "border-red-500" : ""}
              />
              <Button
                onClick={() => copyToClipboard(binary)}
                variant="outline"
                disabled={!binary}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {!binaryValidation.isValid && (
              <p className="text-sm text-red-600">{binaryValidation.message}</p>
            )}
            {binaryValidation.isValid && binary && (
              <p className="text-sm text-green-600">✓ Valid binary number</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="decimal">Decimal Number</Label>
            <div className="flex gap-2">
              <Input
                id="decimal"
                placeholder="Enter decimal number (e.g., 10)"
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

      {binary && decimal && binaryValidation.isValid && decimalValidation.isValid && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2 break-all font-mono">
                  {binary}
                </div>
                <div className="text-sm text-muted-foreground">Binary</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2 break-words">
                  {formatNumber(parseInt(decimal))}
                </div>
                <div className="text-sm text-muted-foreground">Decimal</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Conversion Details</h4>
              <div className="text-sm space-y-2">
                <p className="break-all">
                  <strong>Binary:</strong> <span className="font-mono">{binary}</span> (base 2)
                </p>
                <p className="break-words">
                  <strong>Decimal:</strong> {formatNumber(parseInt(decimal))} (base 10)
                </p>
                <p>
                  <strong>Bits:</strong> {binary.length} bit{binary.length !== 1 ? 's' : ''}
                </p>
                {parseInt(decimal) > 0 && (
                  <p className="break-words">
                    <strong>Power of 2:</strong> 2^{Math.log2(parseInt(decimal))} = {formatNumber(parseInt(decimal))}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Binary Number System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              The binary number system uses only two digits: 0 and 1. Each position represents a power of 2.
            </p>
            <p>
              <strong>Example:</strong> 1010 in binary = 1×2³ + 0×2² + 1×2¹ + 0×2⁰ = 8 + 0 + 2 + 0 = 10 in decimal
            </p>
            <p>
              Binary is fundamental in computer science and digital electronics, as computers use binary to represent all data.
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium mb-2">Common Binary Values</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>0000 = 0</div>
                <div>0001 = 1</div>
                <div>0010 = 2</div>
                <div>0011 = 3</div>
                <div>0100 = 4</div>
                <div>0101 = 5</div>
                <div>0110 = 6</div>
                <div>0111 = 7</div>
                <div>1000 = 8</div>
                <div>1001 = 9</div>
                <div>1010 = 10</div>
                <div>1011 = 11</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

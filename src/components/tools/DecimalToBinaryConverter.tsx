import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, Copy, Calculator } from "lucide-react";
import { notify } from "@/lib/notify";

export const DecimalToBinaryConverter = () => {
  const [decimal, setDecimal] = useState("");
  const [binary, setBinary] = useState("");

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
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

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // Modern approach - works on most browsers including mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        notify.success(`${type} copied to clipboard!`);
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            notify.success(`${type} copied to clipboard!`);
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
    setDecimal("");
    setBinary("");
    notify.success("Cleared all values!");
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

  const decimalValidation = getDecimalValidation();
  const binaryValidation = getBinaryValidation();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Decimal to Binary Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                onClick={() => copyToClipboard(decimal, "Decimal")}
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
                onClick={() => copyToClipboard(binary, "Binary")}
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

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {decimal && binary && decimalValidation.isValid && binaryValidation.isValid && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2 break-words">
                  {formatNumber(parseInt(decimal))}
                </div>
                <div className="text-sm text-muted-foreground">Decimal</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2 break-all font-mono">
                  {binary}
                </div>
                <div className="text-sm text-muted-foreground">Binary</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Conversion Details</h4>
              <div className="text-sm space-y-2">
                <p className="break-words">
                  <strong>Decimal:</strong> {formatNumber(parseInt(decimal))} (base 10)
                </p>
                <p className="break-all">
                  <strong>Binary:</strong> <span className="font-mono">{binary}</span> (base 2)
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

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Step-by-Step Conversion</h4>
              <div className="text-sm space-y-1">
                {parseInt(decimal) > 0 && (
                  <div>
                    <p className="font-medium break-words">Converting {formatNumber(parseInt(decimal))} to binary:</p>
                    <div className="mt-2 space-y-1">
                      {(() => {
                        const steps = [];
                        let num = parseInt(decimal);
                        let step = 1;
                        while (num > 0) {
                          steps.push(
                            <div key={step} className="break-words">
                              Step {step}: {formatNumber(num)} ÷ 2 = {formatNumber(Math.floor(num / 2))} remainder {num % 2}
                            </div>
                          );
                          num = Math.floor(num / 2);
                          step++;
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
          <CardTitle>Binary Conversion Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              To convert decimal to binary, repeatedly divide by 2 and collect remainders in reverse order.
            </p>
            <p>
              <strong>Example:</strong> 10 ÷ 2 = 5 remainder 0, 5 ÷ 2 = 2 remainder 1, 2 ÷ 2 = 1 remainder 0, 1 ÷ 2 = 0 remainder 1
            </p>
            <p>
              Reading remainders from bottom to top: 1010
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium mb-2">Common Decimal to Binary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>0 = 0000</div>
                <div>1 = 0001</div>
                <div>2 = 0010</div>
                <div>3 = 0011</div>
                <div>4 = 0100</div>
                <div>5 = 0101</div>
                <div>6 = 0110</div>
                <div>7 = 0111</div>
                <div>8 = 1000</div>
                <div>9 = 1001</div>
                <div>10 = 1010</div>
                <div>11 = 1011</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, Copy, Calculator } from "lucide-react";
import { notify } from "@/lib/notify";

export const DecimalToHexConverter = () => {
  const [decimal, setDecimal] = useState("");
  const [hex, setHex] = useState("");

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
    setHex("");
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

  const decimalValidation = getDecimalValidation();
  const hexValidation = getHexValidation();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Decimal to Hexadecimal Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="decimal">Decimal Number</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="decimal"
                placeholder="Enter decimal number (e.g., 255)"
                value={decimal}
                onChange={(e) => handleDecimalChange(e.target.value)}
                className={!decimalValidation.isValid ? "border-red-500" : ""}
              />
              <Button
                onClick={() => copyToClipboard(decimal, "Decimal")}
                variant="outline"
                disabled={!decimal}
                className="w-full sm:w-auto"
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
            <Label htmlFor="hex">Hexadecimal Number</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="hex"
                placeholder="Enter hex number (e.g., FF)"
                value={hex}
                onChange={(e) => handleHexChange(e.target.value)}
                className={!hexValidation.isValid ? "border-red-500" : ""}
              />
              <Button
                onClick={() => copyToClipboard(hex, "Hexadecimal")}
                variant="outline"
                disabled={!hex}
                className="w-full sm:w-auto"
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

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {decimal && hex && decimalValidation.isValid && hexValidation.isValid && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600 mb-2 break-words px-2">
                  {decimal}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Decimal</div>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-2 break-words px-2">
                  {hex}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Hexadecimal</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm sm:text-base">Conversion Details</h4>
              <div className="text-xs sm:text-sm space-y-2 break-words">
                <p>
                  <strong>Decimal:</strong> {decimal} (base 10)
                </p>
                <p>
                  <strong>Hexadecimal:</strong> {hex} (base 16)
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

            <div className="bg-muted p-3 sm:p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-sm sm:text-base">Step-by-Step Conversion</h4>
              <div className="text-xs sm:text-sm space-y-1 break-words">
                {parseInt(decimal) > 0 && (
                  <div>
                    <p className="font-medium">Converting {decimal} to hexadecimal:</p>
                    <div className="mt-2 space-y-1">
                      {(() => {
                        const steps = [];
                        let num = parseInt(decimal);
                        let step = 1;
                        while (num > 0) {
                          const remainder = num % 16;
                          const hexDigit = remainder < 10 ? remainder.toString() : String.fromCharCode(65 + remainder - 10);
                          steps.push(
                            <div key={step}>
                              Step {step}: {num} ÷ 16 = {Math.floor(num / 16)} remainder {remainder} ({hexDigit})
                            </div>
                          );
                          num = Math.floor(num / 16);
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
          <CardTitle>Hexadecimal Conversion Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              To convert decimal to hexadecimal, repeatedly divide by 16 and collect remainders in reverse order.
            </p>
            <p>
              <strong>Example:</strong> 255 ÷ 16 = 15 remainder 15, 15 ÷ 16 = 0 remainder 15
            </p>
            <p>
              Reading remainders from bottom to top: FF
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium mb-2">Common Decimal to Hex</h4>
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
                <div>10 = A</div>
                <div>11 = B</div>
                <div>12 = C</div>
                <div>13 = D</div>
                <div>14 = E</div>
                <div>15 = F</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

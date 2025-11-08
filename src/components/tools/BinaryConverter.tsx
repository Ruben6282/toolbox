import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { Label } from "@/components/ui/label";

export const BinaryConverter = () => {
  const [binary, setBinary] = useState("");
  const [decimal, setDecimal] = useState("");
  const [hex, setHex] = useState("");
  const [octal, setOctal] = useState("");

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const fromBinary = (bin: string) => {
    const dec = parseInt(bin, 2);
    if (isNaN(dec)) {
  notify.error("Invalid binary number!");
      return;
    }
    setDecimal(dec.toString());
    setHex(dec.toString(16).toUpperCase());
    setOctal(dec.toString(8));
  notify.success("Converted from binary!");
  };

  const fromDecimal = (dec: string) => {
    const num = parseInt(dec, 10);
    if (isNaN(num)) {
  notify.error("Invalid decimal number!");
      return;
    }
    setBinary(num.toString(2));
    setHex(num.toString(16).toUpperCase());
    setOctal(num.toString(8));
  notify.success("Converted from decimal!");
  };

  const fromHex = (hexVal: string) => {
    const dec = parseInt(hexVal, 16);
    if (isNaN(dec)) {
  notify.error("Invalid hexadecimal number!");
      return;
    }
    setDecimal(dec.toString());
    setBinary(dec.toString(2));
    setOctal(dec.toString(8));
  notify.success("Converted from hexadecimal!");
  };

  const fromOctal = (octVal: string) => {
    const dec = parseInt(octVal, 8);
    if (isNaN(dec)) {
  notify.error("Invalid octal number!");
      return;
    }
    setDecimal(dec.toString());
    setBinary(dec.toString(2));
    setHex(dec.toString(16).toUpperCase());
  notify.success("Converted from octal!");
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // Modern approach - works on most browsers including mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
  notify.success(`${type} copied!`);
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
            notify.success(`${type} copied!`);
          } else {
            notify.error("Failed to copy!");
          }
        } catch (err) {
          console.error('Fallback: Failed to copy', err);
          notify.error("Failed to copy!");
        }
        
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
  notify.error("Failed to copy to clipboard!");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Binary (Base 2)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter binary number... (e.g., 1010)"
            value={binary}
            onChange={(e) => setBinary(e.target.value)}
            className="font-mono"
          />
          <div className="flex gap-2">
            <Button onClick={() => fromBinary(binary)} className="flex-1">Convert</Button>
            {binary && <Button variant="outline" onClick={() => copyToClipboard(binary, "Binary")}>Copy</Button>}
          </div>
          {binary && (
            <div className="text-sm text-muted-foreground break-all">
              <span className="font-mono">{binary}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decimal (Base 10)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter decimal number... (e.g., 10)"
            value={decimal}
            onChange={(e) => setDecimal(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={() => fromDecimal(decimal)} className="flex-1">Convert</Button>
            {decimal && <Button variant="outline" onClick={() => copyToClipboard(decimal, "Decimal")}>Copy</Button>}
          </div>
          {decimal && (
            <div className="text-sm text-muted-foreground break-words">
              {formatNumber(parseInt(decimal))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Octal (Base 8)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter octal number... (e.g., 12)"
            value={octal}
            onChange={(e) => setOctal(e.target.value)}
            className="font-mono"
          />
          <div className="flex gap-2">
            <Button onClick={() => fromOctal(octal)} className="flex-1">Convert</Button>
            {octal && <Button variant="outline" onClick={() => copyToClipboard(octal, "Octal")}>Copy</Button>}
          </div>
          {octal && (
            <div className="text-sm text-muted-foreground break-all">
              <span className="font-mono">{octal}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hexadecimal (Base 16)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter hexadecimal number... (e.g., A)"
            value={hex}
            onChange={(e) => setHex(e.target.value.toUpperCase())}
            className="font-mono"
          />
          <div className="flex gap-2">
            <Button onClick={() => fromHex(hex)} className="flex-1">Convert</Button>
            {hex && <Button variant="outline" onClick={() => copyToClipboard(hex, "Hexadecimal")}>Copy</Button>}
          </div>
          {hex && (
            <div className="text-sm text-muted-foreground break-all">
              <span className="font-mono">{hex}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

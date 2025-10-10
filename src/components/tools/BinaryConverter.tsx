import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export const BinaryConverter = () => {
  const [binary, setBinary] = useState("");
  const [decimal, setDecimal] = useState("");
  const [hex, setHex] = useState("");

  const fromBinary = (bin: string) => {
    const dec = parseInt(bin, 2);
    if (isNaN(dec)) {
      toast.error("Invalid binary number!");
      return;
    }
    setDecimal(dec.toString());
    setHex(dec.toString(16).toUpperCase());
    toast.success("Converted from binary!");
  };

  const fromDecimal = (dec: string) => {
    const num = parseInt(dec, 10);
    if (isNaN(num)) {
      toast.error("Invalid decimal number!");
      return;
    }
    setBinary(num.toString(2));
    setHex(num.toString(16).toUpperCase());
    toast.success("Converted from decimal!");
  };

  const fromHex = (hexVal: string) => {
    const dec = parseInt(hexVal, 16);
    if (isNaN(dec)) {
      toast.error("Invalid hexadecimal number!");
      return;
    }
    setDecimal(dec.toString());
    setBinary(dec.toString(2));
    toast.success("Converted from hexadecimal!");
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied!`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Binary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter binary number..."
            value={binary}
            onChange={(e) => setBinary(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={() => fromBinary(binary)} className="flex-1">Convert</Button>
            {binary && <Button variant="outline" onClick={() => copyToClipboard(binary, "Binary")}>Copy</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decimal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter decimal number..."
            value={decimal}
            onChange={(e) => setDecimal(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={() => fromDecimal(decimal)} className="flex-1">Convert</Button>
            {decimal && <Button variant="outline" onClick={() => copyToClipboard(decimal, "Decimal")}>Copy</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hexadecimal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter hexadecimal number..."
            value={hex}
            onChange={(e) => setHex(e.target.value.toUpperCase())}
          />
          <div className="flex gap-2">
            <Button onClick={() => fromHex(hex)} className="flex-1">Convert</Button>
            {hex && <Button variant="outline" onClick={() => copyToClipboard(hex, "Hexadecimal")}>Copy</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

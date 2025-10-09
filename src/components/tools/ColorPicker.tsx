import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const ColorPicker = () => {
  const [color, setColor] = useState("#3b82f6");

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const hexToHsl = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const rgb = hexToRgb(color);
  const hsl = hexToHsl(color);

  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pick a Color</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Color Picker</Label>
            <div className="flex gap-3">
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-20 w-full cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>HEX Value</Label>
            <div className="flex gap-2">
              <Input value={color.toUpperCase()} readOnly />
              <Button onClick={() => copyValue(color.toUpperCase())} variant="outline">
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rgb && (
            <div className="space-y-2">
              <Label>RGB</Label>
              <div className="flex gap-2">
                <Input value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} readOnly />
                <Button onClick={() => copyValue(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)} variant="outline">
                  Copy
                </Button>
              </div>
            </div>
          )}

          {hsl && (
            <div className="space-y-2">
              <Label>HSL</Label>
              <div className="flex gap-2">
                <Input value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} readOnly />
                <Button onClick={() => copyValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)} variant="outline">
                  Copy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 rounded-lg" style={{ backgroundColor: color }} />
        </CardContent>
      </Card>
    </div>
  );
};

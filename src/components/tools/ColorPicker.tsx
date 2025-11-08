import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";

export const ColorPicker = () => {
  const [color, setColor] = useState("#3b82f6");
  const [hexInput, setHexInput] = useState("#3b82f6");
  const [rgbInput, setRgbInput] = useState("59, 130, 246");
  const [hslInput, setHslInput] = useState("217, 91%, 60%");

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

  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (n: number) => {
      const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    s = s / 100;
    l = l / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  };

  const hexToHsl = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

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

  const updateColor = (newColor: string) => {
    setColor(newColor);
    setHexInput(newColor.toUpperCase());
    const rgb = hexToRgb(newColor);
    const hsl = hexToHsl(newColor);
    if (rgb) setRgbInput(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
    if (hsl) setHslInput(`${hsl.h}, ${hsl.s}%, ${hsl.l}%`);
  };

  const handleHexInput = (value: string) => {
    setHexInput(value);
    // Allow # prefix or not
    const hex = value.startsWith('#') ? value : `#${value}`;
    if (/^#[0-9A-Fa-f]{6}$/i.test(hex)) {
      updateColor(hex);
      notify.success("Color updated from HEX");
    }
  };

  const handleRgbInput = (value: string) => {
    setRgbInput(value);
    // Parse RGB values (e.g., "59, 130, 246" or "rgb(59, 130, 246)")
    const match = value.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
        const hex = rgbToHex(r, g, b);
        updateColor(hex);
        notify.success("Color updated from RGB");
      }
    }
  };

  const handleHslInput = (value: string) => {
    setHslInput(value);
    // Parse HSL values (e.g., "217, 91%, 60%" or "hsl(217, 91%, 60%)")
    const match = value.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseInt(match[2]);
      const l = parseInt(match[3]);
      if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
        const rgb = hslToRgb(h, s, l);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        updateColor(hex);
        notify.success("Color updated from HSL");
      }
    }
  };

  const rgb = hexToRgb(color);
  const hsl = hexToHsl(color);

  const copyValue = async (value: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        notify.success("Copied to clipboard!");
      } else {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          notify.success("Copied to clipboard!");
        } catch {
          notify.error("Failed to copy");
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch {
      notify.error("Failed to copy");
    }
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
                onChange={(e) => updateColor(e.target.value)}
                className="h-20 w-full cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>HEX Value</Label>
            <div className="flex gap-2">
              <Input 
                value={hexInput} 
                onChange={(e) => handleHexInput(e.target.value)}
                placeholder="#3B82F6"
                className="font-mono"
              />
              <Button onClick={() => copyValue(color.toUpperCase())} variant="outline">
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a hex code (e.g., #FF5733 or FF5733)
            </p>
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
                <Input 
                  value={rgbInput}
                  onChange={(e) => handleRgbInput(e.target.value)}
                  placeholder="59, 130, 246"
                  className="font-mono"
                />
                <Button onClick={() => copyValue(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)} variant="outline">
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter RGB values (e.g., 255, 87, 51 or rgb(255, 87, 51))
              </p>
            </div>
          )}

          {hsl && (
            <div className="space-y-2">
              <Label>HSL</Label>
              <div className="flex gap-2">
                <Input 
                  value={hslInput}
                  onChange={(e) => handleHslInput(e.target.value)}
                  placeholder="217, 91%, 60%"
                  className="font-mono"
                />
                <Button onClick={() => copyValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)} variant="outline">
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter HSL values (e.g., 9, 100%, 64% or hsl(9, 100%, 64%))
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 rounded-lg border-2 border-border" style={{ backgroundColor: color }} />
        </CardContent>
      </Card>
    </div>
  );
};

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, RotateCcw } from "lucide-react";
import { notify } from "@/lib/notify";

// -----------------------------
// Helper utilities
// -----------------------------
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const sanitizeHexColor = (val: string): string | null => {
  if (typeof val !== "string") return null;
  const v = val.trim();
  const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(v);
  if (!m) return null;

  const hex = m[1];
  if (hex.length === 3) {
    // expand #rgb to #rrggbb
    return (
      "#" +
      hex
        .split("")
        .map((ch) => ch + ch)
        .join("")
        .toLowerCase()
    );
  }
  return "#" + hex.toLowerCase();
};

const allowTypingHex = (val: string): string => {
  // Allow partial typing like "#a", "#af2", "#00ff"
  const stripped = val.replace(/[^#0-9a-fA-F]/g, "");
  const hex = stripped.replace("#", "").slice(0, 6);
  return "#" + hex;
};

// -----------------------------
// Component
// -----------------------------
export const BoxShadowGenerator = () => {
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const [verticalOffset, setVerticalOffset] = useState(4);
  const [blurRadius, setBlurRadius] = useState(8);
  const [spreadRadius, setSpreadRadius] = useState(0);

  const [color, setColor] = useState("#000000");
  const [opacity, setOpacity] = useState(25); // % (0–100)
  const [inset, setInset] = useState(false);

  // -----------------------------
  // Generate the actual box-shadow string
  // -----------------------------
  const boxShadow = useMemo(() => {
    const safeColor = sanitizeHexColor(color) || "#000000";
    const alpha = clamp(opacity, 0, 100) / 100;

    // Convert opacity to 2-digit hex (00–FF)
    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");

    const finalColor = `${safeColor}${alphaHex}`;

    const x = clamp(horizontalOffset, -50, 50);
    const y = clamp(verticalOffset, -50, 50);
    const blur = clamp(blurRadius, 0, 50);
    const spread = clamp(spreadRadius, -50, 50);

    return `${x}px ${y}px ${blur}px ${spread}px ${finalColor}${
      inset ? " inset" : ""
    }`;
  }, [
    horizontalOffset,
    verticalOffset,
    blurRadius,
    spreadRadius,
    color,
    opacity,
    inset,
  ]);

  // -----------------------------
  // Copy helper
  // -----------------------------
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        notify.success("Copied to clipboard!");
        return;
      }

      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();

      const ok = document.execCommand("copy");
      document.body.removeChild(ta);

      notify[ok ? "success" : "error"](
        ok ? "Copied to clipboard!" : "Copy failed"
      );
    } catch (err) {
      console.error("Copy failed:", err);
      notify.error("Copy failed");
    }
  }, []);

  // -----------------------------
  // Reset to defaults
  // -----------------------------
  const clearAll = useCallback(() => {
    setHorizontalOffset(0);
    setVerticalOffset(4);
    setBlurRadius(8);
    setSpreadRadius(0);
    setColor("#000000");
    setOpacity(25);
    setInset(false);
    notify.success("Reset to defaults!");
  }, []);

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="space-y-6">
      {/* SETTINGS */}
      <Card>
        <CardHeader>
          <CardTitle>Box Shadow Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Horizontal */}
            <div className="space-y-2">
              <Label>Horizontal Offset: {horizontalOffset}px</Label>
              <Slider
                value={[horizontalOffset]}
                onValueChange={(v) => setHorizontalOffset(v[0])}
                min={-50}
                max={50}
                step={1}
              />
            </div>

            {/* Vertical */}
            <div className="space-y-2">
              <Label>Vertical Offset: {verticalOffset}px</Label>
              <Slider
                value={[verticalOffset]}
                onValueChange={(v) => setVerticalOffset(v[0])}
                min={-50}
                max={50}
                step={1}
              />
            </div>

            {/* Blur */}
            <div className="space-y-2">
              <Label>Blur Radius: {blurRadius}px</Label>
              <Slider
                value={[blurRadius]}
                onValueChange={(v) => setBlurRadius(v[0])}
                min={0}
                max={50}
                step={1}
              />
            </div>

            {/* Spread */}
            <div className="space-y-2">
              <Label>Spread Radius: {spreadRadius}px</Label>
              <Slider
                value={[spreadRadius]}
                onValueChange={(v) => setSpreadRadius(v[0])}
                min={-50}
                max={50}
                step={1}
              />
            </div>
          </div>

          {/* Color + opacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="shadow-color">Shadow Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={sanitizeHexColor(color) || "#000000"}
                  onChange={(e) =>
                    setColor(sanitizeHexColor(e.target.value) || "#000000")
                  }
                  className="w-16 h-10"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(allowTypingHex(e.target.value))}
                />
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <Label>Opacity: {opacity}%</Label>
              <Slider
                value={[opacity]}
                onValueChange={(v) => setOpacity(v[0])}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>

          {/* Inset */}
          <div className="space-y-2">
            <Label>Shadow Type</Label>
            <Select
              value={inset.toString()}
              onValueChange={(v) => setInset(v === "true")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shadow type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Outset (default)</SelectItem>
                <SelectItem value="true">Inset</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="w-full" onClick={clearAll}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </CardContent>
      </Card>

      {/* PREVIEW */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-8 bg-gray-100 rounded-lg">
            <div
              className="w-32 h-32 bg-white rounded-lg flex items-center justify-center text-gray-600 font-medium"
              style={{ boxShadow }}
            >
              Preview
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSS OUTPUT */}
      <Card>
        <CardHeader>
          <CardTitle>Generated CSS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Box-shadow line */}
          <div className="space-y-2">
            <Label>CSS Box Shadow</Label>
            <div className="flex gap-2">
              <Input
                value={`box-shadow: ${boxShadow};`}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(`box-shadow: ${boxShadow};`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Complete rule */}
          <div className="space-y-2">
            <Label>Complete CSS Rule</Label>
            <div className="flex gap-2">
              <Input
                value={`.shadow-box {\n  box-shadow: ${boxShadow};\n}`}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() =>
                  copyToClipboard(`.shadow-box {\n  box-shadow: ${boxShadow};\n}`)
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tailwind */}
          <div className="space-y-2">
            <Label>Tailwind CSS</Label>
            <div className="flex gap-2">
              <Input
                value={`shadow-[${boxShadow}]`}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(`shadow-[${boxShadow}]`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EXPLANATION */}
      <Card>
        <CardHeader>
          <CardTitle>Box Shadow Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <strong>Horizontal Offset:</strong> Moves the shadow left (negative)
              or right (positive).
            </div>
            <div>
              <strong>Vertical Offset:</strong> Moves the shadow up (negative) or
              down (positive).
            </div>
            <div>
              <strong>Blur Radius:</strong> Controls how soft the shadow looks.
            </div>
            <div>
              <strong>Spread Radius:</strong> Expands or contracts the shadow.
            </div>
            <div>
              <strong>Color:</strong> Accepts hex colors, with full validation.
            </div>
            <div>
              <strong>Opacity:</strong> Controls transparency of the shadow.
            </div>
            <div>
              <strong>Inset:</strong> Creates an inner shadow.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

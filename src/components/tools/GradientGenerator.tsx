import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALLOWED_DIRECTIONS = [
  "to right", "to left", "to top", "to bottom",
  "to top right", "to top left", "to bottom right", "to bottom left"
] as const;
type Direction = typeof ALLOWED_DIRECTIONS[number];

const coerceDirection = (value: string): Direction => {
  return ALLOWED_DIRECTIONS.includes(value as Direction) ? (value as Direction) : "to right";
};

// Sanitize hex color input
const sanitizeHexColor = (value: string): string => {
  // Allow only # followed by valid hex chars, max 7 chars (#RRGGBB)
  const cleaned = value.replace(/[^#0-9A-Fa-f]/g, '');
  if (cleaned.startsWith('#')) {
    return '#' + cleaned.slice(1, 7);
  }
  return cleaned.slice(0, 6);
};

export const GradientGenerator = () => {
  const [color1, setColor1] = useState("#3b82f6");
  const [color2, setColor2] = useState("#8b5cf6");
  const [direction, setDirection] = useState<Direction>("to right");
  const [cssCode, setCssCode] = useState("");

  const generateGradient = () => {
    const css = `background: linear-gradient(${direction}, ${color1}, ${color2});`;
    setCssCode(css);
  notify.success("Gradient generated!");
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(cssCode);
        notify.success("CSS copied!");
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = cssCode;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          notify.success("CSS copied!");
        } else {
          notify.error("Failed to copy");
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      notify.error("Failed to copy to clipboard");
    }
  };

  const gradientStyle = {
    background: `linear-gradient(${direction}, ${color1}, ${color2})`,
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Configure Gradient</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Color 1</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={color1}
                  onChange={(e) => setColor1(sanitizeHexColor(e.target.value))}
                  placeholder="#3b82f6"
                  maxLength={7}
                />
              </div>
            </div>
            
            <div>
              <Label>Color 2</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={color2}
                  onChange={(e) => setColor2(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={color2}
                  onChange={(e) => setColor2(sanitizeHexColor(e.target.value))}
                  placeholder="#8b5cf6"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(value) => setDirection(coerceDirection(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to right">To Right</SelectItem>
                <SelectItem value="to left">To Left</SelectItem>
                <SelectItem value="to top">To Top</SelectItem>
                <SelectItem value="to bottom">To Bottom</SelectItem>
                <SelectItem value="to top right">To Top Right</SelectItem>
                <SelectItem value="to top left">To Top Left</SelectItem>
                <SelectItem value="to bottom right">To Bottom Right</SelectItem>
                <SelectItem value="to bottom left">To Bottom Left</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={generateGradient} className="w-full">Generate CSS</Button>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={gradientStyle}
            className="w-full h-48 rounded-lg"
          />
        </CardContent>
      </Card>

      {cssCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              CSS Code
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                Copy
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="block p-4 bg-muted rounded-lg font-mono text-sm">{cssCode}</code>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

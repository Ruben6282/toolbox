import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RotateCcw, Eye } from "lucide-react";
import { notify } from "@/lib/notify";

export const BoxShadowGenerator = () => {
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const [verticalOffset, setVerticalOffset] = useState(4);
  const [blurRadius, setBlurRadius] = useState(8);
  const [spreadRadius, setSpreadRadius] = useState(0);
  const [color, setColor] = useState("#000000");
  const [opacity, setOpacity] = useState(25);
  const [inset, setInset] = useState(false);

  // Guardrails
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  const sanitizeHexColor = (val: string): string | null => {
    if (typeof val !== 'string') return null;
    const v = val.trim();
    const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(v);
    if (!m) return null;
    const hex = m[1];
    if (hex.length === 3) {
      // Expand 3-digit shorthand to 6-digit
      return '#' + hex.split('').map(ch => ch + ch).join('').toLowerCase();
    }
    return '#' + hex.toLowerCase();
  };
  const normalizeTypingColor = (val: string): string => {
    // Allow partial typing: keep a leading # and up to 6 hex chars
    const stripped = val.replace(/[^#0-9a-fA-F]/g, '');
    let out = stripped.startsWith('#') ? '#' : '#';
    const hex = stripped.replace('#', '').slice(0, 6);
    out += hex;
    return out;
  };

  const generateBoxShadow = () => {
    const alpha = clamp(opacity, 0, 100) / 100;
    const safeColor = sanitizeHexColor(color) || '#000000';
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    const colorWithAlpha = `${safeColor}${alphaHex}`;
    const x = clamp(horizontalOffset, -50, 50);
    const y = clamp(verticalOffset, -50, 50);
    const blur = clamp(blurRadius, 0, 50);
    const spread = clamp(spreadRadius, -50, 50);
    const shadow = `${x}px ${y}px ${blur}px ${spread}px ${colorWithAlpha}${inset ? ' inset' : ''}`;
    return shadow;
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        notify.success("Copied to clipboard!");
        return;
      }

      // Fallback for older browsers/mobile
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        notify.success("Copied to clipboard!");
      } else {
        notify.error("Failed to copy");
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      notify.error("Failed to copy");
    }
  };

  const clearAll = () => {
    setHorizontalOffset(0);
    setVerticalOffset(4);
    setBlurRadius(8);
    setSpreadRadius(0);
    setColor("#000000");
    setOpacity(25);
    setInset(false);
    notify.success("Reset to default values!");
  };

  const boxShadow = generateBoxShadow();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Box Shadow Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horizontal Offset: {horizontalOffset}px</Label>
              <Slider
                value={[horizontalOffset]}
                onValueChange={(value) => setHorizontalOffset(value[0])}
                min={-50}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Vertical Offset: {verticalOffset}px</Label>
              <Slider
                value={[verticalOffset]}
                onValueChange={(value) => setVerticalOffset(value[0])}
                min={-50}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Blur Radius: {blurRadius}px</Label>
              <Slider
                value={[blurRadius]}
                onValueChange={(value) => setBlurRadius(value[0])}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Spread Radius: {spreadRadius}px</Label>
              <Slider
                value={[spreadRadius]}
                onValueChange={(value) => setSpreadRadius(value[0])}
                min={-50}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shadow-color">Shadow Color</Label>
              <div className="flex gap-2">
                <Input
                  id="shadow-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(sanitizeHexColor(e.target.value) || '#000000')}
                  className="w-16 h-10"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(normalizeTypingColor(e.target.value))}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Opacity: {opacity}%</Label>
              <Slider
                value={[opacity]}
                onValueChange={(value) => setOpacity(value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inset">Shadow Type</Label>
            <Select value={inset.toString()} onValueChange={(value) => setInset(value === "true")}>
              <SelectTrigger>
                <SelectValue placeholder="Select shadow type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Outset (Default)</SelectItem>
                <SelectItem value="true">Inset</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-8 bg-gray-100 rounded-lg">
            <div
              className="w-32 h-32 bg-white rounded-lg flex items-center justify-center text-gray-600 font-medium"
              style={{ boxShadow: boxShadow }}
            >
              Preview
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated CSS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>CSS Box Shadow</Label>
            <div className="flex gap-2">
              <Input
                value={`box-shadow: ${boxShadow};`}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(`box-shadow: ${boxShadow};`)}
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Complete CSS Rule</Label>
            <div className="flex gap-2">
              <Input
                value={`.shadow-box {\n  box-shadow: ${boxShadow};\n}`}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(`.shadow-box {\n  box-shadow: ${boxShadow};\n}`)}
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tailwind CSS</Label>
            <div className="flex gap-2">
              <Input
                value={`shadow-[${boxShadow}]`}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(`shadow-[${boxShadow}]`)}
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Box Shadow Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <strong>Horizontal Offset:</strong> Moves the shadow left (negative) or right (positive)
            </div>
            <div>
              <strong>Vertical Offset:</strong> Moves the shadow up (negative) or down (positive)
            </div>
            <div>
              <strong>Blur Radius:</strong> Controls how blurred the shadow appears (0 = sharp, higher = more blurred)
            </div>
            <div>
              <strong>Spread Radius:</strong> Expands (positive) or contracts (negative) the shadow
            </div>
            <div>
              <strong>Color:</strong> The color of the shadow
            </div>
            <div>
              <strong>Opacity:</strong> How transparent the shadow appears
            </div>
            <div>
              <strong>Inset:</strong> Creates an inner shadow instead of an outer shadow
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

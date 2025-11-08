import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RotateCcw, Square } from "lucide-react";
import { notify } from "@/lib/notify";

export const BorderRadiusGenerator = () => {
  const [topLeft, setTopLeft] = useState(8);
  const [topRight, setTopRight] = useState(8);
  const [bottomLeft, setBottomLeft] = useState(8);
  const [bottomRight, setBottomRight] = useState(8);
  const [unit, setUnit] = useState("px");
  const [previewSize, setPreviewSize] = useState(150);

  const units = [
    { label: "Pixels (px)", value: "px" },
    { label: "Percent (%)", value: "%" },
    { label: "Em", value: "em" },
    { label: "Rem", value: "rem" }
  ];

  const generateBorderRadius = () => {
    const values = [topLeft, topRight, bottomRight, bottomLeft];
    const borderRadius = values.map(value => `${value}${unit}`).join(' ');
    return borderRadius;
  };

  const generateCSS = () => {
    const borderRadius = generateBorderRadius();
    return `.border-radius-box {\n  border-radius: ${borderRadius};\n}`;
  };

  const generateTailwind = () => {
    // Try to find a matching Tailwind class
    const values = [topLeft, topRight, bottomRight, bottomLeft];
    const allSame = values.every(val => val === values[0]);
    
    if (allSame) {
      const value = values[0];
      if (value === 0) return "rounded-none";
      if (value === 2) return "rounded-sm";
      if (value === 4) return "rounded";
      if (value === 6) return "rounded-md";
      if (value === 8) return "rounded-lg";
      if (value === 12) return "rounded-xl";
      if (value === 16) return "rounded-2xl";
      if (value === 24) return "rounded-3xl";
      if (value === 32) return "rounded-full";
    }
    
    return `rounded-[${generateBorderRadius()}]`;
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
    setTopLeft(8);
    setTopRight(8);
    setBottomLeft(8);
    setBottomRight(8);
    setUnit("px");
    setPreviewSize(150);
    notify.success("Reset to default values!");
  };

  const setAllCorners = (value: number) => {
    setTopLeft(value);
    setTopRight(value);
    setBottomLeft(value);
    setBottomRight(value);
  };

  const borderRadius = generateBorderRadius();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Border Radius Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Top Left: {topLeft}{unit}</Label>
              <Slider
                value={[topLeft]}
                onValueChange={(value) => setTopLeft(value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Top Right: {topRight}{unit}</Label>
              <Slider
                value={[topRight]}
                onValueChange={(value) => setTopRight(value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Bottom Right: {bottomRight}{unit}</Label>
              <Slider
                value={[bottomRight]}
                onValueChange={(value) => setBottomRight(value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Bottom Left: {bottomLeft}{unit}</Label>
              <Slider
                value={[bottomLeft]}
                onValueChange={(value) => setBottomLeft(value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quick Actions</Label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setAllCorners(0)} variant="outline" size="sm">
                None (0)
              </Button>
              <Button onClick={() => setAllCorners(4)} variant="outline" size="sm">
                Small (4{unit})
              </Button>
              <Button onClick={() => setAllCorners(8)} variant="outline" size="sm">
                Medium (8{unit})
              </Button>
              <Button onClick={() => setAllCorners(16)} variant="outline" size="sm">
                Large (16{unit})
              </Button>
              <Button onClick={() => setAllCorners(50)} variant="outline" size="sm">
                Circle (50{unit})
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preview Size: {previewSize}px</Label>
            <Slider
              value={[previewSize]}
              onValueChange={(value) => setPreviewSize(value[0])}
              min={50}
              max={300}
              step={10}
              className="w-full"
            />
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
              className="bg-blue-500 flex items-center justify-center text-white font-medium"
              style={{
                width: `${previewSize}px`,
                height: `${previewSize}px`,
                borderRadius: borderRadius
              }}
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
            <Label>CSS Border Radius</Label>
            <div className="flex gap-2">
              <Input
                value={`border-radius: ${borderRadius};`}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(`border-radius: ${borderRadius};`)}
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
                value={generateCSS()}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(generateCSS())}
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
                value={generateTailwind()}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(generateTailwind())}
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
          <CardTitle>Border Radius Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <strong>Top Left:</strong> Controls the radius of the top-left corner
            </div>
            <div>
              <strong>Top Right:</strong> Controls the radius of the top-right corner
            </div>
            <div>
              <strong>Bottom Right:</strong> Controls the radius of the bottom-right corner
            </div>
            <div>
              <strong>Bottom Left:</strong> Controls the radius of the bottom-left corner
            </div>
            <div>
              <strong>Units:</strong> Choose between px, %, em, or rem for different scaling behaviors
            </div>
            <div>
              <strong>Values:</strong> 0 = sharp corner, higher values = more rounded
            </div>
            <div>
              <strong>Circle:</strong> Set all corners to 50% to create a perfect circle
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

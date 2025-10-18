import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RotateCcw, Eye } from "lucide-react";

export const BoxShadowGenerator = () => {
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const [verticalOffset, setVerticalOffset] = useState(4);
  const [blurRadius, setBlurRadius] = useState(8);
  const [spreadRadius, setSpreadRadius] = useState(0);
  const [color, setColor] = useState("#000000");
  const [opacity, setOpacity] = useState(25);
  const [inset, setInset] = useState(false);

  const generateBoxShadow = () => {
    const alpha = opacity / 100;
    const colorWithAlpha = `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
    
    const shadow = `${horizontalOffset}px ${verticalOffset}px ${blurRadius}px ${spreadRadius}px ${colorWithAlpha}${inset ? ' inset' : ''}`;
    return shadow;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
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
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
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

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const GradientGenerator = () => {
  const [color1, setColor1] = useState("#3b82f6");
  const [color2, setColor2] = useState("#8b5cf6");
  const [direction, setDirection] = useState("to right");
  const [cssCode, setCssCode] = useState("");

  const generateGradient = () => {
    const css = `background: linear-gradient(${direction}, ${color1}, ${color2});`;
    setCssCode(css);
    toast.success("Gradient generated!");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssCode);
    toast.success("CSS copied!");
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
                  onChange={(e) => setColor1(e.target.value)}
                  placeholder="#3b82f6"
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
                  onChange={(e) => setColor2(e.target.value)}
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Direction</Label>
            <Select value={direction} onValueChange={setDirection}>
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

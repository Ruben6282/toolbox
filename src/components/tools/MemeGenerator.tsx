import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download, RotateCcw, Upload, Type } from "lucide-react";

const MEME_TEMPLATES = [
  { id: "drake", name: "Drake Pointing", url: "https://i.imgflip.com/30b1.jpg" },
  { id: "distracted", name: "Distracted Boyfriend", url: "https://i.imgflip.com/1ur9b0.jpg" },
  { id: "woman", name: "Woman Yelling at Cat", url: "https://i.imgflip.com/345v97.jpg" },
  { id: "change", name: "Change My Mind", url: "https://i.imgflip.com/24y43o.jpg" },
  { id: "two", name: "Two Buttons", url: "https://i.imgflip.com/1g8my4.jpg" },
  { id: "expanding", name: "Expanding Brain", url: "https://i.imgflip.com/1jwhww.jpg" },
  { id: "this", name: "This is Fine", url: "https://i.imgflip.com/26am.jpg" },
  { id: "roll", name: "Roll Safe", url: "https://i.imgflip.com/1h7in3.jpg" }
];

export const MemeGenerator = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(MEME_TEMPLATES[0]);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [fontSize, setFontSize] = useState(40);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);

  const addTextToImage = () => {
    if (!canvasRef) return;

    const canvas = canvasRef;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the template image
      ctx.drawImage(img, 0, 0);
      
      // Set text properties
      ctx.font = `bold ${fontSize}px Impact, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // Add stroke
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineJoin = 'round';
      
      // Add top text
      if (topText) {
        ctx.fillStyle = textColor;
        const topY = 20;
        ctx.strokeText(topText, canvas.width / 2, topY);
        ctx.fillText(topText, canvas.width / 2, topY);
      }
      
      // Add bottom text
      if (bottomText) {
        ctx.fillStyle = textColor;
        const bottomY = canvas.height - fontSize - 20;
        ctx.strokeText(bottomText, canvas.width / 2, bottomY);
        ctx.fillText(bottomText, canvas.width / 2, bottomY);
      }
    };
    img.src = selectedTemplate.url;
  };

  const downloadMeme = () => {
    if (!canvasRef) return;

    const link = document.createElement('a');
    link.download = `meme-${selectedTemplate.id}.png`;
    link.href = canvasRef.toDataURL('image/png');
    link.click();
  };

  const clearMeme = () => {
    setTopText("");
    setBottomText("");
    setFontSize(40);
    setTextColor("#FFFFFF");
    setStrokeColor("#000000");
    setStrokeWidth(2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meme Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-select">Meme Template</Label>
            <Select value={selectedTemplate.id} onValueChange={(value) => {
              const template = MEME_TEMPLATES.find(t => t.id === value);
              if (template) setSelectedTemplate(template);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {MEME_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="top-text">Top Text</Label>
              <Input
                id="top-text"
                placeholder="Enter top text..."
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bottom-text">Bottom Text</Label>
              <Input
                id="bottom-text"
                placeholder="Enter bottom text..."
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Font Size: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                min={20}
                max={80}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Stroke Width: {strokeWidth}px</Label>
              <Slider
                value={[strokeWidth]}
                onValueChange={(value) => setStrokeWidth(value[0])}
                min={0}
                max={8}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="text-color">Text Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="text-color"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stroke-color">Stroke Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="stroke-color"
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={addTextToImage} className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Generate Meme
            </Button>
            <Button onClick={downloadMeme} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={clearMeme} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meme Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-muted">
            <canvas
              ref={(ref) => setCanvasRef(ref)}
              className="max-w-full h-auto rounded"
              style={{ display: 'block', margin: '0 auto' }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meme Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Keep text short and punchy for maximum impact</li>
            <li>• Use contrasting colors for better readability</li>
            <li>• Top text is usually the setup, bottom text is the punchline</li>
            <li>• Adjust font size based on the template and text length</li>
            <li>• Stroke helps text stand out against busy backgrounds</li>
            <li>• Popular memes work best with relatable content</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

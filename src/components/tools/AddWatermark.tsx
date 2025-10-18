import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download, RotateCcw, Upload, Droplet } from "lucide-react";

export const AddWatermark = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState("SAMPLE");
  const [watermarkType, setWatermarkType] = useState("text");
  const [position, setPosition] = useState("bottom-right");
  const [opacity, setOpacity] = useState(50);
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);

  const positions = [
    { label: "Top Left", value: "top-left" },
    { label: "Top Center", value: "top-center" },
    { label: "Top Right", value: "top-right" },
    { label: "Center Left", value: "center-left" },
    { label: "Center", value: "center" },
    { label: "Center Right", value: "center-right" },
    { label: "Bottom Left", value: "bottom-left" },
    { label: "Bottom Center", value: "bottom-center" },
    { label: "Bottom Right", value: "bottom-right" },
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addWatermark = () => {
    if (!selectedImage || !canvasRef) return;

    const canvas = canvasRef;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Calculate watermark position
      const { x, y } = getWatermarkPosition(canvas.width, canvas.height, position);
      
      // Set font properties
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add background if needed
      if (backgroundColor !== 'transparent') {
        const textMetrics = ctx.measureText(watermarkText);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        const padding = 10;
        
        ctx.fillStyle = backgroundColor;
        ctx.globalAlpha = opacity / 100;
        ctx.fillRect(
          x - textWidth / 2 - padding,
          y - textHeight / 2 - padding,
          textWidth + padding * 2,
          textHeight + padding * 2
        );
      }
      
      // Add text watermark
      ctx.fillStyle = textColor;
      ctx.globalAlpha = opacity / 100;
      ctx.fillText(watermarkText, x, y);
      
      // Reset global alpha
      ctx.globalAlpha = 1;
    };
    img.src = selectedImage;
  };

  const getWatermarkPosition = (canvasWidth: number, canvasHeight: number, pos: string) => {
    const margin = 20;
    
    switch (pos) {
      case 'top-left':
        return { x: margin + 50, y: margin + 20 };
      case 'top-center':
        return { x: canvasWidth / 2, y: margin + 20 };
      case 'top-right':
        return { x: canvasWidth - margin - 50, y: margin + 20 };
      case 'center-left':
        return { x: margin + 50, y: canvasHeight / 2 };
      case 'center':
        return { x: canvasWidth / 2, y: canvasHeight / 2 };
      case 'center-right':
        return { x: canvasWidth - margin - 50, y: canvasHeight / 2 };
      case 'bottom-left':
        return { x: margin + 50, y: canvasHeight - margin - 20 };
      case 'bottom-center':
        return { x: canvasWidth / 2, y: canvasHeight - margin - 20 };
      case 'bottom-right':
        return { x: canvasWidth - margin - 50, y: canvasHeight - margin - 20 };
      default:
        return { x: canvasWidth - margin - 50, y: canvasHeight - margin - 20 };
    }
  };

  const downloadWatermarkedImage = () => {
    if (!canvasRef) return;

    const link = document.createElement('a');
    link.download = 'watermarked-image.png';
    link.href = canvasRef.toDataURL('image/png');
    link.click();
  };

  const clearAll = () => {
    setSelectedImage(null);
    setWatermarkText("SAMPLE");
    setPosition("bottom-right");
    setOpacity(50);
    setFontSize(24);
    setTextColor("#FFFFFF");
    setBackgroundColor("#000000");
    if (canvasRef) {
      const ctx = canvasRef.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Watermark</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
              />
              <Button variant="outline" onClick={clearAll}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="watermark-text">Watermark Text</Label>
            <Textarea
              id="watermark-text"
              placeholder="Enter watermark text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                min={12}
                max={72}
                step={2}
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
              <Label htmlFor="background-color">Background Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="background-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Opacity: {opacity}%</Label>
            <Slider
              value={[opacity]}
              onValueChange={(value) => setOpacity(value[0])}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <Button onClick={addWatermark} disabled={!selectedImage} className="w-full">
            <Droplet className="h-4 w-4 mr-2" />
            Add Watermark
          </Button>
        </CardContent>
      </Card>

      {selectedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Watermarked Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted">
              <canvas
                ref={(ref) => setCanvasRef(ref)}
                className="max-w-full h-auto rounded"
                style={{ display: 'block', margin: '0 auto' }}
              />
            </div>
            
            <div className="mt-4">
              <Button onClick={downloadWatermarkedImage} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Watermarked Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Watermark Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use contrasting colors for better visibility</li>
            <li>• Position watermarks where they won't interfere with the main content</li>
            <li>• Adjust opacity to make watermarks subtle but visible</li>
            <li>• Consider using your logo or brand name as watermark text</li>
            <li>• Test different positions to find the best placement</li>
            <li>• Higher resolution images work better for watermarks</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download, RotateCcw, Upload, Palette } from "lucide-react";
import { notify } from "@/lib/notify";
import { ALLOWED_IMAGE_TYPES, validateImageFile } from "@/lib/security";

export const ImageGrayscale = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [grayscaleType, setGrayscaleType] = useState("luminance");
  const [contrast, setContrast] = useState(1);
  const [brightness, setBrightness] = useState(0);
  const [outputFormat, setOutputFormat] = useState("png");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const grayscaleTypes = [
    { label: "Luminance (Recommended)", value: "luminance" },
    { label: "Average", value: "average" },
    { label: "Red Channel", value: "red" },
    { label: "Green Channel", value: "green" },
    { label: "Blue Channel", value: "blue" },
    { label: "Desaturate", value: "desaturate" },
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      notify.error(error);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string); // base64 from validated file
      notify.success("Image uploaded successfully!");
    };
    reader.onerror = () => notify.error("Failed to read image file");
    reader.readAsDataURL(file);
  };

  const convertToGrayscale = () => {
    if (!selectedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        let gray;

        switch (grayscaleType) {
          case "luminance":
            // Luminance method (most accurate for human perception)
            gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            break;
          case "average":
            gray = Math.round((r + g + b) / 3);
            break;
          case "red":
            gray = r;
            break;
          case "green":
            gray = g;
            break;
          case "blue":
            gray = b;
            break;
          case "desaturate": {
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            gray = Math.round((max + min) / 2);
            break;
          }
          default:
            gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        }

        // Apply contrast and brightness
        gray = Math.round(gray * contrast + brightness);
        gray = Math.max(0, Math.min(255, gray));

        data[i] = gray;     // Red
        data[i + 1] = gray; // Green
        data[i + 2] = gray; // Blue
        data[i + 3] = a;    // Alpha (unchanged)
      }

      ctx.putImageData(imageData, 0, 0);
      notify.success("Image converted to grayscale!");
    };
    img.src = selectedImage;
  };

  const downloadGrayscaleImage = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `grayscale-image.${outputFormat}`;
    link.href = canvasRef.current.toDataURL(`image/${outputFormat}`);
    link.click();
    notify.success("Grayscale image downloaded!");
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    notify.success("Image cleared!");
  };

  const resetSettings = () => {
    setContrast(1);
    setBrightness(0);
    setGrayscaleType("luminance");
    notify.success("Settings reset to default!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Grayscale Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload Image</Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                id="image-upload"
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                onChange={handleImageUpload}
                className="flex-1"
              />
              <Button variant="outline" onClick={clearImage} className="w-full sm:w-auto">
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grayscale-type">Grayscale Method</Label>
              <Select value={grayscaleType} onValueChange={setGrayscaleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {grayscaleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="output-format">Output Format</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contrast: {contrast.toFixed(1)}x</Label>
              <Slider
                value={[contrast]}
                onValueChange={(value) => setContrast(value[0])}
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Brightness: {brightness > 0 ? '+' : ''}{brightness}</Label>
              <Slider
                value={[brightness]}
                onValueChange={(value) => setBrightness(value[0])}
                min={-100}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {selectedImage && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={convertToGrayscale} className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Palette className="h-4 w-4" />
                Convert to Grayscale
              </Button>
              <Button onClick={downloadGrayscaleImage} variant="outline" className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button onClick={resetSettings} variant="outline" className="w-full sm:w-auto">
                Reset Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedImage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Original Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted">
                <img
                  src={selectedImage}
                  alt="Original"
                  className="max-w-full h-auto rounded"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grayscale Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto rounded"
                  style={{ display: 'block', margin: '0 auto' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Grayscale Methods Explained</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Luminance:</strong> Uses the formula 0.299×R + 0.587×G + 0.114×B, which matches human eye sensitivity to different colors.
            </div>
            <div>
              <strong>Average:</strong> Simple average of red, green, and blue values (R+G+B)/3.
            </div>
            <div>
              <strong>Channel Methods:</strong> Uses only one color channel (red, green, or blue) as the grayscale value.
            </div>
            <div>
              <strong>Desaturate:</strong> Calculates the midpoint between the highest and lowest color values.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

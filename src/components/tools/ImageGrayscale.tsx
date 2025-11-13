/**
 * ImageGrayscale - Enterprise-Grade Security Hardening
 *
 * Security & performance features:
 * - File size limit (10MB) to prevent memory pressure
 * - Magic byte validation to prevent file type spoofing
 * - Dimension guardrails using MAX_IMAGE_DIMENSION with auto-downscaling
 * - Canvas error guards (try/catch) to handle corrupted image data
 * - Object URL approach for memory efficiency (vs Base64)
 * - MIME type verification before processing
 */
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download, RotateCcw, Upload, Palette } from "lucide-react";
import { notify } from "@/lib/notify";
import { ALLOWED_IMAGE_TYPES, validateImageFile, MAX_IMAGE_DIMENSION } from "@/lib/security";
import { useObjectUrls } from "@/hooks/use-object-urls";

const ALLOWED_GRAYSCALE_TYPES = ["luminance", "average", "red", "green", "blue", "desaturate"] as const;
const ALLOWED_OUTPUT_FORMATS = ["png", "jpeg", "webp"] as const;
type GrayscaleType = typeof ALLOWED_GRAYSCALE_TYPES[number];
type OutputFormat = typeof ALLOWED_OUTPUT_FORMATS[number];

const coerceGrayscaleType = (value: string): GrayscaleType => {
  return ALLOWED_GRAYSCALE_TYPES.includes(value as GrayscaleType) ? (value as GrayscaleType) : "luminance";
};

const coerceOutputFormat = (value: string): OutputFormat => {
  return ALLOWED_OUTPUT_FORMATS.includes(value as OutputFormat) ? (value as OutputFormat) : "png";
};

const clampContrast = (value: number): number => {
  return Math.max(0, Math.min(3, value));
};

const clampBrightness = (value: number): number => {
  return Math.max(-100, Math.min(100, value));
};

export const ImageGrayscale = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [grayscaleType, setGrayscaleType] = useState<GrayscaleType>("luminance");
  const [contrast, setContrast] = useState(1);
  const [brightness, setBrightness] = useState(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { createImageUrl } = useObjectUrls();

  // Security guardrail
  const MAX_FILE_SIZE_MB = 10;

  const grayscaleTypes = [
    { label: "Luminance (Recommended)", value: "luminance" },
    { label: "Average", value: "average" },
    { label: "Red Channel", value: "red" },
    { label: "Green Channel", value: "green" },
    { label: "Blue Channel", value: "blue" },
    { label: "Desaturate", value: "desaturate" },
  ];

  /**
   * Magic byte validation (best-effort spoofing prevention)
   */
  const sniffMime = async (file: File): Promise<string | null> => {
    try {
      const slice = file.slice(0, 16);
      const buf = await slice.arrayBuffer();
      const bytes = new Uint8Array(buf);
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 && bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
        return "image/png";
      }
      // JPEG: FF D8 FF
      if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return "image/jpeg";
      }
      // WEBP (RIFF....WEBP): 52 49 46 46 .... 57 45 42 50
      if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return "image/webp";
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File size check
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      notify.error(`File too large (max ${MAX_FILE_SIZE_MB}MB)`);
      return;
    }

    // MIME allowlist check
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notify.error("Unsupported file type. Please upload PNG, JPEG, or WEBP.");
      return;
    }

    // Magic bytes verification (best-effort)
    const sniffed = await sniffMime(file);
    if (sniffed && !ALLOWED_IMAGE_TYPES.includes(sniffed)) {
      notify.error("File signature does not match an allowed image type.");
      return;
    }

    const error = validateImageFile(file);
    if (error) {
      notify.error(error);
      return;
    }

    // Use object URL for memory efficiency (vs Base64)
    const url = await createImageUrl(file, { downscaleLarge: true, maxDimension: MAX_IMAGE_DIMENSION });
    if (!url) {
      notify.error("Failed to create image preview");
      return;
    }

    setSelectedImage(url);
    notify.success("Image uploaded successfully!");
  };

  const convertToGrayscale = () => {
    if (!selectedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      try {
        // Dimension guardrail: downscale if exceeds MAX_IMAGE_DIMENSION
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const scale = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
          notify.warning(`Image downscaled to ${width}×${height}px for processing`);
        }

        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Canvas error guard: wrap getImageData/putImageData
        let imageData;
        try {
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (err) {
          notify.error("Failed to read image data. Image may be corrupted.");
          console.error("getImageData error:", err);
          return;
        }

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

        try {
          ctx.putImageData(imageData, 0, 0);
          notify.success("Image converted to grayscale!");
        } catch (err) {
          notify.error("Failed to write image data. Processing may have failed.");
          console.error("putImageData error:", err);
        }
      } catch (err) {
        notify.error("Unexpected error during grayscale conversion");
        console.error("Grayscale conversion error:", err);
      }
    };
    img.onerror = () => {
      notify.error("Failed to load image. File may be corrupted.");
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
              <Select value={grayscaleType} onValueChange={(value) => setGrayscaleType(coerceGrayscaleType(value))}>
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
              <Select value={outputFormat} onValueChange={(value) => setOutputFormat(coerceOutputFormat(value))}>
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

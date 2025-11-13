/**
 * ImageFormatConverter - Enterprise-grade image format conversion tool
 * 
 * Security Features:
 * - File Size Limit: 10MB MAX_FILE_SIZE_MB prevents memory exhaustion
 * - Magic Byte Validation: sniffMime() verifies PNG/JPEG/WEBP signatures
 * - Dimension Guardrails: MAX_IMAGE_DIMENSION (4096px) with auto-downscaling
 * - Canvas Safety: try/catch around drawImage() and toDataURL()
 * - GIF/BMP Warnings: Alerts users about canvas format limitations
 * - Object URL Approach: Blob URLs instead of Base64 for memory efficiency
 * - Accessibility: aria-live announcements for screen readers
 */

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  RotateCcw,
  ImageIcon,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { notify } from "@/lib/notify";
import { ALLOWED_IMAGE_TYPES, validateImageFile, sanitizeFilename, MAX_IMAGE_DIMENSION } from "@/lib/security";
import { useObjectUrls } from "@/hooks/use-object-urls";

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_FORMATS = ["png", "jpeg", "webp", "gif", "bmp"] as const;
type ImageFormat = typeof ALLOWED_FORMATS[number];
const MIN_QUALITY = 1;
const MAX_QUALITY = 100;

const coerceFormat = (value: string): ImageFormat => {
  return ALLOWED_FORMATS.includes(value as ImageFormat) ? (value as ImageFormat) : "png";
};

const clampQuality = (value: number): number => {
  return Math.max(MIN_QUALITY, Math.min(MAX_QUALITY, Math.floor(value)));
};

/**
 * Detect image format via magic bytes (file signature)
 * Prevents MIME spoofing attacks
 */
async function sniffMime(file: File): Promise<string | null> {
  const buffer = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return "image/png";
  }
  
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return "image/jpeg";
  }
  
  // WebP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return "image/webp";
  }
  
  // GIF: GIF87a or GIF89a
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  
  // BMP: BM
  if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
    return "image/bmp";
  }
  
  return null;
}

export const ImageFormatConverter = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalFormat, setOriginalFormat] = useState("");
  const [targetFormat, setTargetFormat] = useState<ImageFormat>("png");
  const [quality, setQuality] = useState(90);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { createImageUrl } = useObjectUrls();

  const formats = [
    { label: "PNG", value: "png", description: "Lossless compression, supports transparency" },
    { label: "JPEG", value: "jpeg", description: "Lossy compression, smaller file size" },
    { label: "WebP", value: "webp", description: "Modern format, good compression" },
    { label: "GIF", value: "gif", description: "Supports animation, limited colors" },
    { label: "BMP", value: "bmp", description: "Uncompressed bitmap format" },
  ];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setConvertedImage(null);

    // File size check
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      notify.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      return;
    }

    // MIME type allowlist check
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notify.error("Invalid file type. Only PNG, JPEG, WebP, GIF, and BMP are allowed.");
      return;
    }

    // Magic bytes verification
    const sniffed = await sniffMime(file);
    if (!sniffed || !ALLOWED_IMAGE_TYPES.includes(sniffed)) {
      notify.error("File signature mismatch. File may be corrupted or spoofed.");
      return;
    }

    const safeName = sanitizeFilename(file.name);
    const format = safeName.split(".").pop()?.toLowerCase() || "unknown";
    setOriginalFormat(format);

    // Object URL approach for memory efficiency
    try {
      const imageUrl = await createImageUrl(file, {
        downscaleLarge: true,
        maxDimension: MAX_IMAGE_DIMENSION,
      });

      if (imageUrl) {
        setSelectedImage(imageUrl);
        notify.success("Image uploaded successfully!");
      } else {
        notify.error("Failed to load image. File may be corrupted.");
      }
    } catch (err) {
      notify.error("Failed to process image file");
      console.error("Image upload error:", err);
    }
  };

  const convertImage = () => {
    if (!selectedImage || !canvasRef.current) return;
    setLoading(true);
    setError(null);

    // GIF/BMP format warnings (canvas limitations)
    if (targetFormat === "gif" || targetFormat === "bmp") {
      notify.warning(
        `Converting to ${targetFormat.toUpperCase()}: Canvas may not preserve all format features. Output quality may vary.`
      );
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Your browser doesn't support canvas.");
      setLoading(false);
      notify.error("Your browser doesn't support canvas.");
      return;
    }

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

        // Canvas safety: wrap drawImage in try/catch
        try {
          ctx.drawImage(img, 0, 0, width, height);
        } catch (err) {
          setError("Failed to draw image on canvas. Image may be corrupted.");
          notify.error("Failed to draw image. Image may be corrupted.");
          console.error("drawImage error:", err);
          setLoading(false);
          return;
        }

        // Canvas safety: wrap toDataURL in try/catch
        try {
          const mimeType = `image/${targetFormat}`;
          const qualityValue = targetFormat === "jpeg" || targetFormat === "webp" 
            ? quality / 100 
            : undefined;
          const dataUrl = canvas.toDataURL(mimeType, qualityValue);
          setConvertedImage(dataUrl);
          notify.success(`Image converted to ${targetFormat.toUpperCase()}!`);
        } catch (err) {
          setError("Conversion failed. Try another format.");
          notify.error("Conversion failed. Try another format.");
          console.error("toDataURL error:", err);
        }
      } catch (err) {
        setError("Unexpected error during conversion.");
        notify.error("Unexpected error during conversion.");
        console.error("Conversion error:", err);
      }

      setLoading(false);
    };

    img.onerror = () => {
      setError("Failed to load image. File may be corrupted.");
      notify.error("Failed to load image. File may be corrupted.");
      setLoading(false);
    };

    img.src = selectedImage;
  };

  const downloadConvertedImage = () => {
    if (!convertedImage) return;
    const link = document.createElement("a");
    link.download = `converted-image.${targetFormat}`;
    link.href = convertedImage;
    link.click();
    notify.success("Image downloaded!");
  };

  const clearAll = () => {
    setSelectedImage(null);
    setConvertedImage(null);
    setOriginalFormat("");
    setError(null);
    notify.success("Cleared all content!");
  };

  const getFileSize = (dataUrl: string) => {
    const base64 = dataUrl.split(",")[1];
    return Math.round((base64.length * 3) / 4);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8 max-w-8xl mx-auto">
      {/* --- Upload + Settings --- */}
      <Card>
        <CardHeader>
          <CardTitle>Image Format Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Upload */}
          <div className="space-y-2">
            <Label htmlFor="upload">Upload an Image</Label>
            <div className="flex gap-2">
              <Input
                id="upload"
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                onChange={handleImageUpload}
                className="flex-1"
              />
              <Button variant="outline" onClick={clearAll}>
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
            </div>
          </div>

          {/* Format Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Original Format</Label>
              <Input
                value={originalFormat ? originalFormat.toUpperCase() : ""}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Convert To</Label>
              <Select value={targetFormat} onValueChange={(value) => setTargetFormat(coerceFormat(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quality Slider (JPEG/WebP) */}
          {(targetFormat === "jpeg" || targetFormat === "webp") && (
            <div className="space-y-2">
              <Label>Quality: {quality}%</Label>
              <input
                type="range"
                min={MIN_QUALITY}
                max={MAX_QUALITY}
                value={quality}
                onChange={(e) => setQuality(clampQuality(parseInt(e.target.value) || 90))}
                className="w-full"
                aria-label={`Image quality slider, current value ${quality} percent`}
              />
              <p className="text-xs text-muted-foreground">
                Higher quality → larger file size
              </p>
            </div>
          )}

          {/* Format Info */}
          <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
            {formats.find((f) => f.value === targetFormat)?.description}
          </div>

          {/* Convert + Download */}
          <div className="flex gap-2">
            <Button
              onClick={convertImage}
              disabled={!selectedImage || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Progress value={70} className="w-16 mr-2" />
                  Converting...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" /> Convert
                </>
              )}
            </Button>

            <Button
              onClick={downloadConvertedImage}
              disabled={!convertedImage}
              variant={convertedImage ? "default" : "secondary"}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </div>

          {error && (
            <div className="flex items-center text-red-600 text-sm mt-2">
              <AlertCircle className="h-4 w-4 mr-1" /> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Preview Panels --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Original Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border rounded-lg bg-muted p-3 flex justify-center"
              aria-live="polite"
              aria-atomic="true"
            >
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Original uploaded image" /* Blob URL from validated image file */
                  className="max-w-full h-auto rounded-md"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No image uploaded yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Converted Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border rounded-lg bg-muted p-3 flex justify-center"
              aria-live="polite"
              aria-atomic="true"
            >
              {convertedImage ? (
                <img
                  src={convertedImage}
                  alt={`Converted image in ${targetFormat} format`} /* Canvas-generated sanitized output */
                  className="max-w-full h-auto rounded-md"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No converted image yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Conversion Stats --- */}
      {convertedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {originalFormat.toUpperCase()}
                </div>
                <p className="text-sm text-muted-foreground">Original</p>
              </div>

              <div>
                <div className="text-2xl font-bold text-green-600">
                  {targetFormat.toUpperCase()}
                </div>
                <p className="text-sm text-muted-foreground">Converted</p>
              </div>

              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatFileSize(getFileSize(convertedImage))}
                </div>
                <p className="text-sm text-muted-foreground">File Size</p>
              </div>

              {(targetFormat === "jpeg" || targetFormat === "webp") && (
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {quality}%
                  </div>
                  <p className="text-sm text-muted-foreground">Quality</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

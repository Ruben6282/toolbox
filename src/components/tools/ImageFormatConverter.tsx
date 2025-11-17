// ImageFormatConverter - Enterprise-grade, leak-free version
// - Blob URLs for output
// - Proper URL cleanup (upload, convert, switch format, reset, unmount)
// - PNG/JPEG/WebP only (safe with canvas)

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
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Download, RotateCcw, ImageIcon, AlertCircle } from "lucide-react";
import { notify } from "@/lib/notify";
import {
  ALLOWED_IMAGE_TYPES,
  validateImageFile,
  sanitizeFilename,
  MAX_IMAGE_DIMENSION,
} from "@/lib/security";
import { useObjectUrls } from "@/hooks/use-object-urls";

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_FORMATS = ["png", "jpeg", "webp"] as const;
type ImageFormat = (typeof ALLOWED_FORMATS)[number];

const MIN_QUALITY = 1;
const MAX_QUALITY = 100;

const coerceFormat = (value: string): ImageFormat =>
  ALLOWED_FORMATS.includes(value as ImageFormat)
    ? (value as ImageFormat)
    : "png";

const clampQuality = (value: number): number =>
  Math.max(MIN_QUALITY, Math.min(MAX_QUALITY, Math.floor(value)));

async function sniffMime(file: File): Promise<string | null> {
  const buffer = await file.slice(0, 16).arrayBuffer();
  const b = new Uint8Array(buffer);

  // PNG
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return "image/png";
  }
  // JPEG
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return "image/jpeg";
  }
  // WebP (RIFF....WEBP)
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return "image/webp";
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
  const { createImageUrl, revoke } = useObjectUrls();

  const formats = [
    {
      label: "PNG",
      value: "png",
      description: "Lossless compression, supports transparency",
    },
    {
      label: "JPEG",
      value: "jpeg",
      description: "Lossy, small file size",
    },
    {
      label: "WebP",
      value: "webp",
      description: "Modern high-compression format",
    },
  ];

  // Cleanup on unmount (belt & suspenders)
  useEffect(() => {
    return () => {
      setSelectedImage((prev) => {
        if (prev) revoke(prev);
        return null;
      });
      setConvertedImage((prev) => {
        if (prev) revoke(prev);
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    // Size guardrail
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      notify.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      return;
    }

    // MIME allowlist
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notify.error("Invalid file type. Only PNG, JPEG, WebP allowed.");
      return;
    }

    // Magic bytes verification
    const sniffed = await sniffMime(file);
    if (!sniffed || !ALLOWED_IMAGE_TYPES.includes(sniffed)) {
      notify.error("File signature mismatch.");
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      notify.error(validationError);
      return;
    }

    const safeName = sanitizeFilename(file.name);
    setOriginalFormat(safeName.split(".").pop()?.toUpperCase() || "");

    const url = await createImageUrl(file, {
      downscaleLarge: true,
      maxDimension: MAX_IMAGE_DIMENSION,
    });

    if (!url) {
      notify.error("Failed to load image.");
      return;
    }

    // Cleanup previous upload URL
    setSelectedImage((prev) => {
      if (prev) revoke(prev);
      return url;
    });

    // Cleanup previous converted URL
    setConvertedImage((prev) => {
      if (prev) revoke(prev);
      return null;
    });

    notify.success("Image uploaded successfully!");
  };

  const convertImage = () => {
    if (!selectedImage || !canvasRef.current) return;
    setLoading(true);
    setError(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Canvas not supported.");
      setLoading(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Dimension guardrail
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const scale = Math.min(
            MAX_IMAGE_DIMENSION / width,
            MAX_IMAGE_DIMENSION / height
          );
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
          notify.warning(`Downscaled to ${width}×${height}px`);
        }

        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const mime = `image/${targetFormat}`;
        const q = targetFormat !== "png" ? quality / 100 : undefined;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError("Conversion failed.");
              setLoading(false);
              return;
            }

            const url = URL.createObjectURL(blob);
            setConvertedImage((prev) => {
              if (prev) revoke(prev);
              return url;
            });

            notify.success(`Converted to ${targetFormat.toUpperCase()}!`);
            setLoading(false);
          },
          mime,
          q
        );
      } catch (err) {
        console.error(err);
        setError("Unexpected conversion error.");
        setLoading(false);
      }
    };

    img.onerror = () => {
      setError("Failed to load image.");
      setLoading(false);
    };

    img.src = selectedImage;
  };

  const downloadConvertedImage = () => {
    if (!convertedImage) return;
    const link = document.createElement("a");
    link.download = `converted.${targetFormat}`;
    link.href = convertedImage;
    link.click();
  };

  const clearAll = () => {
    setSelectedImage((prev) => {
      if (prev) revoke(prev);
      return null;
    });
    setConvertedImage((prev) => {
      if (prev) revoke(prev);
      return null;
    });
    setOriginalFormat("");
    setError(null);
  };

  return (
    <div className="space-y-8 max-w-8xl mx-auto">
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
              />
              <Button variant="outline" onClick={clearAll}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Format Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Original Format</Label>
              <Input value={originalFormat} readOnly className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>Convert To</Label>
              <Select
                value={targetFormat}
                onValueChange={(v) => {
                  setTargetFormat(coerceFormat(v));
                  // Cleanup converted image when target format changes
                  setConvertedImage((prev) => {
                    if (prev) revoke(prev);
                    return null;
                  });
                }}
              >
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

          {/* Quality Slider */}
          {(targetFormat === "jpeg" || targetFormat === "webp") && (
            <div className="space-y-2">
              <Label>Quality: {quality}%</Label>
              <Slider
                value={[quality]}
                onValueChange={(v) =>
                  setQuality(clampQuality(Math.round(v[0] ?? MIN_QUALITY)))
                }
                min={MIN_QUALITY}
                max={MAX_QUALITY}
                step={1}
              />
            </div>
          )}

          {/* Format Info */}
          <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
            {formats.find((f) => f.value === targetFormat)?.description}
          </div>

          {/* Actions */}
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
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Convert
                </>
              )}
            </Button>

            <Button
              onClick={downloadConvertedImage}
              disabled={!convertedImage}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {error && (
            <div className="flex items-center text-red-600 text-sm mt-2">
              <AlertCircle className="h-4 w-4 mr-1" /> {error}
            </div>
          )}
        </CardContent>
      </Card>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

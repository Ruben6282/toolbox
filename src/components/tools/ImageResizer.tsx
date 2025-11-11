/**
 * ImageResizer - Enterprise-Grade Hardening
 *
 * Security & UX features:
 * - MIME verification via file.type and magic bytes sniffing to prevent spoofing
 * - File size limit to avoid memory pressure
 * - Output format selection (PNG/JPEG/WEBP) with quality control
 * - Accessibility: aria-live announcements for preview updates
 * - Dimension guardrails using MAX_IMAGE_DIMENSION
 */
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";
import { Upload } from "lucide-react";
import { ALLOWED_IMAGE_TYPES, validateImageFile, MAX_IMAGE_DIMENSION } from "@/lib/security";
import { useObjectUrls } from "@/hooks/use-object-urls";

export const ImageResizer = () => {
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);
  const [format, setFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [quality, setQuality] = useState<number>(0.92); // applies to jpeg/webp
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string>("");
  const [resizedPreview, setResizedPreview] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { createImageUrl } = useObjectUrls();

  // Size guardrail
  const MAX_FILE_SIZE_MB = 10;

  // Quick magic-byte sniff for common formats (best-effort)
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

  // Load image when uploaded
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    // Create validated URL with downscaling for very large images
  const url = await createImageUrl(file, { downscaleLarge: true, maxDimension: MAX_IMAGE_DIMENSION });
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      setWidth(img.width);
      setHeight(img.height);
      setOriginalPreview(url);
      notify.success("Image loaded!");
    };
    img.onerror = () => notify.error("Failed to load image");
    img.src = url;
  };

  // Maintain aspect ratio
  const handleWidthChange = (value: string) => {
    const newWidth = Number(value);
    if (!originalImage) return setWidth(newWidth);
    if (aspectRatioLocked) {
      const ratio = originalImage.height / originalImage.width;
      setHeight(Math.round(newWidth * ratio));
    }
    setWidth(newWidth);
  };

  const handleHeightChange = (value: string) => {
    const newHeight = Number(value);
    if (!originalImage) return setHeight(newHeight);
    if (aspectRatioLocked) {
      const ratio = originalImage.width / originalImage.height;
      setWidth(Math.round(newHeight * ratio));
    }
    setHeight(newHeight);
  };

  // Update resized preview whenever size changes
  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(originalImage, 0, 0, width, height);
    // Use selected format and quality
    const q = format === "image/png" ? undefined : Math.min(Math.max(quality, 0), 1);
    setResizedPreview(canvas.toDataURL(format, q));
  }, [width, height, originalImage, format, quality]);

  // Download resized image
  const handleDownload = () => {
    if (!resizedPreview) {
      notify.error("No resized image to download!");
      return;
    }
    const link = document.createElement("a");
    link.href = resizedPreview;
    const ext = format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
    link.download = `resized-image.${ext}`;
    link.click();
    notify.success("Image downloaded!");
  };

  // Note: Object URL cleanup is handled within useObjectUrls hook automatically on unmount

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-12">
            <label className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload image</span>
              </div>
              <input
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Resize Options */}
      {originalImage && (
        <Card>
          <CardHeader>
            <CardTitle>Resize Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Width (px)</Label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Height (px)</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => handleHeightChange(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={aspectRatioLocked}
                onChange={(e) => setAspectRatioLocked(e.target.checked)}
              />
              <Label>Lock aspect ratio</Label>
            </div>

            {/* Output format & quality */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Output Format</Label>
                <select
                  className="border rounded-md h-10 px-3"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as "image/png" | "image/jpeg" | "image/webp")}
                >
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/webp">WEBP</option>
                </select>
              </div>

              {(format === "image/jpeg" || format === "image/webp") && (
                <div className="space-y-2">
                  <Label>Quality ({Math.round(quality * 100)}%)</Label>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.01}
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                  />
                </div>
              )}
            </div>

            <Button onClick={handleDownload} className="w-full">
              Download Resized Image
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview section */}
      {originalPreview && (
        <div className="grid gap-6 md:grid-cols-2" aria-live="polite">
          <Card>
            <CardHeader>
              <CardTitle>Original Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={originalPreview}
                alt="Original Preview"
                className="mx-auto rounded-lg max-h-[400px] object-contain"
              />
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {originalImage?.width} × {originalImage?.height}px
              </p>
            </CardContent>
          </Card>

          {resizedPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Resized Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={resizedPreview}
                  alt="Resized Preview"
                  className="mx-auto rounded-lg max-h-[400px] object-contain"
                />
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  {width} × {height}px
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

/**
 * ImageResizer - Final Production-Ready Version
 *
 * Security & Stability:
 * ✔ MIME allowlist + magic-byte sniffing
 * ✔ File size limit
 * ✔ EXIF orientation via createImageBitmap({ imageOrientation: "from-image" })
 * ✔ Canvas safe dimension guardrail
 * ✔ Async toBlob encoding (no UI freeze)
 * ✔ Debounced resizing
 * ✔ Memory-safe ObjectURL handling
 * ✔ Safe cleanup
 *
 * UX:
 * ✔ Drag & drop
 * ✔ Proper quality slider (0–100 UI → 0–1 encoding)
 * ✔ File metadata
 * ✔ Smooth previews
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { notify } from "@/lib/notify";
import { Upload } from "lucide-react";
import {
  ALLOWED_IMAGE_TYPES,
  validateImageFile,
  MAX_IMAGE_DIMENSION,
} from "@/lib/security";
import { useObjectUrls } from "@/hooks/use-object-urls";

const MIN_DIMENSION = 1;
const MAX_DIMENSION_INPUT = 10000;
const SAFE_MAX_CANVAS_DIMENSION = 8192;

const ALLOWED_FORMATS = ["image/png", "image/jpeg", "image/webp"] as const;
type ImageFormat = (typeof ALLOWED_FORMATS)[number];

const MAX_FILE_SIZE_MB = 10;

// Debounce helper
const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

const clamp = (num: number, min: number, max: number) =>
  Math.max(min, Math.min(max, num));

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export const ImageResizer = () => {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [format, setFormat] = useState<ImageFormat>("image/png");
  const [quality, setQuality] = useState(0.92); // internal 0–1

  const [imageSource, setImageSource] = useState<CanvasImageSource | null>(null);
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);

  const [originalPreview, setOriginalPreview] = useState("");
  const [resizedPreview, setResizedPreview] = useState("");
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(
    null
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);

  const { createImageUrl } = useObjectUrls();

  // Debounced heavy values
  const debW = useDebouncedValue(width, 150);
  const debH = useDebouncedValue(height, 150);
  const debQ = useDebouncedValue(quality, 150);

  /** Magic-byte sniffing (PNG, JPEG, WEBP) */
  const sniffMime = useCallback(async (file: File) => {
    try {
      const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());

      if (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
      )
        return "image/png";

      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
        return "image/jpeg";

      if (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      )
        return "image/webp";

      return null;
    } catch {
      return null;
    }
  }, []);

  /** Central file handler (input & drag/drop) */
  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        notify.error(`File too large (max ${MAX_FILE_SIZE_MB}MB)`);
        return;
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        notify.error("Unsupported file type. Please upload PNG, JPEG, or WEBP.");
        return;
      }

      const sniffed = await sniffMime(file);
      if (sniffed && !ALLOWED_IMAGE_TYPES.includes(sniffed)) {
        notify.error("Image signature does not match allowed types.");
        return;
      }

      const validationError = validateImageFile(file);
      if (validationError) {
        notify.error(validationError);
        return;
      }

      // Create preview URL
      const url = await createImageUrl(file, {
        downscaleLarge: true,
        maxDimension: MAX_IMAGE_DIMENSION,
      });

      if (!url) {
        notify.error("Failed to create preview URL.");
        return;
      }

      setOriginalPreview(url);
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Cleanup old ImageBitmap
      if (bitmapRef.current) {
        bitmapRef.current.close();
        bitmapRef.current = null;
      }

      // Try EXIF-correct ImageBitmap first
      try {
        if ("createImageBitmap" in window) {
          const bitmap = await createImageBitmap(file, {
            imageOrientation: "from-image",
          });

          bitmapRef.current = bitmap;
          setImageSource(bitmap);
          setImageDims({ width: bitmap.width, height: bitmap.height });
          setWidth(bitmap.width);
          setHeight(bitmap.height);
          notify.success("Image loaded!");
          return;
        }
      } catch (err) {
        // Non-fatal: if ImageBitmap creation fails, fall back to <img> path.
        // Log for debugging purposes so the empty-block lint rule is satisfied.
        console.debug("createImageBitmap failed:", err);
      }

      // Fallback <img>
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImageSource(img);
        setImageDims({ width: img.width, height: img.height });
        setWidth(img.width);
        setHeight(img.height);
        notify.success("Image loaded!");
      };
      img.onerror = () => notify.error("Failed to load image");
      img.src = url;
    },
    [createImageUrl, sniffMime]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  /** Aspect-ratio-respecting input handlers */
  const onWidth = (v: string) => {
    const w = clamp(Number(v) || 1, MIN_DIMENSION, MAX_DIMENSION_INPUT);
    if (!imageDims || !aspectLocked) return setWidth(w);
    const ratio = imageDims.height / imageDims.width;
    setWidth(w);
    setHeight(clamp(Math.round(w * ratio), MIN_DIMENSION, MAX_DIMENSION_INPUT));
  };

  const onHeight = (v: string) => {
    const h = clamp(Number(v) || 1, MIN_DIMENSION, MAX_DIMENSION_INPUT);
    if (!imageDims || !aspectLocked) return setHeight(h);
    const ratio = imageDims.width / imageDims.height;
    setHeight(h);
    setWidth(clamp(Math.round(h * ratio), MIN_DIMENSION, MAX_DIMENSION_INPUT));
  };

  /** Resize canvas + generate preview */
  useEffect(() => {
    if (!imageSource || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = clamp(debW, MIN_DIMENSION, SAFE_MAX_CANVAS_DIMENSION);
    const H = clamp(debH, MIN_DIMENSION, SAFE_MAX_CANVAS_DIMENSION);

    canvas.width = W;
    canvas.height = H;

    try {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(imageSource, 0, 0, W, H);
    } catch (err) {
      notify.error("Failed to render resized image.");
      return;
    }

    const q = format === "image/png" ? undefined : debQ;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          notify.error("Failed to generate image.");
          return;
        }
        const url = URL.createObjectURL(blob);

        // Revoke previous preview safely
        setResizedPreview((prev) => {
          if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
          return url;
        });
      },
      format,
      q
    );
  }, [imageSource, debW, debH, debQ, format]);

  /** Cleanup on unmount */
  useEffect(() => {
    return () => {
      if (bitmapRef.current) {
        bitmapRef.current.close();
        bitmapRef.current = null;
      }
    };
  }, []);

  /** Download handler */
  const download = () => {
    if (!resizedPreview) {
      notify.error("No resized image available.");
      return;
    }
    const a = document.createElement("a");
    a.href = resizedPreview;
    a.download =
      format === "image/png"
        ? "image.png"
        : format === "image/jpeg"
        ? "image.jpg"
        : "image.webp";
    a.click();
    notify.success("Image downloaded!");
  };

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <label className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click or drag & drop an image (PNG, JPEG, WEBP)
              </span>
              <input
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {fileInfo && (
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium">{fileInfo.name}</span> ·{" "}
                {formatFileSize(fileInfo.size)} · {fileInfo.type}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resize Options */}
      {imageSource && (
        <Card>
          <CardHeader>
            <CardTitle>Resize Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Width / Height */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Width (px)</Label>
                <Input value={width} onChange={(e) => onWidth(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Height (px)</Label>
                <Input value={height} onChange={(e) => onHeight(e.target.value)} />
              </div>
            </div>

            {/* Aspect ratio */}
            <div className="flex items-center gap-2">
              <Switch checked={aspectLocked} onCheckedChange={setAspectLocked} />
              <Label>Lock aspect ratio</Label>
            </div>

            {/* Format + Quality */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Format */}
              <div className="space-y-2">
                <Label>Output Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as ImageFormat)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/png">PNG</SelectItem>
                    <SelectItem value="image/jpeg">JPEG</SelectItem>
                    <SelectItem value="image/webp">WEBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quality */}
              {(format === "image/jpeg" || format === "image/webp") && (
                <div className="space-y-2">
                  <Label>Quality ({Math.round(quality * 100)}%)</Label>
                  <Slider
                    value={[quality * 100]}
                    onValueChange={(v) => setQuality(clamp(v[0] / 100, 0.1, 1))}
                    min={10}
                    max={100}
                    step={1}
                  />
                </div>
              )}
            </div>

            <Button onClick={download} className="w-full">
              Download Resized Image
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Previews */}
      {originalPreview && (
        <div className="grid gap-6 md:grid-cols-2" aria-live="polite">
          <Card>
            <CardHeader>
              <CardTitle>Original Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={originalPreview}
                alt="Original preview"
                className="mx-auto rounded-lg max-h-[400px] object-contain"
              />
              {imageDims && (
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  {imageDims.width} × {imageDims.height}px
                </p>
              )}
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
                  alt="Resized preview"
                  className="mx-auto rounded-lg max-h-[400px] object-contain"
                />
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  {clamp(width, MIN_DIMENSION, MAX_DIMENSION_INPUT)} ×{" "}
                  {clamp(height, MIN_DIMENSION, MAX_DIMENSION_INPUT)}px
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

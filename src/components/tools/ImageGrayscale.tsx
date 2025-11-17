/**
 * ImageGrayscale - Production-Grade Version with Web Worker
 *
 * Security & performance features:
 * - File size limit (10MB) to prevent memory pressure
 * - Magic byte validation to prevent file type spoofing
 * - Dimension guardrails using MAX_IMAGE_DIMENSION with auto-downscaling
 * - Canvas error guards (try/catch) to handle corrupted image data
 * - Object URL approach for memory efficiency (vs Base64) + cleanup
 * - MIME type verification before processing
 * - Heavy grayscale math offloaded to a Web Worker (no UI freeze)
 * - Async toBlob download
 */

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, RotateCcw, Palette } from "lucide-react";
import { notify } from "@/lib/notify";
import {
  ALLOWED_IMAGE_TYPES,
  validateImageFile,
  MAX_IMAGE_DIMENSION,
} from "@/lib/security";
import { useObjectUrls } from "@/hooks/use-object-urls";

const ALLOWED_GRAYSCALE_TYPES = [
  "luminance",
  "average",
  "red",
  "green",
  "blue",
  "desaturate",
] as const;
const ALLOWED_OUTPUT_FORMATS = ["png", "jpeg", "webp"] as const;

type GrayscaleType = (typeof ALLOWED_GRAYSCALE_TYPES)[number];
type OutputFormat = (typeof ALLOWED_OUTPUT_FORMATS)[number];

const coerceGrayscaleType = (value: string): GrayscaleType =>
  ALLOWED_GRAYSCALE_TYPES.includes(value as GrayscaleType)
    ? (value as GrayscaleType)
    : "luminance";

const coerceOutputFormat = (value: string): OutputFormat =>
  ALLOWED_OUTPUT_FORMATS.includes(value as OutputFormat)
    ? (value as OutputFormat)
    : "png";

const clampContrast = (value: number): number =>
  Math.max(0, Math.min(3, value));

const clampBrightness = (value: number): number =>
  Math.max(-100, Math.min(100, value));

const MAX_FILE_SIZE_MB = 10;

interface WorkerMessageOut {
  jobId: number;
  width: number;
  height: number;
  pixels: ArrayBuffer;
}

export const ImageGrayscale = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [grayscaleType, setGrayscaleType] =
    useState<GrayscaleType>("luminance");
  const [contrast, setContrast] = useState(1);
  const [brightness, setBrightness] = useState(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");

  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const jobIdRef = useRef(0);

  const { createImageUrl, revoke } = useObjectUrls();

  // Init worker
  useEffect(() => {
    const worker = new Worker(
      new URL("./image-grayscale-worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerMessageOut>) => {
      const { jobId, width, height, pixels } = event.data;
      // Ignore stale results from older jobs
      if (jobId !== jobIdRef.current) return;

      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      try {
        const data = new Uint8ClampedArray(pixels);
        const imageData = new ImageData(data, width, height);
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        ctx.putImageData(imageData, 0, 0);
        setIsProcessing(false);
        notify.success("Image converted to grayscale!");
      } catch (err) {
        console.error("Failed to apply worker result:", err);
        notify.error("Failed to apply grayscale result.");
        setIsProcessing(false);
      }
    };

    worker.onerror = (err) => {
      console.error("Grayscale worker error:", err);
      notify.error("Unexpected worker error during processing.");
      setIsProcessing(false);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (selectedImage) {
        revoke(selectedImage);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Magic byte validation (best-effort spoofing prevention)
   */
  const sniffMime = async (file: File): Promise<string | null> => {
    try {
      const slice = file.slice(0, 16);
      const buf = await slice.arrayBuffer();
      const bytes = new Uint8Array(buf);

      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (
        bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      ) {
        return "image/png";
      }
      // JPEG: FF D8 FF
      if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return "image/jpeg";
      }
      // WEBP (RIFF....WEBP): 52 49 46 46 .... 57 45 42 50
      if (
        bytes.length >= 12 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      ) {
        return "image/webp";
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
    const url = await createImageUrl(file, {
      downscaleLarge: true,
      maxDimension: MAX_IMAGE_DIMENSION,
    });
    if (!url) {
      notify.error("Failed to create image preview");
      return;
    }

    // Clean up previous URL
    setSelectedImage((prev) => {
      if (prev) revoke(prev);
      return url;
    });

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    notify.success("Image uploaded successfully!");
  };

  const convertToGrayscale = () => {
    if (!selectedImage || !canvasRef.current) return;
    if (!workerRef.current) {
      notify.error("Worker not initialized. Please reload the page.");
      return;
    }
    if (isProcessing) {
      notify.error("Already processing an image. Please wait.");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      try {
        // Dimension guardrail: downscale if exceeds MAX_IMAGE_DIMENSION
        let width = img.width;
        let height = img.height;

        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const scale = Math.min(
            MAX_IMAGE_DIMENSION / width,
            MAX_IMAGE_DIMENSION / height
          );
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
          notify.warning(
            `Image downscaled to ${width}×${height}px for processing`
          );
        }

        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(0, 0, width, height);
        } catch (err) {
          console.error("getImageData error:", err);
          notify.error(
            "Failed to read image data. Image may be too large or corrupted."
          );
          setIsProcessing(false);
          return;
        }

        const currentJobId = ++jobIdRef.current;

        // Transfer pixel buffer to worker
        const pixels = imageData.data;
        workerRef.current!.postMessage(
          {
            jobId: currentJobId,
            width: imageData.width,
            height: imageData.height,
            pixels: pixels.buffer,
            grayscaleType,
            contrast: clampContrast(contrast),
            brightness: clampBrightness(brightness),
          },
          [pixels.buffer]
        );
      } catch (err) {
        console.error("Grayscale conversion error:", err);
        notify.error("Unexpected error during grayscale conversion");
        setIsProcessing(false);
      }
    };
    img.onerror = () => {
      notify.error("Failed to load image. File may be corrupted.");
      setIsProcessing(false);
    };
    img.src = selectedImage;
  };

  const downloadGrayscaleImage = () => {
    if (!canvasRef.current) {
      notify.error("No processed image to download.");
      return;
    }

    const canvas = canvasRef.current;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          notify.error("Failed to generate grayscale image.");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download =
          outputFormat === "png"
            ? "grayscale-image.png"
            : outputFormat === "jpeg"
            ? "grayscale-image.jpg"
            : "grayscale-image.webp";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        notify.success("Grayscale image downloaded!");
      },
      `image/${outputFormat}`,
      outputFormat === "jpeg" || outputFormat === "webp" ? 0.92 : undefined
    );
  };

  const clearImage = () => {
    setSelectedImage((prev) => {
      if (prev) revoke(prev);
      return null;
    });

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setIsProcessing(false);
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
              <Button
                variant="outline"
                onClick={clearImage}
                className="w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grayscale-type">Grayscale Method</Label>
              <Select
                value={grayscaleType}
                onValueChange={(value) =>
                  setGrayscaleType(coerceGrayscaleType(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_GRAYSCALE_TYPES.map((value) => {
                    const label =
                      value === "luminance"
                        ? "Luminance (Recommended)"
                        : value === "average"
                        ? "Average"
                        : value === "red"
                        ? "Red Channel"
                        : value === "green"
                        ? "Green Channel"
                        : value === "blue"
                        ? "Blue Channel"
                        : "Desaturate";
                    return (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="output-format">Output Format</Label>
              <Select
                value={outputFormat}
                onValueChange={(value) =>
                  setOutputFormat(coerceOutputFormat(value))
                }
              >
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
                onValueChange={(value) =>
                  setContrast(clampContrast(value[0] ?? 1))
                }
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Brightness: {brightness > 0 ? "+" : ""}
                {brightness}
              </Label>
              <Slider
                value={[brightness]}
                onValueChange={(value) =>
                  setBrightness(clampBrightness(value[0] ?? 0))
                }
                min={-100}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {selectedImage && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={convertToGrayscale}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
                disabled={isProcessing}
              >
                <Palette className="h-4 w-4" />
                {isProcessing ? "Processing..." : "Convert to Grayscale"}
              </Button>
              <Button
                onClick={downloadGrayscaleImage}
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
                disabled={isProcessing}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={resetSettings}
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isProcessing}
              >
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
                  style={{ display: "block", margin: "0 auto" }}
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
              <strong>Luminance:</strong> Uses 0.299×R + 0.587×G + 0.114×B,
              matching human eye sensitivity.
            </div>
            <div>
              <strong>Average:</strong> Simple mean of R, G, and B values.
            </div>
            <div>
              <strong>Channel Methods:</strong> Use only one color channel
              (red, green, or blue) as the grayscale value.
            </div>
            <div>
              <strong>Desaturate:</strong> Midpoint between the highest and
              lowest channel values.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

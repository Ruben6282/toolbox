import { useState, useRef, useEffect, useCallback } from "react";
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
import { Download, RotateCcw } from "lucide-react";
import { notify } from "@/lib/notify";
import {
  ALLOWED_IMAGE_TYPES,
  validateImageFile,
  MAX_IMAGE_DIMENSION,
} from "@/lib/security";

type AspectRatioValue = "free" | "1:1" | "4:3" | "16:9" | "3:2" | "2:1";
type OutputFormat = "png" | "jpeg" | "webp";

interface CropRect {
  x: number; // in image pixels
  y: number;
  width: number;
  height: number;
}

interface ImageDims {
  width: number;
  height: number;
}

const MAX_FILE_SIZE_MB = 10;
const MIN_CROP_SIZE = 20;

const aspectRatios: { label: string; value: AspectRatioValue }[] = [
  { label: "Free", value: "free" },
  { label: "1:1 (Square)", value: "1:1" },
  { label: "4:3", value: "4:3" },
  { label: "16:9", value: "16:9" },
  { label: "3:2", value: "3:2" },
  { label: "2:1", value: "2:1" },
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const parseRatio = (r: AspectRatioValue): number | null => {
  if (r === "free") return null;
  const [w, h] = r.split(":").map(Number);
  if (!w || !h) return null;
  return w / h;
};

/** Magic-byte sniffing for PNG, JPEG, WEBP */
const sniffMime = async (file: File): Promise<string | null> => {
  try {
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());

    // PNG
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return "image/png";
    }

    // JPEG
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }

    // WEBP
    if (
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

export const ImageCropper = () => {
  const [imageSource, setImageSource] = useState<CanvasImageSource | null>(null);
  const [imageDims, setImageDims] = useState<ImageDims | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(
    null
  );

  const [aspectRatio, setAspectRatio] = useState<AspectRatioValue>("free");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");

  const [crop, setCrop] = useState<CropRect | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | null
  >(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const [previewScale, setPreviewScale] = useState(1); // imagePixels → previewPixels

  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);

  /** Compute initial crop (centered, taking ~60% of min dimension) */
  const createInitialCrop = useCallback(
    (dims: ImageDims, ratio: AspectRatioValue): CropRect => {
      const { width, height } = dims;
      const r = parseRatio(ratio);
      let cropWidth = width * 0.6;
      let cropHeight = height * 0.6;

      if (r) {
        // Fit crop to aspect ratio
        if (cropWidth / cropHeight > r) {
          cropWidth = cropHeight * r;
        } else {
          cropHeight = cropWidth / r;
        }
      }

      cropWidth = clamp(cropWidth, MIN_CROP_SIZE, width);
      cropHeight = clamp(cropHeight, MIN_CROP_SIZE, height);

      const x = (width - cropWidth) / 2;
      const y = (height - cropHeight) / 2;

      return { x, y, width: cropWidth, height: cropHeight };
    },
    []
  );

  /** Clamp crop rect inside the image */
  const clampCrop = useCallback(
    (rect: CropRect, dims: ImageDims): CropRect => {
      let { x, y, width, height } = rect;

      width = Math.max(MIN_CROP_SIZE, Math.min(width, dims.width));
      height = Math.max(MIN_CROP_SIZE, Math.min(height, dims.height));

      x = clamp(x, 0, dims.width - width);
      y = clamp(y, 0, dims.height - height);

      return { x, y, width, height };
    },
    []
  );

  /** Apply aspect ratio to a crop rect, anchored at its center */
  const applyAspectToCrop = useCallback(
    (rect: CropRect, dims: ImageDims, ratio: AspectRatioValue): CropRect => {
      const r = parseRatio(ratio);
      if (!r) return clampCrop(rect, dims);

      let { width, height } = rect;
      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;

      if (width / height > r) {
        width = height * r;
      } else {
        height = width / r;
      }

      width = clamp(width, MIN_CROP_SIZE, dims.width);
      height = clamp(height, MIN_CROP_SIZE, dims.height);

      const x = centerX - width / 2;
      const y = centerY - height / 2;

      return clampCrop({ x, y, width, height }, dims);
    },
    [clampCrop]
  );

  /** Handle file upload securely + EXIF-aware load */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      notify.error(`File too large (max ${MAX_FILE_SIZE_MB}MB)`);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notify.error("Unsupported file type. Upload PNG, JPEG, or WEBP only.");
      return;
    }

    const sniffed = await sniffMime(file);
    if (sniffed && !ALLOWED_IMAGE_TYPES.includes(sniffed)) {
      notify.error("File signature does not match an allowed image type.");
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      notify.error(validationError);
      return;
    }

    try {
      let source: CanvasImageSource | null = null;
      let dims: ImageDims | null = null;

      if ("createImageBitmap" in window) {
        // EXIF-aware decode
        const bitmapOptions = { imageOrientation: "from-image" } as unknown as ImageBitmapOptions;
        const bitmap = await createImageBitmap(file, bitmapOptions);

        const { width, height } = bitmap;
        const maxDim = Math.max(width, height);

        if (maxDim > MAX_IMAGE_DIMENSION) {
          const scale = MAX_IMAGE_DIMENSION / maxDim;
          const newW = Math.round(width * scale);
          const newH = Math.round(height * scale);

          const tmpCanvas = document.createElement("canvas");
          tmpCanvas.width = newW;
          tmpCanvas.height = newH;
          const ctx = tmpCanvas.getContext("2d");
          if (!ctx) {
            bitmap.close();
            throw new Error("Failed to get canvas context");
          }
          ctx.drawImage(bitmap, 0, 0, newW, newH);
          bitmap.close();

          source = tmpCanvas;
          dims = { width: newW, height: newH };
        } else {
          source = bitmap;
          dims = { width, height };
        }
      } else {
        // Fallback: HTMLImageElement (EXIF may not be perfectly handled on older browsers)
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = url;
        });
        URL.revokeObjectURL(url);

        const { naturalWidth, naturalHeight } = img;
        const maxDim = Math.max(naturalWidth, naturalHeight);
        if (maxDim > MAX_IMAGE_DIMENSION) {
          const scale = MAX_IMAGE_DIMENSION / maxDim;
          const newW = Math.round(naturalWidth * scale);
          const newH = Math.round(naturalHeight * scale);

          const tmpCanvas = document.createElement("canvas");
          tmpCanvas.width = newW;
          tmpCanvas.height = newH;
          const ctx = tmpCanvas.getContext("2d");
          if (!ctx) throw new Error("Failed to get canvas context");
          ctx.drawImage(img, 0, 0, newW, newH);

          source = tmpCanvas;
          dims = { width: newW, height: newH };
        } else {
          source = img;
          dims = { width: naturalWidth, height: naturalHeight };
        }
      }

      if (!source || !dims) {
        notify.error("Failed to load image.");
        return;
      }

      setImageSource(source);
      setImageDims(dims);
      setCrop(createInitialCrop(dims, aspectRatio));
      setFileInfo({ name: file.name, size: file.size, type: file.type });
      notify.success("Image loaded!");
    } catch (err) {
      console.error(err);
      notify.error("Failed to process image.");
    }
  };

  /** Render preview + mask canvas whenever image/crop changes (throttled with rAF) */
  useEffect(() => {
    if (!imageSource || !imageDims || !previewCanvasRef.current || !containerRef.current) return;

    const frameId = requestAnimationFrame(() => {
      const canvas = previewCanvasRef.current!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const containerRect = containerRef.current!.getBoundingClientRect();
      const maxPreviewWidth = Math.max(
        1,
        Math.min(containerRect.width || imageDims.width, imageDims.width)
      );
      const scale = maxPreviewWidth / imageDims.width;

      const previewWidth = imageDims.width * scale;
      const previewHeight = imageDims.height * scale;

      setPreviewScale(scale);

      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.round(previewWidth * dpr));
      canvas.height = Math.max(1, Math.round(previewHeight * dpr));
      canvas.style.width = `${Math.round(previewWidth)}px`;
      canvas.style.height = `${Math.round(previewHeight)}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, previewWidth, previewHeight);
      ctx.drawImage(imageSource, 0, 0, previewWidth, previewHeight);

      // Draw dimmed mask around crop area
      if (maskCanvasRef.current && crop) {
        const maskCanvas = maskCanvasRef.current;
        const mCtx = maskCanvas.getContext("2d");
        if (mCtx) {
          maskCanvas.width = canvas.width;
          maskCanvas.height = canvas.height;
          maskCanvas.style.width = canvas.style.width;
          maskCanvas.style.height = canvas.style.height;

          mCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          mCtx.clearRect(0, 0, previewWidth, previewHeight);

          // Darken everything
          mCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
          mCtx.fillRect(0, 0, previewWidth, previewHeight);

          // Clear the crop area to "punch a hole"
          const cropX = crop.x * scale;
          const cropY = crop.y * scale;
          const cropW = crop.width * scale;
          const cropH = crop.height * scale;
          mCtx.clearRect(cropX, cropY, cropW, cropH);
        }
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [imageSource, imageDims, crop]);

  /** Render cropped image into output canvas */
  const renderCropped = useCallback(() => {
    if (!imageSource || !imageDims || !crop || !outputCanvasRef.current) return;

    const canvas = outputCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y, width, height } = crop;

    if (
      width <= 0 ||
      height <= 0 ||
      x < 0 ||
      y < 0 ||
      x + width > imageDims.width + 1 ||
      y + height > imageDims.height + 1
    ) {
      return;
    }

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(
      imageSource,
      x,
      y,
      width,
      height,
      0,
      0,
      width,
      height
    );
  }, [imageSource, imageDims, crop]);

  useEffect(() => {
    renderCropped();
  }, [renderCropped]);

  /** Clear image & state */
  const clearImage = () => {
    setImageSource(null);
    setImageDims(null);
    setCrop(null);
    setFileInfo(null);

    if (outputCanvasRef.current) {
      const ctx = outputCanvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
    }

    if (previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
    }

    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    }

    notify.success("Image cleared!");
  };

  /** Reset crop to centered default */
  const resetCrop = () => {
    if (!imageDims) return;
    setCrop(createInitialCrop(imageDims, aspectRatio));
    notify.success("Crop reset!");
  };

  /** Download cropped image via async toBlob */
  const downloadCroppedImage = () => {
    if (!outputCanvasRef.current) {
      notify.error("No cropped image available.");
      return;
    }

    const canvas = outputCanvasRef.current;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          notify.error("Failed to generate cropped image.");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download =
          outputFormat === "png"
            ? "cropped-image.png"
            : outputFormat === "jpeg"
            ? "cropped-image.jpg"
            : "cropped-image.webp";
        link.click();
        URL.revokeObjectURL(url);
        notify.success("Cropped image downloaded!");
      },
      `image/${outputFormat}`,
      outputFormat === "jpeg" || outputFormat === "webp" ? 0.92 : undefined
    );
  };

  /** Pointer helpers */
  const getPointerPosition = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Clamp to container
    return {
      x: clamp(x, 0, rect.width),
      y: clamp(y, 0, rect.height),
    };
  };

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    mode: "move" | "resize",
    handle?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  ) => {
    if (!imageDims || !crop) return;
    e.preventDefault();

    const pos = getPointerPosition(e);

    if (mode === "move") {
      setIsDragging(true);
      setDragStart(pos);
    } else {
      setIsResizing(true);
      setResizeHandle(handle ?? null);
      setDragStart(pos);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageDims || !crop || (!isDragging && !isResizing) || !dragStart) return;

    e.preventDefault();
    const pos = getPointerPosition(e);
    const dxPreview = pos.x - dragStart.x;
    const dyPreview = pos.y - dragStart.y;

    // Convert preview delta to image-space delta
    const dx = dxPreview / previewScale;
    const dy = dyPreview / previewScale;

    let newCrop = { ...crop };

    if (isDragging) {
      newCrop.x = crop.x + dx;
      newCrop.y = crop.y + dy;
      newCrop = clampCrop(newCrop, imageDims);
    }

    if (isResizing && resizeHandle) {
      const { x, y, width, height } = newCrop;
      const r = parseRatio(aspectRatio);

      const isLeft = resizeHandle.includes("left");
      const isRight = resizeHandle.includes("right");
      const isTop = resizeHandle.includes("top");
      const isBottom = resizeHandle.includes("bottom");

      let newX = x;
      let newY = y;
      let newWidth = width;
      let newHeight = height;

      if (isLeft) {
        newX += dx;
        newWidth -= dx;
      }
      if (isRight) {
        newWidth += dx;
      }
      if (isTop) {
        newY += dy;
        newHeight -= dy;
      }
      if (isBottom) {
        newHeight += dy;
      }

      newWidth = Math.max(MIN_CROP_SIZE, newWidth);
      newHeight = Math.max(MIN_CROP_SIZE, newHeight);

      if (r) {
        // apply aspect ratio with the corner as anchor
        if (newWidth / newHeight > r) {
          newWidth = newHeight * r;
        } else {
          newHeight = newWidth / r;
        }
      }

      newCrop = clampCrop(
        {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        },
        imageDims
      );
    }

    setCrop(newCrop);
    setDragStart(pos);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setDragStart(null);

    if (imageDims && crop) {
      setCrop(applyAspectToCrop(crop, imageDims, aspectRatio));
    }
  };

  /** Update crop when aspect ratio changes */
  useEffect(() => {
    if (!imageDims) return;
    setCrop((prev) => (prev ? applyAspectToCrop(prev, imageDims, aspectRatio) : prev));
  }, [aspectRatio, imageDims, applyAspectToCrop]);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Cropper</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload */}
          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-upload"
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                onChange={handleImageUpload}
                className="flex-1"
              />
              <Button variant="outline" onClick={clearImage}>
                <RotateCcw className="h-4 w-4 mr-2" /> Clear
              </Button>
            </div>
            {fileInfo && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">{fileInfo.name}</span> ·{" "}
                {formatFileSize(fileInfo.size)} · {fileInfo.type}
              </p>
            )}
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select
                value={aspectRatio}
                onValueChange={(v) => setAspectRatio(v as AspectRatioValue)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map((ratio) => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Output Format</Label>
              <Select
                value={outputFormat}
                onValueChange={(v) => setOutputFormat(v as OutputFormat)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="webp">WEBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Crop Interface */}
          {imageSource && imageDims && crop && (
            <div className="space-y-4" aria-live="polite">
              <div
                ref={containerRef}
                className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden touch-none select-none"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {/* Preview canvas */}
                <canvas
                  ref={previewCanvasRef}
                  className="block"
                  style={{ touchAction: "none" }}
                />

                {/* Dimmed mask canvas */}
                <canvas
                  ref={maskCanvasRef}
                  className="absolute inset-0 pointer-events-none"
                />

                {/* Crop overlay */}
                <div
                  className="absolute border-2 border-blue-500 bg-transparent"
                  style={{
                    left: crop.x * previewScale,
                    top: crop.y * previewScale,
                    width: crop.width * previewScale,
                    height: crop.height * previewScale,
                    cursor: isDragging ? "grabbing" : "grab",
                  }}
                  onPointerDown={(e) => handlePointerDown(e, "move")}
                />

                {/* Resize handles */}
                {["top-left", "top-right", "bottom-left", "bottom-right"].map((handle) => {
                  const isRight = handle.includes("right");
                  const isBottom = handle.includes("bottom");
                  return (
                    <div
                      key={handle}
                      className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full"
                      style={{
                        left:
                          (isRight ? crop.x + crop.width : crop.x) *
                            previewScale -
                          6,
                        top:
                          (isBottom ? crop.y + crop.height : crop.y) *
                            previewScale -
                          6,
                        cursor: "nwse-resize",
                      }}
                      onPointerDown={(e) =>
                        handlePointerDown(
                          e,
                          "resize",
                          handle as "top-left" | "top-right" | "bottom-left" | "bottom-right"
                        )
                      }
                    />
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={downloadCroppedImage}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" /> Download Cropped
                </Button>
                <Button
                  onClick={resetCrop}
                  variant="ghost"
                  className="text-xs"
                >
                  Reset crop
                </Button>
                {crop && (
                  <span className="text-xs text-muted-foreground">
                    Crop size: {Math.round(crop.width)} × {Math.round(crop.height)} px
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cropped Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Cropped Image Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-muted">
            <canvas
              ref={outputCanvasRef}
              className="max-w-full h-auto border rounded bg-background"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

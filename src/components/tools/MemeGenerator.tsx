import { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Image as ImageIcon,
  Type,
} from "lucide-react";
import { notify } from "@/lib/notify";
import {
  ALLOWED_IMAGE_TYPES,
  validateImageFile,
  stripHtml,
  truncateText,
  MAX_IMAGE_DIMENSION,
  sniffMime,
} from "@/lib/security";
import { useObjectUrls } from "@/hooks/use-object-urls";

interface TextBox {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  stroke: string;
  strokeWidth: number;
  rotation: number;
  fontFamily: string;
}

const FONT_FAMILIES = [
  "Impact",
  "Arial",
  "Comic Sans MS",
  "Verdana",
  "Courier New",
  "Georgia",
  "Times New Roman",
];

const DEFAULT_TEXT_STYLE = {
  fontSize: 48,
  color: "#ffffff",
  stroke: "#000000",
  strokeWidth: 3,
  rotation: 0,
  fontFamily: "Impact",
};

export const MemeGenerator = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const { createImageUrl, revoke } = useObjectUrls();
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  /** Announce messages for screen readers */
  const announce = (message: string) => {
    if (liveRegionRef.current) liveRegionRef.current.textContent = message;
  };

  /** Draw text with wrapping */
  const drawText = (ctx: CanvasRenderingContext2D, box: TextBox, maxWidth: number) => {
    const words = box.text.split(" ");
    let line = "";
    const lines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    const lineHeight = box.fontSize * 1.2;
    const offsetY = -(lines.length - 1) / 2 * lineHeight;

    lines.forEach((ln, i) => {
      const y = offsetY + i * lineHeight;
      ctx.strokeText(ln.toUpperCase(), 0, y);
      ctx.fillText(ln.toUpperCase(), 0, y);
    });
  };

  /** Draw Meme on Canvas */
  const drawMeme = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const containerWidth = containerRef.current?.clientWidth || 800;
        const scale = Math.min(containerWidth / img.width, 1);
        const width = Math.floor(img.width * scale);
        const height = Math.floor(img.height * scale);

        canvas.width = width;
        canvas.height = height;
        setCanvasSize({ width, height });

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        textBoxes.forEach((box) => {
          ctx.save();
          ctx.translate(box.x, box.y);
          ctx.rotate((box.rotation * Math.PI) / 180);
          ctx.font = `bold ${box.fontSize * scale}px ${box.fontFamily}, Impact, Arial, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = box.strokeWidth;
          ctx.strokeStyle = box.stroke;
          ctx.fillStyle = box.color;
          drawText(ctx, box, width * 0.9);
          ctx.restore();
        });
      } catch (error) {
        console.error("Error drawing meme:", error);
        notify.error("Failed to render meme");
        announce("Failed to render meme");
      } finally {
        setIsDrawing(false);
      }
    };

    img.onerror = () => {
      notify.error("Failed to load image");
      announce("Failed to load image");
      setIsDrawing(false);
    };

    img.src = uploadedImage;
  }, [uploadedImage, textBoxes]);

  useEffect(() => {
    if (uploadedImage && canvasRef.current) {
      const timer = setTimeout(drawMeme, 10);
      return () => clearTimeout(timer);
    }
  }, [uploadedImage, textBoxes, drawMeme]);

  /** Pointer Handlers */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedBox = textBoxes.find((t) => {
      const approxWidth = t.text.length * (t.fontSize / 2);
      return Math.abs(x - t.x) < approxWidth && Math.abs(y - t.y) < t.fontSize;
    });

    if (clickedBox) {
      setActiveTextId(clickedBox.id);
      setDragOffset({ x: x - clickedBox.x, y: y - clickedBox.y });
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerIdRef.current = e.pointerId;
      } catch (err) {
        console.warn("Pointer capture failed:", err);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeTextId || !dragOffset) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width, e.clientX - rect.left - dragOffset.x));
    const y = Math.max(0, Math.min(canvas.height, e.clientY - rect.top - dragOffset.y));

    setTextBoxes((prev) =>
      prev.map((t) => (t.id === activeTextId ? { ...t, x, y } : t))
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(pointerIdRef.current);
      } catch (err) {
        console.warn("Pointer release failed:", err);
      }
      pointerIdRef.current = null;
    }
    setActiveTextId(null);
    setDragOffset(null);
  };

  /** Add/Delete Text */
  const addTextBox = () => {
    if (!uploadedImage) {
      notify.error("Please upload an image first");
      announce("Please upload an image first");
      return;
    }
    const newId = crypto.randomUUID();
    const newBox: TextBox = {
      id: newId,
      text: "Your Text Here",
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      ...DEFAULT_TEXT_STYLE,
    };
    setTextBoxes((prev) => [...prev, newBox]);
    setActiveTextId(newId);
    notify.success("Text added! Drag to position");
    announce("Text added");
  };

  const deleteTextBox = (id: string) => {
    setTextBoxes((prev) => prev.filter((t) => t.id !== id));
    if (activeTextId === id) setActiveTextId(null);
    notify.success("Text removed");
    announce("Text removed");
  };

  const updateTextBox = (id: string, changes: Partial<TextBox>) => {
    setTextBoxes((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  };

  /** Upload Image (with Magic Byte Validation) */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      notify.error(error);
      announce(error);
      return;
    }

    const signature = await sniffMime(file);
    if (!signature.valid) {
      console.error("Invalid file signature:", signature.detected);
      notify.error("Invalid or corrupted image file.");
      announce("Invalid or corrupted image file");
      return;
    }

    const url = await createImageUrl(file, {
      downscaleLarge: true,
      maxDimension: MAX_IMAGE_DIMENSION,
    });
    if (!url) return;

    setUploadedImage(url);
    setTextBoxes([]);
    notify.success("Image uploaded successfully!");
    announce("Image uploaded successfully");
  };

  /** Download Meme (High Resolution) */
  const downloadMeme = () => {
    if (!uploadedImage) {
      notify.error("Please upload an image first");
      announce("Please upload an image first");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const scale = 2;
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width * scale;
      exportCanvas.height = canvas.height * scale;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, exportCanvas.width, exportCanvas.height);

          textBoxes.forEach((box) => {
            ctx.save();
            ctx.translate(box.x * scale, box.y * scale);
            ctx.rotate((box.rotation * Math.PI) / 180);
            ctx.font = `bold ${box.fontSize * scale}px ${box.fontFamily}, Impact, Arial, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.lineWidth = box.strokeWidth * scale;
            ctx.strokeStyle = box.stroke;
            ctx.fillStyle = box.color;
            drawText(ctx, box, exportCanvas.width * 0.9);
            ctx.restore();
          });

          try {
            exportCanvas.toBlob((blob) => {
              if (!blob) {
                notify.error("Failed to create image");
                announce("Failed to create image");
                return;
              }
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.download = `meme-${Date.now()}.png`;
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);
              notify.success("Meme downloaded successfully!");
              announce("Meme downloaded successfully");
            }, "image/png");
          } catch (err) {
            console.error("toBlob error:", err);
            notify.error("Export failed due to browser issue.");
            announce("Export failed due to browser issue");
          }
        } catch (err) {
          console.error("Canvas draw error:", err);
          notify.error("Failed to render meme for download.");
          announce("Failed to render meme for download");
        }
      };

      img.onerror = () => {
        notify.error("Failed to load image for download");
        announce("Failed to load image for download");
      };

      img.src = uploadedImage;
    } catch (error) {
      console.error("Download error:", error);
      notify.error("Failed to download meme");
      announce("Failed to download meme");
    }
  };

  /** Reset (with URL cleanup) */
  const resetMeme = () => {
    if (uploadedImage) revoke(uploadedImage);
    setUploadedImage(null);
    setTextBoxes([]);
    setActiveTextId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    notify.success("Meme reset successfully!");
    announce("Meme reset successfully");
  };

  return (
    <div className="space-y-6 relative">
      {/* Live region for screen readers */}
      <div ref={liveRegionRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Meme Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload" className="text-sm font-medium">
              Upload Your Image
            </Label>
            <Input
              id="image-upload"
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              onChange={handleImageUpload}
              aria-label="Upload image for meme"
            />
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, GIF (max 10MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Text Editor & Preview */}
      {uploadedImage && (
        <div ref={containerRef} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Text Layers
                </span>
                <Button
                  onClick={addTextBox}
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Text
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {textBoxes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No text added yet. Click "Add Text" to get started!
                </p>
              ) : (
                textBoxes.map((box) => (
                  <div
                    key={box.id}
                    className="p-3 sm:p-4 border rounded-lg space-y-3 bg-muted/30"
                  >
                    <div className="flex gap-2 items-start">
                      <Input
                        id={`meme-text-input-${box.id}`}
                        value={box.text}
                        onChange={(e) =>
                          updateTextBox(box.id, {
                            text: truncateText(stripHtml(e.target.value), 100),
                          })
                        }
                        placeholder="Enter text"
                        className="flex-1 h-10 sm:h-9 text-base sm:text-sm"
                        maxLength={100}
                        onTouchStart={(e) => e.stopPropagation()}
                      />
                      <Button
                        onClick={() => deleteTextBox(box.id)}
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 sm:h-9 sm:w-9 flex-shrink-0"
                        aria-label="Delete text"
                      >
                        <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm sm:text-xs font-medium">
                            Font Size
                          </Label>
                          <span className="text-sm sm:text-xs text-muted-foreground font-mono">
                            {box.fontSize}px
                          </span>
                        </div>
                        <Slider
                          min={20}
                          max={120}
                          step={2}
                          value={[box.fontSize]}
                          onValueChange={(v) =>
                            updateTextBox(box.id, { fontSize: v[0] })
                          }
                          className="cursor-pointer touch-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm sm:text-xs font-medium">
                            Stroke Width
                          </Label>
                          <span className="text-sm sm:text-xs text-muted-foreground font-mono">
                            {box.strokeWidth}px
                          </span>
                        </div>
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          value={[box.strokeWidth]}
                          onValueChange={(v) =>
                            updateTextBox(box.id, { strokeWidth: v[0] })
                          }
                          className="cursor-pointer touch-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm sm:text-xs font-medium">
                            Rotation
                          </Label>
                          <span className="text-sm sm:text-xs text-muted-foreground font-mono">
                            {box.rotation}°
                          </span>
                        </div>
                        <Slider
                          min={-180}
                          max={180}
                          step={5}
                          value={[box.rotation]}
                          onValueChange={(v) =>
                            updateTextBox(box.id, { rotation: v[0] })
                          }
                          className="cursor-pointer touch-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm sm:text-xs font-medium">
                          Font Family
                        </Label>
                        <Select
                          value={box.fontFamily}
                          onValueChange={(v) =>
                            updateTextBox(box.id, { fontFamily: v })
                          }
                        >
                          <SelectTrigger className="h-10 sm:h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_FAMILIES.map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm sm:text-xs font-medium">
                          Text Color
                        </Label>
                        <Input
                          type="color"
                          value={box.color}
                          onChange={(e) =>
                            updateTextBox(box.id, { color: e.target.value })
                          }
                          className="h-12 sm:h-10 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm sm:text-xs font-medium">
                          Stroke Color
                        </Label>
                        <Input
                          type="color"
                          value={box.stroke}
                          onChange={(e) =>
                            updateTextBox(box.id, { stroke: e.target.value })
                          }
                          className="h-12 sm:h-10 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Canvas Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview & Download</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-2 sm:p-4 bg-muted/30 flex justify-center items-center overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full max-w-full rounded shadow-sm cursor-move active:cursor-grabbing touch-none bg-transparent select-none"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{
                    opacity: isDrawing ? 0.7 : 1,
                    imageRendering: "auto",
                    touchAction: "none",
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: "none",
                  }}
                  aria-label="Meme canvas - drag text to reposition"
                />
              </div>
              {textBoxes.length > 0 && (
                <p className="text-xs text-muted-foreground text-center px-4">
                  💡 Tap and drag text on the canvas to reposition it
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 px-2 sm:px-0">
                <Button
                  onClick={downloadMeme}
                  className="flex-1 h-12 sm:h-10 text-base sm:text-sm font-semibold"
                >
                  <Download className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                  Download Meme
                </Button>
                <Button
                  onClick={resetMeme}
                  variant="outline"
                  className="flex-1 h-12 sm:h-10 text-base sm:text-sm font-semibold"
                >
                  <RotateCcw className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

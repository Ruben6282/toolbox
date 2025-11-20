import type React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import {
  ALLOWED_IMAGE_TYPES,
  validateImageFile,
  createSafeObjectUrl,
  sniffMime,
  enforceMaxDimensions,
} from "@/lib/security";

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null;
};

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hslToRgb = (h: number, s: number, l: number) => {
  const ss = s / 100;
  const ll = l / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ll - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const hexToHsl = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const ColorPicker = () => {
  const [color, setColor] = useState("#3b82f6");
  const [hexInput, setHexInput] = useState("#3b82f6");
  const [rgbInput, setRgbInput] = useState("59, 130, 246");
  const [hslInput, setHslInput] = useState("217, 91%, 60%");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hoveredHex, setHoveredHex] = useState<string | null>(null);
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });

  const magnifierCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  const revokePrevUrl = () => {
    if (prevUrlRef.current) {
      try {
        URL.revokeObjectURL(prevUrlRef.current);
      } catch {
        // ignore
      }
      prevUrlRef.current = null;
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    const basicErr = validateImageFile(file);
    if (basicErr) {
      notify.error(basicErr);
      return;
    }

    try {
      const { valid, detected } = await sniffMime(file);
      if (!valid || !detected || !ALLOWED_IMAGE_TYPES.includes(detected)) {
        notify.error("Unsupported or invalid image type");
        return;
      }
    } catch {
      notify.error("Failed to inspect image");
      return;
    }

    const tempUrl = createSafeObjectUrl(file);
    if (!tempUrl) {
      notify.error("Failed to create preview for image");
      return;
    }

    const scaledUrl = await enforceMaxDimensions(tempUrl);
    if (scaledUrl !== tempUrl) {
      try {
        URL.revokeObjectURL(tempUrl);
      } catch {
        // ignore
      }
    }

    revokePrevUrl();
    prevUrlRef.current = scaledUrl;
    setImageUrl(scaledUrl);
    setIsImageLoaded(false);
  };

  const drawImageToCanvas = useCallback(() => {
    if (!canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imgRef.current;
    const maxWidth = 600;
    const maxHeight = 400;
    let { width, height } = img;
    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);

    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    setIsImageLoaded(true);
  }, []);

  const handleImageLoad = () => {
    drawImageToCanvas();
  };

  const pickColorFromCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(
      ((e.clientX - rect.left) / rect.width) * canvasRef.current.width
    );
    const y = Math.floor(
      ((e.clientY - rect.top) / rect.height) * canvasRef.current.height
    );
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    try {
      const data = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(data[0], data[1], data[2]);
      updateColor(hex);
      notify.success(`Picked ${hex.toUpperCase()}`);
    } catch {
      notify.error("Unable to pick color");
    }
  };

  const samplePixel = (
    clientX: number,
    clientY: number,
    apply: boolean
  ): void => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(
      ((clientX - rect.left) / rect.width) * canvasRef.current.width
    );
    const y = Math.floor(
      ((clientY - rect.top) / rect.height) * canvasRef.current.height
    );
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    try {
      const regionSize = 11;
      const half = Math.floor(regionSize / 2);
      const data = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(data[0], data[1], data[2]);
      setHoveredHex(hex);

      if (magnifierCanvasRef.current) {
        const magCtx = magnifierCanvasRef.current.getContext("2d");
        if (magCtx) {
          magnifierCanvasRef.current.width = regionSize;
          magnifierCanvasRef.current.height = regionSize;

          const sx = Math.max(0, x - half);
          const sy = Math.max(0, y - half);
          const maxX = canvasRef.current.width;
          const maxY = canvasRef.current.height;
          const sw =
            sx + regionSize > maxX ? maxX - sx : regionSize;
          const sh =
            sy + regionSize > maxY ? maxY - sy : regionSize;

          const imgData = ctx.getImageData(sx, sy, sw, sh);
          magCtx.putImageData(imgData, 0, 0);
        }
      }

      if (apply) {
        updateColor(hex);
      }
    } catch {
      // ignore sampling errors
    }
  };

  const handleCanvasMouseMove = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): void => {
    if (!isImageLoaded) return;
    setShowMagnifier(true);
    setMagnifierPos({ x: e.clientX, y: e.clientY });
    samplePixel(e.clientX, e.clientY, isDragging);
  };

  const handleCanvasMouseLeave = (): void => {
    setShowMagnifier(false);
    setHoveredHex(null);
    setIsDragging(false);
  };

  const handleCanvasMouseDown = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): void => {
    setIsDragging(true);
    samplePixel(e.clientX, e.clientY, true);
  };

  const handleCanvasMouseUp = (): void => {
    setIsDragging(false);
  };

  // Support paste of image from clipboard
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;

      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (!item.type.startsWith("image/")) continue;

        const file = item.getAsFile();
        if (!file) continue;

        (async () => {
          const basicErr = validateImageFile(file);
          if (basicErr) {
            notify.error(basicErr);
            return;
          }

          try {
            const { valid, detected } = await sniffMime(file);
            if (!valid || !detected || !ALLOWED_IMAGE_TYPES.includes(detected)) {
              notify.error("Unsupported or invalid image type");
              return;
            }
          } catch {
            notify.error("Failed to inspect image");
            return;
          }

          const tempUrl = createSafeObjectUrl(file);
          if (!tempUrl) {
            notify.error("Failed to create preview for image");
            return;
          }

          const scaledUrl = await enforceMaxDimensions(tempUrl);
          if (scaledUrl !== tempUrl) {
            try {
              URL.revokeObjectURL(tempUrl);
            } catch {
              // ignore
            }
          }

          revokePrevUrl();
          prevUrlRef.current = scaledUrl;
          setImageUrl(scaledUrl);
          setIsImageLoaded(false);
          notify.success("Image pasted from clipboard");
        })();

        break;
      }
    };

    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("paste", onPaste);
    };
  }, []);

  // Revoke object URL on unmount to prevent leaks
  useEffect(() => {
    return () => {
      revokePrevUrl();
    };
  }, []);

  const updateColor = (newColor: string) => {
    setColor(newColor);
    setHexInput(newColor.toUpperCase());
    const rgb = hexToRgb(newColor);
    const hsl = hexToHsl(newColor);
    if (rgb) setRgbInput(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
    if (hsl) setHslInput(`${hsl.h}, ${hsl.s}%, ${hsl.l}%`);
  };

  const handleHexInput = (value: string) => {
    setHexInput(value);
    const trimmed = value.trim();
    if (!trimmed) return;

    const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    if (/^#[0-9A-Fa-f]{6}$/i.test(hex)) {
      updateColor(hex);
      notify.success("Color updated from HEX");
    }
  };

  const handleRgbInput = (value: string) => {
    setRgbInput(value);
    const match = value.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      const r = Number.parseInt(match[1], 10);
      const g = Number.parseInt(match[2], 10);
      const b = Number.parseInt(match[3], 10);
      if (
        r >= 0 &&
        r <= 255 &&
        g >= 0 &&
        g <= 255 &&
        b >= 0 &&
        b <= 255
      ) {
        const hex = rgbToHex(r, g, b);
        updateColor(hex);
        notify.success("Color updated from RGB");
      }
    }
  };

  const handleHslInput = (value: string) => {
    setHslInput(value);
    const match = value.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    if (match) {
      const h = Number.parseInt(match[1], 10);
      const s = Number.parseInt(match[2], 10);
      const l = Number.parseInt(match[3], 10);
      if (
        h >= 0 &&
        h <= 360 &&
        s >= 0 &&
        s <= 100 &&
        l >= 0 &&
        l <= 100
      ) {
        const rgb = hslToRgb(h, s, l);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        updateColor(hex);
        notify.success("Color updated from HSL");
      }
    }
  };

  const rgb = hexToRgb(color);
  const hsl = hexToHsl(color);

  const copyValue = async (value: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        notify.success("Copied to clipboard!");
        return;
      }

      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        notify.success("Copied to clipboard!");
      } catch {
        notify.error("Failed to copy");
      } finally {
        document.body.removeChild(textArea);
      }
    } catch {
      notify.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pick a Color</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Color Picker</Label>
            <div className="flex gap-3">
              <Input
                type="color"
                value={color}
                onChange={(e) => updateColor(e.target.value)}
                className="h-20 w-full cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pick from Image</Label>
            <div className="flex flex-col gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {imageUrl && (
                <div className="space-y-2">
                  <img
                    src={imageUrl}
                    ref={imgRef}
                    alt="Uploaded"
                    onLoad={handleImageLoad}
                    className="hidden"
                  />
                  <div className="relative inline-block">
                    <canvas
                      ref={canvasRef}
                      onClick={pickColorFromCanvas}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseLeave={handleCanvasMouseLeave}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseUp={handleCanvasMouseUp}
                      onTouchStart={(e) => {
                        if (!isImageLoaded) return;
                        setIsDragging(true);
                        const touch = e.touches[0];
                        if (touch) {
                          samplePixel(touch.clientX, touch.clientY, true);
                        }
                      }}
                      onTouchMove={(e) => {
                        if (!isImageLoaded) return;
                        const touch = e.touches[0];
                        if (touch) {
                          setShowMagnifier(true);
                          setMagnifierPos({
                            x: touch.clientX,
                            y: touch.clientY,
                          });
                          samplePixel(
                            touch.clientX,
                            touch.clientY,
                            isDragging
                          );
                        }
                        e.preventDefault();
                      }}
                      onTouchEnd={() => {
                        setIsDragging(false);
                        setShowMagnifier(false);
                        setHoveredHex(null);
                      }}
                      className={`border rounded-md ${
                        isImageLoaded
                          ? "cursor-crosshair"
                          : "cursor-not-allowed"
                      } max-w-full touch-none`}
                    />
                    {showMagnifier && hoveredHex && (
                      <div
                        style={{
                          position: "fixed",
                          top: magnifierPos.y + 20,
                          left: magnifierPos.x + 20,
                          zIndex: 50,
                        }}
                        className="pointer-events-none"
                      >
                        <div className="rounded-md shadow-lg border bg-popover p-2 flex flex-col items-center gap-2">
                          <div
                            className="overflow-hidden rounded-sm"
                            style={{ width: 88, height: 88 }}
                          >
                            <canvas
                              ref={magnifierCanvasRef}
                              style={{
                                width: 88,
                                height: 88,
                                imageRendering: "pixelated",
                              }}
                            />
                          </div>
                          <div className="text-xs font-mono flex flex-col items-center">
                            <span>{hoveredHex.toUpperCase()}</span>
                            {(() => {
                              const rgbVal = hexToRgb(hoveredHex);
                              if (!rgbVal) return null;
                              return (
                                <span>
                                  {`rgb(${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b})`}
                                </span>
                              );
                            })()}
                          </div>
                          <div
                            className="w-full h-4 rounded"
                            style={{ backgroundColor: hoveredHex }}
                          />
                          {isDragging && (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Sampling…
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click or drag on the image to pick colors. Hover shows a
                    magnified preview. You can also paste an image (Ctrl+V).
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>HEX Value</Label>
            <div className="flex gap-2">
              <Input
                value={hexInput}
                onChange={(e) => handleHexInput(e.target.value)}
                placeholder="#3B82F6"
                className="font-mono"
              />
              <Button
                onClick={() => copyValue(color.toUpperCase())}
                variant="outline"
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a hex code (e.g., #FF5733 or FF5733)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rgb && (
            <div className="space-y-2">
              <Label>RGB</Label>
              <div className="flex gap-2">
                <Input
                  value={rgbInput}
                  onChange={(e) => handleRgbInput(e.target.value)}
                  placeholder="59, 130, 246"
                  className="font-mono"
                />
                <Button
                  onClick={() =>
                    copyValue(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)
                  }
                  variant="outline"
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter RGB values (e.g., 255, 87, 51 or rgb(255, 87, 51))
              </p>
            </div>
          )}

          {hsl && (
            <div className="space-y-2">
              <Label>HSL</Label>
              <div className="flex gap-2">
                <Input
                  value={hslInput}
                  onChange={(e) => handleHslInput(e.target.value)}
                  placeholder="217, 91%, 60%"
                  className="font-mono"
                />
                <Button
                  onClick={() =>
                    copyValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)
                  }
                  variant="outline"
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter HSL values (e.g., 9, 100%, 64% or hsl(9, 100%, 64%))
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="h-40 rounded-lg border-2 border-border"
            style={{ backgroundColor: color }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

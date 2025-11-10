"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Download,
  Type,
  Image as ImageIcon,
  Trash2,
  Copy,
  X,
} from "lucide-react";
import { notify } from "@/lib/notify";
import {
  ALLOWED_IMAGE_TYPES,
  stripHtml,
  truncateText,
} from "@/lib/security";
import { useObjectUrls } from "@/hooks/use-object-urls";

type Watermark = {
  id: string;
  type: "text" | "image";
  text?: string;
  src?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  color?: string;
};

export const AddWatermark = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [watermarks, setWatermarks] = useState<Watermark[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [sheetCollapsed, setSheetCollapsed] = useState<boolean>(false);
  const pointerIdRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wmRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  // Use shared object URL management (validation + optional downscale + auto cleanup)
  const { createImageUrl, revoke } = useObjectUrls();

  // ------------------- Upload Handlers -------------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await createImageUrl(file, { downscaleLarge: true });
    if (!url) return;
    setSelectedImage((prev) => {
      if (prev) revoke(prev);
      return url;
    });
    notify.success("Image uploaded successfully!");
  };

  const handleLogoUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await createImageUrl(file, { downscaleLarge: true });
    if (!url) return;
    setWatermarks((prev) => prev.map((wm) => {
      if (wm.id !== id) return wm;
      if (wm.src) revoke(wm.src);
      return { ...wm, src: url };
    }));
    notify.success("Logo uploaded successfully!");
  };

  // ------------------- Toolbar Actions -------------------
  const addWatermark = (type: "text" | "image") => {
    const containerWidth = containerRef.current?.offsetWidth || 300;
    const containerHeight = containerRef.current?.offsetHeight || 300;

    const newWM: Watermark = {
      id: crypto.randomUUID(),
      type,
      text: type === "text" ? "Your Text" : undefined,
      x: containerWidth / 2,
      y: containerHeight / 2,
      scale: 1,
      rotation: 0,
      opacity: 100,
      color: "#000000",
    };
    setWatermarks((prev) => [...prev, newWM]);
    setActiveId(newWM.id);
    // On mobile, expand the bottom sheet so input is visible
    if (window.innerWidth < 640) setSheetCollapsed(false);
    notify.success(`${type === "text" ? "Text" : "Image"} watermark added!`);
  };

  const removeAll = () => {
    if (watermarks.length === 0) {
      notify.error("No watermarks to remove");
      return;
    }
    // Revoke all watermark image object URLs
    for (const wm of watermarks) {
      if (wm.src) revoke(wm.src);
    }
    setWatermarks([]);
    setActiveId(null);
    notify.success("All watermarks removed!");
  };

  // ------------------- Update -------------------
  const updateWatermark = (id: string, changes: Partial<Watermark>) => {
    setWatermarks((prev) =>
      prev.map((wm) => (wm.id === id ? { ...wm, ...changes } : wm))
    );
  };

  // ------------------- Dragging (Pointer Events) -------------------
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
      pointerIdRef.current = e.pointerId;
    } catch {
      // ignore if pointer capture not supported
    }
    setDraggingId(id);
    setLastPos({ x: e.clientX, y: e.clientY });
    setActiveId(id);
  };

  // ------------------- Movement Effects -------------------
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!draggingId || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const wmEl = wmRefs.current[draggingId];
      if (!wmEl) return;

      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;

      setWatermarks((prev) =>
        prev.map((wm) => {
          if (wm.id !== draggingId) return wm;
          let newX = wm.x + dx;
          let newY = wm.y + dy;

          const halfWidth = (wmEl.offsetWidth * wm.scale) / 2;
          const halfHeight = (wmEl.offsetHeight * wm.scale) / 2;

          newX = Math.max(halfWidth, Math.min(containerRect.width - halfWidth, newX));
          newY = Math.max(halfHeight, Math.min(containerRect.height - halfHeight, newY));

          return { ...wm, x: newX, y: newY };
        })
      );

      setLastPos({ x: e.clientX, y: e.clientY });
    };

    const stopDragging = (e: PointerEvent) => {
      if (pointerIdRef.current) {
        const el = document.querySelector('[data-wm-active="true"]') as HTMLElement | null;
        try {
          el?.releasePointerCapture(pointerIdRef.current);
        } catch {
          // ignore release errors
        }
        pointerIdRef.current = null;
      }
      setDraggingId(null);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current || !activeId) return;
      const target = e.target as Node;
      const activeWMEl = wmRefs.current[activeId];
      const popup = document.querySelector("#watermark-popup");
      if (activeWMEl && !activeWMEl.contains(target) && popup && !popup.contains(target)) {
        setActiveId(null);
      }
    };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerup", stopDragging, { passive: true });
    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [draggingId, lastPos, activeId]);

  // Cleanup now handled centrally by useObjectUrls hook

  // ------------------- Responsive -------------------
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640); // tailwind sm breakpoint
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // When selecting a WM on mobile, start with collapsed sheet to keep canvas visible
  useEffect(() => {
    if (activeId && isMobile) setSheetCollapsed(true);
  }, [activeId, isMobile]);

  // ------------------- Generate Image -------------------
  const generateFinalImage = () => {
    if (!selectedImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseImg = new Image();
    baseImg.onload = async () => {
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / containerRef.current!.offsetWidth;
      const scaleY = canvas.height / containerRef.current!.offsetHeight;

      for (const wm of watermarks) {
        ctx.save();
        ctx.globalAlpha = wm.opacity / 100;
        const wmEl = wmRefs.current[wm.id];
        if (!wmEl) continue;

        const cx = wm.x * scaleX;
        const cy = wm.y * scaleY;

        ctx.translate(cx, cy);
        ctx.rotate((wm.rotation * Math.PI) / 180);
        ctx.scale(wm.scale, wm.scale);

        if (wm.type === "text" && wm.text) {
          const style = window.getComputedStyle(wmEl);
          const fontSize = parseInt(style.fontSize);
          const fontWeight = style.fontWeight || "bold";
          const fontFamily = style.fontFamily || "Arial";
          ctx.font = `${fontWeight} ${fontSize * scaleY}px ${fontFamily}`;
          ctx.fillStyle = wm.color || "#000";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(wm.text, 0, 0);
        } else if (wm.type === "image" && wm.src) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const aspect = img.width / img.height;
              let drawWidth = wmEl.offsetWidth * scaleX;
              let drawHeight = wmEl.offsetHeight * scaleY;
              if (aspect > 1) drawHeight = drawWidth / aspect;
              else drawWidth = drawHeight * aspect;

              ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
              resolve();
            };
            img.src = wm.src!;
          });
        }
        ctx.restore();
      }

      try {
        const link = document.createElement("a");
        link.download = "watermarked-image.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        notify.success("Watermarked image downloaded!");
      } catch {
        notify.error("Failed to download image");
      }
    };
    baseImg.onerror = () => notify.error("Failed to load image");
    baseImg.src = selectedImage;
  };

  // ------------------- Render -------------------
  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Image</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleImageUpload}
          />
        </CardContent>
      </Card>

      {/* Toolbar */}
      {selectedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Watermark Toolbar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Button
                onPointerDown={(e) => {
                  e.preventDefault();
                e.stopPropagation();
                addWatermark("text");
              }}
              className="w-full sm:w-auto"
            >
              <Type className="w-4 h-4 mr-2 inline" /> Add Text
            </Button>
            <Button
                onPointerDown={(e) => {
                  e.preventDefault();
                e.stopPropagation();
                addWatermark("image");
              }}
              className="w-full sm:w-auto"
            >
              <ImageIcon className="w-4 h-4 mr-2 inline" /> Add Logo
            </Button>
            <Button
              variant="destructive"
                onPointerDown={(e) => {
                e.preventDefault();
                  e.stopPropagation();
                removeAll();
              }}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2 inline" /> Remove All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {selectedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div
                ref={containerRef}
                className="relative inline-block border rounded-lg overflow-hidden max-w-4xl w-full touch-manipulation"
              >
                <img src={selectedImage} alt="Uploaded" className="w-full h-auto block" />
                {watermarks.map((wm) => (
                  <div
                    key={wm.id}
                    ref={(el) => (wmRefs.current[wm.id] = el)}
                    className={`absolute cursor-move select-none ${
                      activeId === wm.id ? "outline outline-blue-500" : ""
                    }`}
                    style={{
                      left: wm.x,
                      top: wm.y,
                      transform: `translate(-50%, -50%) scale(${wm.scale}) rotate(${wm.rotation}deg)`,
                      opacity: wm.opacity / 100,
                      color: wm.color,
                      fontSize: "32px",
                      fontWeight: "bold",
                      zIndex: 10,
                      touchAction: "none",
                    }}
                    data-wm-active={activeId === wm.id ? "true" : undefined}
                    onPointerDown={(e) => handlePointerDown(e, wm.id)}
                    onClick={() => setActiveId(wm.id)}
                  >
                    {wm.type === "text" ? (
                      <span>{wm.text}</span>
                    ) : wm.src ? (
                      <img
                        src={wm.src}
                        alt="logo"
                        className="w-32 h-32 object-contain"
                        draggable={false}
                      />
                    ) : (
                      <Input
                        type="file"
                        accept={ALLOWED_IMAGE_TYPES.join(",")}
                        onChange={(e) => handleLogoUpload(wm.id, e)}
                      />
                    )}
                  </div>
                ))}

                {/* Popup / Bottom Sheet */}
                {activeId && draggingId === null && (() => {
                  const wm = watermarks.find((w) => w.id === activeId);
                  if (!wm) return null;

                  // Mobile bottom sheet variant
                  if (isMobile) {
                    return (
                      <div id="watermark-popup" className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
                        <div className="pointer-events-auto">
                          {/* Backdrop for collapsed state */}
                          {!sheetCollapsed && (
                            <div 
                              className="fixed inset-0 bg-black/30 -z-10 animate-in fade-in duration-200"
                              onClick={() => setSheetCollapsed(true)}
                            />
                          )}
                          
                          <Card className={`border-t rounded-t-3xl shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out bg-card text-card-foreground ${sheetCollapsed ? 'translate-y-[calc(100%-4rem)]' : 'translate-y-0'}`}>
                            {/* Drag Handle & Header */}
                            <div 
                              className="flex flex-col items-center pt-2 pb-3 px-4 cursor-pointer active:cursor-grabbing touch-none bg-card"
                              onClick={() => setSheetCollapsed(c => !c)}
                            >
                              {/* Drag handle indicator */}
                              <div className="w-12 h-1.5 bg-border rounded-full mb-3 transition-colors opacity-50" />
                              
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {wm.type === 'text' ? (
                                    <Type className="w-4 h-4 flex-shrink-0 text-foreground" />
                                  ) : (
                                    <ImageIcon className="w-4 h-4 flex-shrink-0 text-foreground" />
                                  )}
                                  <span className="text-sm font-semibold truncate text-foreground">
                                    {wm.type === 'text' ? (wm.text || 'Text Watermark') : 'Image Watermark'}
                                  </span>
                                  {sheetCollapsed && (
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                      Tap to expand
                                    </span>
                                  )}
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveId(null);
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Content */}
                            {!sheetCollapsed && (
                              <CardContent className="pt-0 pb-6 px-4 space-y-4 overflow-y-auto max-h-[50vh] animate-in slide-in-from-bottom-2 duration-200 bg-card">
                                {wm.type === 'text' && (
                                  <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                                    <div>
                                      <Label className="text-xs font-semibold mb-1.5 block text-foreground">
                                        Text Content
                                      </Label>
                                      <Textarea
                                        rows={2}
                                        value={wm.text}
                                        onChange={(e) => {
                                          const safe = truncateText(stripHtml(e.target.value), 200);
                                          updateWatermark(activeId, { text: safe });
                                        }}
                                        className="text-sm resize-none bg-background text-foreground"
                                        placeholder="Enter watermark text"
                                        onTouchStart={e => e.stopPropagation()}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-semibold mb-1.5 block text-foreground">
                                        Text Color
                                      </Label>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="color"
                                          value={wm.color}
                                          onChange={(e) => updateWatermark(activeId, { color: e.target.value })}
                                          className="h-10 w-20 p-1 cursor-pointer"
                                          onTouchStart={e => e.stopPropagation()}
                                        />
                                        <span className="text-xs font-mono text-foreground bg-background px-2 py-1 rounded border border-border">
                                          {wm.color}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {wm.type === 'image' && !wm.src && (
                                  <div className="p-3 bg-muted/30 rounded-lg border border-border">
                                    <Label className="text-xs font-semibold mb-1.5 block text-foreground">
                                      Upload Logo
                                    </Label>
                                    <Input
                                      type="file"
                                      accept={ALLOWED_IMAGE_TYPES.join(",")}
                                      onChange={(e) => handleLogoUpload(activeId, e)}
                                      className="text-xs cursor-pointer text-foreground"
                                      onTouchStart={e => e.stopPropagation()}
                                    />
                                  </div>
                                )}
                                
                                {/* Sliders Section */}
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs font-semibold text-foreground">
                                        Opacity
                                      </Label>
                                      <span className="text-xs font-mono text-foreground bg-muted px-2 py-0.5 rounded">
                                        {wm.opacity}%
                                      </span>
                                    </div>
                                    <Slider 
                                      value={[wm.opacity]} 
                                      onValueChange={(v) => updateWatermark(activeId, { opacity: v[0] })} 
                                      min={10} 
                                      max={100}
                                      className="cursor-pointer"
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs font-semibold text-foreground">
                                        Scale
                                      </Label>
                                      <span className="text-xs font-mono text-foreground bg-muted px-2 py-0.5 rounded">
                                        {wm.scale.toFixed(2)}x
                                      </span>
                                    </div>
                                    <Slider 
                                      value={[wm.scale]} 
                                      onValueChange={(v) => updateWatermark(activeId, { scale: v[0] })} 
                                      min={0.2} 
                                      max={3} 
                                      step={0.1}
                                      className="cursor-pointer"
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs font-semibold text-foreground">
                                        Rotation
                                      </Label>
                                      <span className="text-xs font-mono text-foreground bg-muted px-2 py-0.5 rounded">
                                        {wm.rotation}°
                                      </span>
                                    </div>
                                    <Slider 
                                      value={[wm.rotation]} 
                                      onValueChange={(v) => updateWatermark(activeId, { rotation: v[0] })} 
                                      min={-180} 
                                      max={180}
                                      className="cursor-pointer"
                                    />
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2 border-t border-border">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                      setWatermarks((prev) => [
                                        ...prev,
                                        { ...wm, id: crypto.randomUUID(), x: wm.x + 20, y: wm.y + 20 },
                                      ]);
                                      notify.success('Watermark duplicated!');
                                    }}
                                  >
                                    <Copy className="w-4 h-4 mr-1.5" /> 
                                    <span className="font-medium">Duplicate</span>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => {
                                      setWatermarks((prev) => prev.filter((w) => w.id !== activeId));
                                      setActiveId(null);
                                      notify.success('Watermark deleted!');
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1.5" /> 
                                    <span className="font-medium">Delete</span>
                                  </Button>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        </div>
                      </div>
                    );
                  }

                  // Desktop floating popup (original logic simplified)
                  const wmEl = wmRefs.current[wm.id];
                  if (!wmEl) return null;
                  const wmRect = wmEl.getBoundingClientRect();
                  const popupWidth = 320;
                  const popupHeight = 420;
                  const viewportWidth = window.innerWidth;
                  const viewportHeight = window.innerHeight;
                  const spacing = 10;
                  let popupLeft = wmRect.right + spacing;
                  let popupTop = wmRect.top + wmRect.height / 2 - popupHeight / 2;
                  if (popupLeft + popupWidth > viewportWidth - spacing) popupLeft = wmRect.left - popupWidth - spacing;
                  if (popupLeft < spacing) {
                    popupLeft = Math.max(spacing, Math.min(viewportWidth - popupWidth - spacing, wmRect.left));
                    popupTop = wmRect.bottom + spacing;
                  }
                  popupTop = Math.max(spacing, Math.min(viewportHeight - popupHeight - spacing, popupTop));
                  return (
                    <Card id="watermark-popup" className="fixed z-50 p-4 w-80 shadow-lg" style={{ left: popupLeft, top: popupTop }}>
                      <div className="flex justify-end mb-2">
                        <X className="cursor-pointer" onClick={() => setActiveId(null)} />
                      </div>
                      <CardContent className="space-y-3">
                        {wm.type === 'text' && (
                          <div>
                            <Label>Text</Label>
                            <Textarea
                              rows={2}
                              value={wm.text}
                              onChange={(e) => {
                                const safe = truncateText(stripHtml(e.target.value), 200);
                                updateWatermark(activeId, { text: safe });
                              }}
                            />
                            <Label>Color</Label>
                            <Input type="color" value={wm.color} onChange={(e) => updateWatermark(activeId, { color: e.target.value })} />
                          </div>
                        )}
                        {wm.type === 'image' && !wm.src && (
                          <div>
                            <Label>Upload Logo</Label>
                            <Input type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} onChange={(e) => handleLogoUpload(activeId, e)} />
                          </div>
                        )}
                        <Label>Opacity: {wm.opacity}%</Label>
                        <Slider value={[wm.opacity]} onValueChange={(v) => updateWatermark(activeId, { opacity: v[0] })} min={10} max={100} />
                        <Label>Scale: {wm.scale.toFixed(2)}</Label>
                        <Slider value={[wm.scale]} onValueChange={(v) => updateWatermark(activeId, { scale: v[0] })} min={0.2} max={3} step={0.1} />
                        <Label>Rotation: {wm.rotation}°</Label>
                        <Slider value={[wm.rotation]} onValueChange={(v) => updateWatermark(activeId, { rotation: v[0] })} min={-180} max={180} />
                        <div className="flex gap-2 mt-2">
                          <Button onClick={() => {
                            setWatermarks((prev) => [
                              ...prev,
                              { ...wm, id: crypto.randomUUID(), x: wm.x + 20, y: wm.y + 20 },
                            ]);
                            notify.success('Watermark duplicated!');
                          }}>
                            <Copy className="w-4 h-4 mr-1" /> Duplicate
                          </Button>
                          <Button variant="destructive" onClick={() => {
                            setWatermarks((prev) => prev.filter((w) => w.id !== activeId));
                            setActiveId(null);
                            notify.success('Watermark deleted!');
                          }}>
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            </div>

            {/* Download Button */}
            <div className="mt-4 flex justify-center">
              <Button
                onClick={generateFinalImage}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  generateFinalImage()
                }}
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" /> Download Watermarked Image
              </Button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

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

  // ------------------- Upload Handlers -------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
      notify.success("Image uploaded successfully!");
    };
    reader.onerror = () => notify.error("Failed to upload image");
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setWatermarks((prev) =>
        prev.map((wm) =>
          wm.id === id ? { ...wm, src: ev.target?.result as string } : wm
        )
      );
      notify.success("Logo uploaded successfully!");
    };
    reader.onerror = () => notify.error("Failed to upload logo");
    reader.readAsDataURL(file);
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
    notify.success(`${type === "text" ? "Text" : "Image"} watermark added!`);
  };

  const removeAll = () => {
    if (watermarks.length === 0) {
      notify.error("No watermarks to remove");
      return;
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
          <Input type="file" accept="image/*" onChange={handleImageUpload} />
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
                        accept="image/*"
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
                      <div id="watermark-popup" className="fixed inset-x-0 bottom-0 z-50">
                        <Card className={`border-t rounded-t-xl shadow-xl bg-white/95 backdrop-blur transition-transform duration-300 ${sheetCollapsed ? 'translate-y-[calc(100%-3rem)]' : 'translate-y-0'}`}>
                          <div className="flex items-center justify-between px-4 pt-3">
                            <div className="text-sm font-medium truncate max-w-[70%]">
                              {wm.type === 'text' ? (wm.text ? wm.text.slice(0,30) : 'Text') : 'Image'} settings
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setSheetCollapsed(c => !c)}>{sheetCollapsed ? 'Expand' : 'Collapse'}</Button>
                              <Button size="sm" variant="ghost" onClick={() => setActiveId(null)}><X className="w-4 h-4" /></Button>
                            </div>
                          </div>
                          {!sheetCollapsed && (
                            <CardContent className="pt-2 pb-4 space-y-3 overflow-y-auto max-h-[45vh]">
                              {wm.type === 'text' && (
                                <div className="space-y-2">
                                  <Label className="text-xs">Text</Label>
                                  <Textarea
                                    rows={2}
                                    value={wm.text}
                                    onChange={(e) => updateWatermark(activeId, { text: e.target.value })}
                                    className="text-sm"
                                  />
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Color</Label>
                                    <Input
                                      type="color"
                                      value={wm.color}
                                      onChange={(e) => updateWatermark(activeId, { color: e.target.value })}
                                      className="h-8 p-1 w-16"
                                    />
                                  </div>
                                </div>
                              )}
                              {wm.type === 'image' && !wm.src && (
                                <div>
                                  <Label className="text-xs">Upload Logo</Label>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleLogoUpload(activeId, e)}
                                    className="text-xs"
                                  />
                                </div>
                              )}
                              <div className="space-y-2">
                                <Label className="text-xs">Opacity: {wm.opacity}%</Label>
                                <Slider value={[wm.opacity]} onValueChange={(v) => updateWatermark(activeId, { opacity: v[0] })} min={10} max={100} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Scale: {wm.scale.toFixed(2)}</Label>
                                <Slider value={[wm.scale]} onValueChange={(v) => updateWatermark(activeId, { scale: v[0] })} min={0.2} max={3} step={0.1} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Rotation: {wm.rotation}°</Label>
                                <Slider value={[wm.rotation]} onValueChange={(v) => updateWatermark(activeId, { rotation: v[0] })} min={-180} max={180} />
                              </div>
                              <div className="flex flex-wrap gap-2 pt-2">
                                <Button size="sm" onClick={() => {
                                  setWatermarks((prev) => [
                                    ...prev,
                                    { ...wm, id: crypto.randomUUID(), x: wm.x + 20, y: wm.y + 20 },
                                  ]);
                                  notify.success('Watermark duplicated!');
                                }}>
                                  <Copy className="w-4 h-4 mr-1" /> Duplicate
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => {
                                  setWatermarks((prev) => prev.filter((w) => w.id !== activeId));
                                  setActiveId(null);
                                  notify.success('Watermark deleted!');
                                }}>
                                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                                </Button>
                              </div>
                            </CardContent>
                          )}
                        </Card>
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
                            <Textarea rows={2} value={wm.text} onChange={(e) => updateWatermark(activeId, { text: e.target.value })} />
                            <Label>Color</Label>
                            <Input type="color" value={wm.color} onChange={(e) => updateWatermark(activeId, { color: e.target.value })} />
                          </div>
                        )}
                        {wm.type === 'image' && !wm.src && (
                          <div>
                            <Label>Upload Logo</Label>
                            <Input type="file" accept="image/*" onChange={(e) => handleLogoUpload(activeId, e)} />
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

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Download, Type, Image as ImageIcon, Trash2, Copy, X } from "lucide-react";

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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wmRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // ------------------- Event Handlers -------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setWatermarks((prev) =>
        prev.map((wm) => (wm.id === id ? { ...wm, src: ev.target?.result as string } : wm))
      );
    reader.readAsDataURL(file);
  };

  const addWatermark = (type: "text" | "image") => {
    const newWM: Watermark = {
      id: crypto.randomUUID(),
      type,
      text: type === "text" ? "Your Text" : undefined,
      src: type === "image" ? undefined : undefined,
      x: 150,
      y: 150,
      scale: 1,
      rotation: 0,
      opacity: 100,
      color: "#000000",
    };
    setWatermarks((prev) => [...prev, newWM]);
    setActiveId(newWM.id);
  };

  const removeAll = () => {
    setWatermarks([]);
    setActiveId(null);
  };

  const updateWatermark = (id: string, changes: Partial<Watermark>) => {
    setWatermarks((prev) => prev.map((wm) => (wm.id === id ? { ...wm, ...changes } : wm)));
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingId(id);
    setLastPos({ x: e.clientX, y: e.clientY });
    setActiveId(id);
  };

  const handleMouseMove = (e: MouseEvent) => {
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

  const handleMouseUp = () => setDraggingId(null);

  const handleClickOutside = (e: MouseEvent) => {
    if (!containerRef.current || !activeId) return;
    const target = e.target as Node;
    const activeWMEl = wmRefs.current[activeId];
    const popup = document.querySelector("#watermark-popup");
    if (activeWMEl && !activeWMEl.contains(target) && popup && !popup.contains(target)) {
      setActiveId(null);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [draggingId, lastPos, activeId]);

  // ------------------- Generate Final Image -------------------
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

      // Draw all watermarks
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
          ctx.restore();
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
              ctx.restore();
              resolve();
            };
            img.src = wm.src!;
          });
        }
      }

      // Trigger download after all watermarks are drawn
      const link = document.createElement("a");
      link.download = "watermarked-image.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
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
          <CardContent className="flex gap-2">
            <Button onClick={() => addWatermark("text")}>
              <Type className="w-4 h-4 mr-2 inline" /> Add Text
            </Button>
            <Button onClick={() => addWatermark("image")}>
              <ImageIcon className="w-4 h-4 mr-2 inline" /> Add Logo
            </Button>
            <Button variant="destructive" onClick={removeAll}>
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
            <div
              ref={containerRef}
              className="relative inline-block border rounded-lg overflow-hidden"
            >
              <img src={selectedImage} alt="Uploaded" className="max-w-full block" />
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
                  }}
                  onMouseDown={(e) => handleMouseDown(e, wm.id)}
                  onClick={() => setActiveId(wm.id)}
                >
                  {wm.type === "text" ? (
                    <span>{wm.text}</span>
                  ) : wm.src ? (
                    <img src={wm.src} alt="logo" className="w-32 h-32 object-contain" draggable={false} />
                  ) : (
                    <Input type="file" accept="image/*" onChange={(e) => handleLogoUpload(wm.id, e)} />
                  )}
                </div>
              ))}

              {/* Popup */}
              {activeId && draggingId === null && (() => {
                const wm = watermarks.find((w) => w.id === activeId);
                if (!wm || !containerRef.current) return null;
                const wmEl = wmRefs.current[wm.id];
                if (!wmEl) return null;

                const containerRect = containerRef.current.getBoundingClientRect();
                const wmRect = wmEl.getBoundingClientRect();

                let popupLeft = wmRect.right - containerRect.left + 10;
                let popupTop = wmRect.top - containerRect.top + wmRect.height / 2;
                const popupWidth = 320;
                const popupHeight = 400;

                if (popupLeft + popupWidth > containerRect.width) popupLeft = wmRect.left - containerRect.left - popupWidth - 10;
                if (popupLeft < 0) popupLeft = 10;
                if (popupTop - popupHeight / 2 < 0) popupTop = popupHeight / 2 + 10;
                if (popupTop + popupHeight / 2 > containerRect.height) popupTop = containerRect.height - popupHeight / 2 - 10;

                return (
                  <Card
                    id="watermark-popup"
                    className="absolute z-50 p-4 w-80 shadow-lg"
                    style={{ left: popupLeft, top: popupTop, transform: "translate(0, -50%)" }}
                  >
                    <div className="flex justify-end mb-2">
                      <X className="cursor-pointer" onClick={() => setActiveId(null)} />
                    </div>
                    <CardContent className="space-y-3">
                      {wm.type === "text" && (
                        <div>
                          <Label>Text</Label>
                          <Textarea
                            rows={2}
                            value={wm.text}
                            onChange={(e) => updateWatermark(activeId, { text: e.target.value })}
                          />
                          <Label>Color</Label>
                          <Input
                            type="color"
                            value={wm.color}
                            onChange={(e) => updateWatermark(activeId, { color: e.target.value })}
                          />
                        </div>
                      )}
                      {wm.type === "image" && !wm.src && (
                        <div>
                          <Label>Upload Logo</Label>
                          <Input type="file" accept="image/*" onChange={(e) => handleLogoUpload(activeId, e)} />
                        </div>
                      )}
                      <Label>Opacity: {wm.opacity}%</Label>
                      <Slider
                        value={[wm.opacity]}
                        onValueChange={(v) => updateWatermark(activeId, { opacity: v[0] })}
                        min={10}
                        max={100}
                      />
                      <Label>Scale: {wm.scale.toFixed(2)}</Label>
                      <Slider
                        value={[wm.scale]}
                        onValueChange={(v) => updateWatermark(activeId, { scale: v[0] })}
                        min={0.2}
                        max={3}
                        step={0.1}
                      />
                      <Label>Rotation: {wm.rotation}°</Label>
                      <Slider
                        value={[wm.rotation]}
                        onValueChange={(v) => updateWatermark(activeId, { rotation: v[0] })}
                        min={-180}
                        max={180}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() =>
                            setWatermarks((prev) => [
                              ...prev,
                              { ...wm, id: crypto.randomUUID(), x: wm.x + 20, y: wm.y + 20 },
                            ])
                          }
                        >
                          <Copy className="w-4 h-4 mr-1" /> Duplicate
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setWatermarks((prev) => prev.filter((w) => w.id !== activeId))}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>

            <div className="mt-4 flex justify-center">
              <Button onClick={generateFinalImage} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" /> Download Watermarked Image
              </Button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

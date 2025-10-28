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
import { Download, RotateCcw, Upload, Plus, Trash2 } from "lucide-react";

interface TextBox {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  stroke: string;
  strokeWidth: number;
  rotation: number; // degrees
  fontFamily: string;
}

interface MemeTemplate {
  id: string;
  name: string;
  url: string;
}

const MEME_TEMPLATES: MemeTemplate[] = [
  { id: "drake", name: "Drake Pointing", url: "/memes/drake.jpg" },
  { id: "distracted", name: "Distracted Boyfriend", url: "/memes/distracted.jpg" },
  { id: "woman", name: "Woman Yelling at Cat", url: "/memes/woman.jpg" },
  { id: "change", name: "Change My Mind", url: "/memes/change.jpg" },
  { id: "two", name: "Two Buttons", url: "/memes/two.jpg" },
  { id: "roll", name: "Roll Safe", url: "/memes/roll.jpg" },
];

const FONT_FAMILIES = ["Impact", "Arial", "Comic Sans MS", "Verdana", "Tahoma"];

export const MemeGenerator = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate>(MEME_TEMPLATES[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([
    { id: "1", text: "TOP TEXT", x: 250, y: 50, fontSize: 40, color: "#ffffff", stroke: "#000000", strokeWidth: 3, rotation: 0, fontFamily: "Impact" },
    { id: "2", text: "BOTTOM TEXT", x: 250, y: 450, fontSize: 40, color: "#ffffff", stroke: "#000000", strokeWidth: 3, rotation: 0, fontFamily: "Impact" },
  ]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });

  /** Draw Meme */
  const drawMeme = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = customImage || selectedTemplate.url;
    img.onload = () => {
      const scale = Math.min(600 / img.width, 600 / img.height);
      const width = img.width * scale;
      const height = img.height * scale;

      canvas.width = width;
      canvas.height = height;
      setCanvasSize({ width, height });

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      textBoxes.forEach((box) => {
        ctx.save();
        ctx.translate(box.x, box.y);
        ctx.rotate((box.rotation * Math.PI) / 180);
        ctx.font = `bold ${box.fontSize}px ${box.fontFamily}, Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = box.strokeWidth;
        ctx.strokeStyle = box.stroke;
        ctx.fillStyle = box.color;
        ctx.strokeText(box.text, 0, 0);
        ctx.fillText(box.text, 0, 0);
        ctx.restore();
      });
    };
  }, [selectedTemplate, customImage, textBoxes]);

  useEffect(() => {
    drawMeme();
  }, [drawMeme]);

  /** Drag Handlers */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedBox = textBoxes.find(
      (t) =>
        Math.abs(x - t.x) < t.text.length * (t.fontSize / 3) &&
        Math.abs(y - t.y) < t.fontSize
    );
    if (clickedBox) {
      setActiveTextId(clickedBox.id);
      setDragOffset({ x: x - clickedBox.x, y: y - clickedBox.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTextId || !dragOffset) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setTextBoxes((prev) =>
      prev.map((t) => (t.id === activeTextId ? { ...t, x, y } : t))
    );
  };

  const handleMouseUp = () => {
    setActiveTextId(null);
    setDragOffset(null);
  };

  /** Add/Delete Text */
  const addTextBox = () => {
    setTextBoxes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: "NEW TEXT",
        x: canvasSize.width / 2,
        y: canvasSize.height / 2,
        fontSize: 40,
        color: "#ffffff",
        stroke: "#000000",
        strokeWidth: 3,
        rotation: 0,
        fontFamily: "Impact",
      },
    ]);
  };

  const deleteTextBox = (id: string) => {
    setTextBoxes((prev) => prev.filter((t) => t.id !== id));
  };

  /** Upload Image */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCustomImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  /** Download Meme High-Res */
  const downloadMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // create high-res canvas
    const scale = 3;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width * scale;
    exportCanvas.height = canvas.height * scale;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = customImage || selectedTemplate.url;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, exportCanvas.width, exportCanvas.height);
      textBoxes.forEach((box) => {
        ctx.save();
        ctx.translate(box.x * scale, box.y * scale);
        ctx.rotate((box.rotation * Math.PI) / 180);
        ctx.font = `bold ${box.fontSize * scale}px ${box.fontFamily}, Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = box.strokeWidth * scale;
        ctx.strokeStyle = box.stroke;
        ctx.fillStyle = box.color;
        ctx.strokeText(box.text, 0, 0);
        ctx.fillText(box.text, 0, 0);
        ctx.restore();
      });

      const link = document.createElement("a");
      link.download = "meme.png";
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
    };
  };

  /** Reset Meme */
  const resetMeme = () => {
    setTextBoxes([
      { id: "1", text: "TOP TEXT", x: 250, y: 50, fontSize: 40, color: "#ffffff", stroke: "#000000", strokeWidth: 3, rotation: 0, fontFamily: "Impact" },
      { id: "2", text: "BOTTOM TEXT", x: 250, y: 450, fontSize: 40, color: "#ffffff", stroke: "#000000", strokeWidth: 3, rotation: 0, fontFamily: "Impact" },
    ]);
    setCustomImage(null);
    setSelectedTemplate(MEME_TEMPLATES[0]);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>🔥 Meme Generator Pro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template selection */}
          <div className="space-y-2">
            <Label>Template</Label>
            <Select
              value={selectedTemplate.id}
              onValueChange={(value) => {
                const t = MEME_TEMPLATES.find((tpl) => tpl.id === value);
                if (t) {
                  setSelectedTemplate(t);
                  setCustomImage(null);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {MEME_TEMPLATES.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={handleUpload} />
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> Upload
              </Button>
            </div>
          </div>

          {/* Text layers */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Text Layers</Label>
              <Button onClick={addTextBox} size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Text
              </Button>
            </div>
            {textBoxes.map((box) => (
              <div key={box.id} className="p-3 border rounded-lg space-y-2 bg-muted">
                <div className="flex justify-between items-center">
                  <Input
                    value={box.text}
                    onChange={(e) =>
                      setTextBoxes((prev) =>
                        prev.map((tb) => tb.id === box.id ? { ...tb, text: e.target.value } : tb)
                      )
                    }
                    className="flex-1"
                  />
                  <Button onClick={() => deleteTextBox(box.id)} variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label>Font Size</Label>
                    <Slider
                      min={20} max={80} step={2} value={[box.fontSize]}
                      onValueChange={(v) => setTextBoxes((prev) =>
                        prev.map((tb) => tb.id === box.id ? { ...tb, fontSize: v[0] } : tb)
                      )}
                    />
                  </div>
                  <div>
                    <Label>Text Color</Label>
                    <Input type="color" value={box.color} onChange={(e) =>
                      setTextBoxes((prev) =>
                        prev.map((tb) => tb.id === box.id ? { ...tb, color: e.target.value } : tb)
                      )
                    }/>
                  </div>
                  <div>
                    <Label>Stroke Color</Label>
                    <Input type="color" value={box.stroke} onChange={(e) =>
                      setTextBoxes((prev) =>
                        prev.map((tb) => tb.id === box.id ? { ...tb, stroke: e.target.value } : tb)
                      )
                    }/>
                  </div>
                  <div>
                    <Label>Rotation</Label>
                    <Slider min={0} max={360} step={1} value={[box.rotation]} onValueChange={(v) =>
                      setTextBoxes((prev) =>
                        prev.map((tb) => tb.id === box.id ? { ...tb, rotation: v[0] } : tb)
                      )
                    }/>
                  </div>
                </div>
                <div>
                  <Label>Font</Label>
                  <Select value={box.fontFamily} onValueChange={(v) =>
                    setTextBoxes((prev) =>
                      prev.map((tb) => tb.id === box.id ? { ...tb, fontFamily: v } : tb)
                    )
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Font" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadMeme} className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button onClick={resetMeme} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Canvas Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Meme Preview (Drag text to move)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-muted flex justify-center">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="cursor-move rounded shadow"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState, useRef, useEffect } from "react";
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
  Upload,
  Plus,
  Trash2,
} from "lucide-react";

const MEME_TEMPLATES = [
  { id: "drake", name: "Drake Pointing", url: "https://i.imgflip.com/30b1.jpg" },
  { id: "distracted", name: "Distracted Boyfriend", url: "https://i.imgflip.com/1ur9b0.jpg" },
  { id: "woman", name: "Woman Yelling at Cat", url: "https://i.imgflip.com/345v97.jpg" },
  { id: "change", name: "Change My Mind", url: "https://i.imgflip.com/24y43o.jpg" },
  { id: "two", name: "Two Buttons", url: "https://i.imgflip.com/1g8my4.jpg" },
  { id: "roll", name: "Roll Safe", url: "https://i.imgflip.com/1h7in3.jpg" },
];

interface TextBox {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  stroke: string;
  strokeWidth: number;
}

export const MemeGenerator = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(MEME_TEMPLATES[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([
    { id: "1", text: "TOP TEXT", x: 150, y: 50, fontSize: 40, color: "#FFFFFF", stroke: "#000000", strokeWidth: 3 },
    { id: "2", text: "BOTTOM TEXT", x: 150, y: 350, fontSize: 40, color: "#FFFFFF", stroke: "#000000", strokeWidth: 3 },
  ]);
  const [activeText, setActiveText] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState({ width: 500, height: 500 });

  /** Helper: draw meme on canvas */
  const drawMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = customImage || selectedTemplate.url;
    img.onload = () => {
      const scale = 600 / img.width;
      const width = img.width * scale;
      const height = img.height * scale;
      setImageSize({ width, height });
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      textBoxes.forEach((box) => {
        ctx.font = `bold ${box.fontSize}px Impact, Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.lineJoin = "round";
        ctx.lineWidth = box.strokeWidth;
        ctx.strokeStyle = box.stroke;
        ctx.fillStyle = box.color;
        ctx.strokeText(box.text, box.x, box.y);
        ctx.fillText(box.text, box.x, box.y);
      });
    };
  };

  useEffect(() => {
    drawMeme();
  }, [selectedTemplate, customImage, textBoxes]);

  /** Handle drag of text */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // detect clicked text
    const clicked = textBoxes.find(
      (t) =>
        Math.abs(x - t.x) < t.text.length * (t.fontSize / 3) &&
        Math.abs(y - t.y) < t.fontSize
    );
    if (clicked) {
      setActiveText(clicked.id);
      setDragOffset({ x: x - clicked.x, y: y - clicked.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeText || !dragOffset) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setTextBoxes((prev) =>
      prev.map((t) => (t.id === activeText ? { ...t, x, y } : t))
    );
  };

  const handleMouseUp = () => setActiveText(null);

  /** Add new text box */
  const addTextBox = () => {
    setTextBoxes((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        text: "NEW TEXT",
        x: imageSize.width / 2,
        y: imageSize.height / 2,
        fontSize: 40,
        color: "#FFFFFF",
        stroke: "#000000",
        strokeWidth: 3,
      },
    ]);
  };

  const deleteTextBox = (id: string) =>
    setTextBoxes((prev) => prev.filter((t) => t.id !== id));

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCustomImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const downloadMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "meme.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const resetMeme = () => {
    setTextBoxes([]);
    setCustomImage(null);
    setSelectedTemplate(MEME_TEMPLATES[0]);
  };

  /** Render */
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔥 Meme Generator Pro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template + Upload */}
          <div className="space-y-2">
            <Label>Template</Label>
            <Select
              value={selectedTemplate.id}
              onValueChange={(value) => {
                const t = MEME_TEMPLATES.find((tpl) => tpl.id === value);
                if (t) setSelectedTemplate(t);
                setCustomImage(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {MEME_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
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

          {/* Text Boxes */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Text Layers</Label>
              <Button onClick={addTextBox} size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Text
              </Button>
            </div>
            {textBoxes.map((t) => (
              <div key={t.id} className="p-3 border rounded-lg space-y-2 bg-muted">
                <div className="flex justify-between items-center">
                  <Input
                    value={t.text}
                    onChange={(e) =>
                      setTextBoxes((prev) =>
                        prev.map((tb) =>
                          tb.id === t.id ? { ...tb, text: e.target.value } : tb
                        )
                      )
                    }
                    className="flex-1"
                  />
                  <Button
                    onClick={() => deleteTextBox(t.id)}
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Font Size</Label>
                    <Slider
                      min={20}
                      max={80}
                      step={2}
                      value={[t.fontSize]}
                      onValueChange={(v) =>
                        setTextBoxes((prev) =>
                          prev.map((tb) =>
                            tb.id === t.id ? { ...tb, fontSize: v[0] } : tb
                          )
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Text</Label>
                    <Input
                      type="color"
                      value={t.color}
                      onChange={(e) =>
                        setTextBoxes((prev) =>
                          prev.map((tb) =>
                            tb.id === t.id ? { ...tb, color: e.target.value } : tb
                          )
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Stroke</Label>
                    <Input
                      type="color"
                      value={t.stroke}
                      onChange={(e) =>
                        setTextBoxes((prev) =>
                          prev.map((tb) =>
                            tb.id === t.id ? { ...tb, stroke: e.target.value } : tb
                          )
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
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

      {/* Canvas */}
      <Card>
        <CardHeader>
          <CardTitle>Meme Preview (Drag to Move Text)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-muted flex justify-center">
            <canvas
              ref={canvasRef}
              width={imageSize.width}
              height={imageSize.height}
              className="cursor-move rounded shadow"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

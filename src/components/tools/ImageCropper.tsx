import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RotateCcw, Upload, Crop } from "lucide-react";

export const ImageCropper = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [aspectRatio, setAspectRatio] = useState("free");
  const [outputFormat, setOutputFormat] = useState("png");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const aspectRatios = [
    { label: "Free", value: "free" },
    { label: "1:1 (Square)", value: "1:1" },
    { label: "4:3", value: "4:3" },
    { label: "16:9", value: "16:9" },
    { label: "3:2", value: "3:2" },
    { label: "2:1", value: "2:1" },
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        // Reset crop area to center
        setCropArea({ x: 0, y: 0, width: 100, height: 100 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedImage) return;
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedImage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newWidth = Math.abs(x - dragStart.x);
    const newHeight = Math.abs(y - dragStart.y);
    
    // Apply aspect ratio if not free
    if (aspectRatio !== "free") {
      const [w, h] = aspectRatio.split(":").map(Number);
      const ratio = w / h;
      
      if (newWidth / newHeight > ratio) {
        setCropArea({
          x: Math.min(dragStart.x, x),
          y: Math.min(dragStart.y, y),
          width: newHeight * ratio,
          height: newHeight
        });
      } else {
        setCropArea({
          x: Math.min(dragStart.x, x),
          y: Math.min(dragStart.y, y),
          width: newWidth,
          height: newWidth / ratio
        });
      }
    } else {
      setCropArea({
        x: Math.min(dragStart.x, x),
        y: Math.min(dragStart.y, y),
        width: newWidth,
        height: newHeight
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const cropImage = () => {
    if (!selectedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to crop area
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      // Draw the cropped portion
      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );
    };
    img.src = selectedImage;
  };

  const downloadCroppedImage = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `cropped-image.${outputFormat}`;
    link.href = canvasRef.current.toDataURL(`image/${outputFormat}`);
    link.click();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Cropper</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
              />
              <Button variant="outline" onClick={clearImage}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
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
              <Label htmlFor="output-format">Output Format</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
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

          {selectedImage && (
            <div className="space-y-4">
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="Uploaded"
                  className="max-w-full h-auto"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                />
                {isDragging && (
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
                    style={{
                      left: Math.min(cropArea.x, dragStart.x),
                      top: Math.min(cropArea.y, dragStart.y),
                      width: Math.abs(cropArea.width),
                      height: Math.abs(cropArea.height),
                    }}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">X:</span>
                  <span className="ml-2 font-medium">{Math.round(cropArea.x)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Y:</span>
                  <span className="ml-2 font-medium">{Math.round(cropArea.y)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Width:</span>
                  <span className="ml-2 font-medium">{Math.round(cropArea.width)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Height:</span>
                  <span className="ml-2 font-medium">{Math.round(cropArea.height)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={cropImage} className="flex items-center gap-2">
                  <Crop className="h-4 w-4" />
                  Crop Image
                </Button>
                <Button onClick={downloadCroppedImage} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cropped Image Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-muted">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border rounded"
              style={{ display: 'block', margin: '0 auto' }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cropping Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Click and drag to select the area you want to crop</li>
            <li>• Use aspect ratio presets for consistent sizing</li>
            <li>• PNG format preserves transparency, JPEG is smaller for photos</li>
            <li>• Higher resolution images will produce better quality crops</li>
            <li>• The crop area is shown with a blue overlay while dragging</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

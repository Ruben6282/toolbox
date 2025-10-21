import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export const ImageResizer = () => {
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string>("");
  const [resizedPreview, setResizedPreview] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load image when uploaded
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setWidth(img.width);
        setHeight(img.height);
        setOriginalPreview(reader.result as string);
        toast.success("Image loaded!");
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Maintain aspect ratio
  const handleWidthChange = (value: string) => {
    const newWidth = Number(value);
    if (!originalImage) return setWidth(newWidth);
    if (aspectRatioLocked) {
      const ratio = originalImage.height / originalImage.width;
      setHeight(Math.round(newWidth * ratio));
    }
    setWidth(newWidth);
  };

  const handleHeightChange = (value: string) => {
    const newHeight = Number(value);
    if (!originalImage) return setHeight(newHeight);
    if (aspectRatioLocked) {
      const ratio = originalImage.width / originalImage.height;
      setWidth(Math.round(newHeight * ratio));
    }
    setHeight(newHeight);
  };

  // Update resized preview whenever size changes
  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(originalImage, 0, 0, width, height);
    setResizedPreview(canvas.toDataURL("image/png"));
  }, [width, height, originalImage]);

  // Download resized image
  const handleDownload = () => {
    if (!resizedPreview) {
      toast.error("No resized image to download!");
      return;
    }
    const link = document.createElement("a");
    link.href = resizedPreview;
    link.download = "resized-image.png";
    link.click();
    toast.success("Image downloaded!");
  };

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-12">
            <label className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload image</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Resize Options */}
      {originalImage && (
        <Card>
          <CardHeader>
            <CardTitle>Resize Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Width (px)</Label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Height (px)</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => handleHeightChange(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={aspectRatioLocked}
                onChange={(e) => setAspectRatioLocked(e.target.checked)}
              />
              <Label>Lock aspect ratio</Label>
            </div>

            <Button onClick={handleDownload} className="w-full">
              Download Resized Image
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview section */}
      {originalPreview && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Original Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={originalPreview}
                alt="Original Preview"
                className="mx-auto rounded-lg max-h-[400px] object-contain"
              />
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {originalImage?.width} × {originalImage?.height}px
              </p>
            </CardContent>
          </Card>

          {resizedPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Resized Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={resizedPreview}
                  alt="Resized Preview"
                  className="mx-auto rounded-lg max-h-[400px] object-contain"
                />
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  {width} × {height}px
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

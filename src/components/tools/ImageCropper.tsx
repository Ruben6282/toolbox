import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RotateCcw, Crop } from "lucide-react";
import { notify } from "@/lib/notify";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageCropper = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const [aspectRatio, setAspectRatio] = useState("free");
  const [outputFormat, setOutputFormat] = useState("png");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<null | string>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const aspectRatios = [
    { label: "Free", value: "free" },
    { label: "1:1 (Square)", value: "1:1" },
    { label: "4:3", value: "4:3" },
    { label: "16:9", value: "16:9" },
    { label: "3:2", value: "3:2" },
    { label: "2:1", value: "2:1" },
  ];

  // Clamp crop area within image boundaries
  const clampCrop = (crop: CropArea) => {
    if (!imageRef.current) return crop;
    const img = imageRef.current;
    const x = Math.max(0, Math.min(crop.x, img.width - crop.width));
    const y = Math.max(0, Math.min(crop.y, img.height - crop.height));
    const width = Math.min(crop.width, img.width - x);
    const height = Math.min(crop.height, img.height - y);
    return { x, y, width, height };
  };

  // Adjust crop area to aspect ratio and optionally center
  const adjustCropToAspect = (crop: CropArea, ratio: string, center = true, shrink = false) => {
    if (ratio === "free") return clampCrop(crop);
    if (!imageRef.current) return crop;

    const img = imageRef.current;
    const [w, h] = ratio.split(":").map(Number);
    const r = w / h;

    let width = crop.width;
    let height = crop.height;

    // Shrink default crop area to ~60% of image for easier resizing
    if (shrink) {
      width = img.width * 0.6;
      height = width / r;
      if (height > img.height * 0.6) {
        height = img.height * 0.6;
        width = height * r;
      }
    }

    if (width / height > r) height = width / r;
    else width = height * r;

    // Ensure it fits in image
    if (width > img.width) {
      width = img.width;
      height = width / r;
    }
    if (height > img.height) {
      height = img.height;
      width = height * r;
    }

    const x = center
      ? Math.max(0, Math.min((img.width - width) / 2, img.width - width))
      : Math.max(0, Math.min(crop.x, img.width - width));
    const y = center
      ? Math.max(0, Math.min((img.height - height) / 2, img.height - height))
      : Math.max(0, Math.min(crop.y, img.height - height));

    return { x, y, width, height };
  };

  // Adjust crop area on aspect ratio change
  useEffect(() => {
    setCropArea((prev) => adjustCropToAspect(prev, aspectRatio));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imgSrc = ev.target?.result as string;
      setSelectedImage(imgSrc);
      setTimeout(() => {
        if (!imageRef.current) return;
        const img = imageRef.current;
        let initialCrop: CropArea = { x: 0, y: 0, width: img.width, height: img.height };
        if (aspectRatio !== "free") initialCrop = adjustCropToAspect(initialCrop, aspectRatio, true, true);
        setCropArea(initialCrop);
        notify.success("Image uploaded successfully!");
      }, 50);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    if (!selectedImage || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
    setDragStart({ x, y });
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent, handle?: string) => {
    if (!selectedImage || !containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
    setDragStart({ x, y });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedImage || (!isDragging && !isResizing) || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    let newCrop = { ...cropArea };

    if (isDragging) {
      const dx = mouseX - dragStart.x;
      const dy = mouseY - dragStart.y;
      newCrop.x = cropArea.x + dx;
      newCrop.y = cropArea.y + dy;
      newCrop = clampCrop(newCrop);
      setDragStart({ x: mouseX, y: mouseY });
    }

    if (isResizing && resizeHandle) {
      const { x, y, width, height } = newCrop;
      const minSize = 20;

      // Determine resizing direction
      const isLeft = resizeHandle.includes("left");
      const isRight = resizeHandle.includes("right");
      const isTop = resizeHandle.includes("top");
      const isBottom = resizeHandle.includes("bottom");

      let newWidth = width;
      let newHeight = height;
      let newX = x;
      let newY = y;

      if (isRight) newWidth = Math.max(minSize, mouseX - x);
      if (isBottom) newHeight = Math.max(minSize, mouseY - y);
      if (isLeft) {
        newWidth = Math.max(minSize, width + (x - mouseX));
        newX = mouseX;
      }
      if (isTop) {
        newHeight = Math.max(minSize, height + (y - mouseY));
        newY = mouseY;
      }

      if (aspectRatio !== "free") {
        const [w, h] = aspectRatio.split(":").map(Number);
        const r = w / h;
        if (newWidth / newHeight > r) newHeight = newWidth / r;
        else newWidth = newHeight * r;
      }

      newCrop = clampCrop({ x: newX, y: newY, width: newWidth, height: newHeight });
    }

    setCropArea(newCrop);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!selectedImage || (!isDragging && !isResizing) || !containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    let newCrop = { ...cropArea };

    if (isDragging) {
      const dx = touchX - dragStart.x;
      const dy = touchY - dragStart.y;
      newCrop.x = cropArea.x + dx;
      newCrop.y = cropArea.y + dy;
      newCrop = clampCrop(newCrop);
      setDragStart({ x: touchX, y: touchY });
    }

    if (isResizing && resizeHandle) {
      const { x, y, width, height } = newCrop;
      const minSize = 20;

      // Determine resizing direction
      const isLeft = resizeHandle.includes("left");
      const isRight = resizeHandle.includes("right");
      const isTop = resizeHandle.includes("top");
      const isBottom = resizeHandle.includes("bottom");

      let newWidth = width;
      let newHeight = height;
      let newX = x;
      let newY = y;

      if (isRight) newWidth = Math.max(minSize, touchX - x);
      if (isBottom) newHeight = Math.max(minSize, touchY - y);
      if (isLeft) {
        newWidth = Math.max(minSize, width + (x - touchX));
        newX = touchX;
      }
      if (isTop) {
        newHeight = Math.max(minSize, height + (y - touchY));
        newY = touchY;
      }

      if (aspectRatio !== "free") {
        const [w, h] = aspectRatio.split(":").map(Number);
        const r = w / h;
        if (newWidth / newHeight > r) newHeight = newWidth / r;
        else newWidth = newHeight * r;
      }

      newCrop = clampCrop({ x: newX, y: newY, width: newWidth, height: newHeight });
    }

    setCropArea(newCrop);
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const cropImage = () => {
    if (!selectedImage || !canvasRef.current || !imageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = cropArea.width * scaleX;
    canvas.height = cropArea.height * scaleY;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  const downloadCroppedImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `cropped-image.${outputFormat}`;
    link.href = canvasRef.current.toDataURL(`image/${outputFormat}`);
    link.click();
    notify.success("Cropped image downloaded!");
  };

  const clearImage = () => {
    setSelectedImage(null);
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    notify.success("Image cleared!");
  };

  useEffect(() => {
    if (selectedImage) cropImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropArea, selectedImage, aspectRatio]);

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
              <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="flex-1" />
              <Button variant="outline" onClick={clearImage}>
                <RotateCcw className="h-4 w-4 mr-2" /> Clear
              </Button>
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
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
              <Label>Output Format</Label>
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

          {/* Image + crop */}
          {selectedImage && (
            <div className="space-y-4">
              <div
                ref={containerRef}
                className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden touch-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              >
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="Uploaded"
                  className="max-w-full h-auto"
                  onMouseDown={(e) => handleMouseDown(e)}
                  onTouchStart={(e) => handleTouchStart(e)}
                  style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
                />

                {/* Crop overlay */}
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
                  style={{
                    left: cropArea.x,
                    top: cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height,
                    touchAction: "none"
                  }}
                  onMouseDown={(e) => handleMouseDown(e)}
                  onTouchStart={(e) => handleTouchStart(e)}
                />

                {/* Resize handles */}
                {["top-left", "top-right", "bottom-left", "bottom-right"].map((handle) => (
                  <div
                    key={handle}
                    className="absolute w-8 h-8 sm:w-4 sm:h-4 bg-white border-2 border-blue-500 rounded-full cursor-pointer"
                    style={{
                      left: handle.includes("right") ? cropArea.x + cropArea.width - 16 : cropArea.x - 2,
                      top: handle.includes("bottom") ? cropArea.y + cropArea.height - 16 : cropArea.y - 2,
                      touchAction: "none"
                    }}
                    onMouseDown={(e) => handleMouseDown(e, handle)}
                    onTouchStart={(e) => handleTouchStart(e, handle)}
                  />
                ))}
              </div>

              {/* Crop info + actions */}
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
                <Button onClick={downloadCroppedImage} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" /> Download
                </Button>
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
            <canvas ref={canvasRef} className="max-w-full h-auto border rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  RotateCcw,
  ImageIcon,
  AlertCircle,
} from "lucide-react";

export const ImageFormatConverter = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalFormat, setOriginalFormat] = useState("");
  const [targetFormat, setTargetFormat] = useState("png");
  const [quality, setQuality] = useState(90);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formats = [
    { label: "PNG", value: "png", description: "Lossless compression, supports transparency" },
    { label: "JPEG", value: "jpeg", description: "Lossy compression, smaller file size" },
    { label: "WebP", value: "webp", description: "Modern format, good compression" },
    { label: "GIF", value: "gif", description: "Supports animation, limited colors" },
    { label: "BMP", value: "bmp", description: "Uncompressed bitmap format" },
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setConvertedImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setOriginalFormat(file.name.split(".").pop()?.toLowerCase() || "unknown");
    };
    reader.readAsDataURL(file);
  };

  const convertImage = () => {
    if (!selectedImage || !canvasRef.current) return;
    setLoading(true);
    setError(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Your browser doesn't support canvas.");
      setLoading(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const mimeType = `image/${targetFormat}`;
        const qualityValue = targetFormat === "jpeg" ? quality / 100 : undefined;
        const dataUrl = canvas.toDataURL(mimeType, qualityValue);
        setConvertedImage(dataUrl);
      } catch {
        setError("Conversion failed. Try another format.");
      }
      setLoading(false);
    };
    img.src = selectedImage;
  };

  const downloadConvertedImage = () => {
    if (!convertedImage) return;
    const link = document.createElement("a");
    link.download = `converted-image.${targetFormat}`;
    link.href = convertedImage;
    link.click();
  };

  const clearAll = () => {
    setSelectedImage(null);
    setConvertedImage(null);
    setOriginalFormat("");
    setError(null);
  };

  const getFileSize = (dataUrl: string) => {
    const base64 = dataUrl.split(",")[1];
    return Math.round((base64.length * 3) / 4);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8 max-w-8xl mx-auto">
      {/* --- Upload + Settings --- */}
      <Card>
        <CardHeader>
          <CardTitle>Image Format Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Upload */}
          <div className="space-y-2">
            <Label htmlFor="upload">Upload an Image</Label>
            <div className="flex gap-2">
              <Input
                id="upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
              />
              <Button variant="outline" onClick={clearAll}>
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
            </div>
          </div>

          {/* Format Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Original Format</Label>
              <Input
                value={originalFormat ? originalFormat.toUpperCase() : ""}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Convert To</Label>
              <Select value={targetFormat} onValueChange={setTargetFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* JPEG Quality Slider */}
          {targetFormat === "jpeg" && (
            <div className="space-y-2">
              <Label>Quality: {quality}%</Label>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher quality → larger file size
              </p>
            </div>
          )}

          {/* Format Info */}
          <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
            {formats.find((f) => f.value === targetFormat)?.description}
          </div>

          {/* Convert + Download */}
          <div className="flex gap-2">
            <Button
              onClick={convertImage}
              disabled={!selectedImage || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Progress value={70} className="w-16 mr-2" />
                  Converting...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" /> Convert
                </>
              )}
            </Button>

            <Button
              onClick={downloadConvertedImage}
              disabled={!convertedImage}
              variant={convertedImage ? "default" : "secondary"}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </div>

          {error && (
            <div className="flex items-center text-red-600 text-sm mt-2">
              <AlertCircle className="h-4 w-4 mr-1" /> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Preview Panels --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Original Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg bg-muted p-3 flex justify-center">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Original"
                  className="max-w-full h-auto rounded-md"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No image uploaded yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Converted Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg bg-muted p-3 flex justify-center">
              {convertedImage ? (
                <img
                  src={convertedImage}
                  alt="Converted"
                  className="max-w-full h-auto rounded-md"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No converted image yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Conversion Stats --- */}
      {convertedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {originalFormat.toUpperCase()}
                </div>
                <p className="text-sm text-muted-foreground">Original</p>
              </div>

              <div>
                <div className="text-2xl font-bold text-green-600">
                  {targetFormat.toUpperCase()}
                </div>
                <p className="text-sm text-muted-foreground">Converted</p>
              </div>

              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatFileSize(getFileSize(convertedImage))}
                </div>
                <p className="text-sm text-muted-foreground">File Size</p>
              </div>

              {targetFormat === "jpeg" && (
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {quality}%
                  </div>
                  <p className="text-sm text-muted-foreground">Quality</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

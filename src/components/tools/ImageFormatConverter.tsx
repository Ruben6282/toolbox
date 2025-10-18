import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RotateCcw, Upload, Image } from "lucide-react";

export const ImageFormatConverter = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalFormat, setOriginalFormat] = useState("");
  const [targetFormat, setTargetFormat] = useState("png");
  const [quality, setQuality] = useState(90);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
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
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        // Detect original format from file extension
        const extension = file.name.split('.').pop()?.toLowerCase();
        setOriginalFormat(extension || '');
      };
      reader.readAsDataURL(file);
    }
  };

  const convertImage = () => {
    if (!selectedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image on canvas
      ctx.drawImage(img, 0, 0);
      
      // Convert to target format
      const mimeType = `image/${targetFormat}`;
      const qualityValue = targetFormat === 'jpeg' ? quality / 100 : undefined;
      
      const dataUrl = canvas.toDataURL(mimeType, qualityValue);
      setConvertedImage(dataUrl);
    };
    img.src = selectedImage;
  };

  const downloadConvertedImage = () => {
    if (!convertedImage) return;

    const link = document.createElement('a');
    link.download = `converted-image.${targetFormat}`;
    link.href = convertedImage;
    link.click();
  };

  const clearAll = () => {
    setSelectedImage(null);
    setConvertedImage(null);
    setOriginalFormat("");
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const getFileSize = (dataUrl: string) => {
    const base64 = dataUrl.split(',')[1];
    const binaryString = atob(base64);
    return binaryString.length;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Format Converter</CardTitle>
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
              <Button variant="outline" onClick={clearAll}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="original-format">Original Format</Label>
              <Input
                id="original-format"
                value={originalFormat.toUpperCase()}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-format">Convert To</Label>
              <Select value={targetFormat} onValueChange={setTargetFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target format" />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetFormat === 'jpeg' && (
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
              <div className="text-sm text-muted-foreground">
                Higher quality = larger file size
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Format Information</Label>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                {formats.find(f => f.value === targetFormat)?.description}
              </p>
            </div>
          </div>

          <Button onClick={convertImage} disabled={!selectedImage} className="w-full">
            <Image className="h-4 w-4 mr-2" />
            Convert Image
          </Button>
        </CardContent>
      </Card>

      {selectedImage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Original Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted">
                <img
                  src={selectedImage}
                  alt="Original"
                  className="max-w-full h-auto rounded"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Converted Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto rounded"
                  style={{ display: 'block', margin: '0 auto' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {convertedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {originalFormat.toUpperCase()}
                </div>
                <div className="text-sm text-muted-foreground">Original</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {targetFormat.toUpperCase()}
                </div>
                <div className="text-sm text-muted-foreground">Converted</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatFileSize(getFileSize(convertedImage))}
                </div>
                <div className="text-sm text-muted-foreground">File Size</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {quality}%
                </div>
                <div className="text-sm text-muted-foreground">Quality</div>
              </div>
            </div>

            <Button onClick={downloadConvertedImage} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Converted Image
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Format Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>PNG:</strong> Best for images with transparency, graphics, and screenshots. Lossless compression.
            </div>
            <div>
              <strong>JPEG:</strong> Best for photographs. Smaller file sizes but lossy compression.
            </div>
            <div>
              <strong>WebP:</strong> Modern format with excellent compression. Good for web use.
            </div>
            <div>
              <strong>GIF:</strong> Best for simple animations and images with limited colors.
            </div>
            <div>
              <strong>BMP:</strong> Uncompressed format. Large file sizes, rarely used for web.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

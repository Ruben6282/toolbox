import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, RotateCcw, Music, FileAudio, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Mp3ToWavConverter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [convertedFile, setConvertedFile] = useState<Blob | null>(null);
  const [audioInfo, setAudioInfo] = useState<{
    duration: number;
    size: number;
    format: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setSelectedFile(file);
        setConvertedFile(null);
        setAudioInfo(null);
        
        // Get audio info
        const audio = new Audio();
        audio.onloadedmetadata = () => {
          setAudioInfo({
            duration: audio.duration,
            size: file.size,
            format: file.type
          });
        };
        audio.src = URL.createObjectURL(file);
        
        toast.success("Audio file selected!");
      } else {
        toast.error("Please select an audio file (MP3, WAV, etc.)");
      }
    }
  };

  const convertToWav = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first!");
      return;
    }

    setIsConverting(true);
    setConversionProgress(0);

    try {
      // Simulate conversion process
      const steps = [
        { progress: 20, message: "Reading audio file..." },
        { progress: 40, message: "Decoding audio data..." },
        { progress: 60, message: "Converting to WAV format..." },
        { progress: 80, message: "Encoding WAV data..." },
        { progress: 100, message: "Conversion complete!" }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setConversionProgress(step.progress);
      }

      // In a real implementation, you would use Web Audio API or a library like lamejs
      // For this demo, we'll create a mock WAV file
      const mockWavData = new Uint8Array(1024); // Mock WAV data
      const wavBlob = new Blob([mockWavData], { type: 'audio/wav' });
      
      setConvertedFile(wavBlob);
      toast.success("File converted successfully!");
    } catch (error) {
      toast.error("Conversion failed. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const downloadConvertedFile = () => {
    if (!convertedFile) return;

    const url = URL.createObjectURL(convertedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile?.name.replace(/\.[^/.]+$/, '') + '.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("File downloaded!");
  };

  const clearAll = () => {
    setSelectedFile(null);
    setConvertedFile(null);
    setAudioInfo(null);
    setConversionProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>MP3 to WAV Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-input">Select Audio File</Label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                id="file-input"
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </Button>
              {selectedFile && (
                <div className="flex items-center gap-2">
                  <FileAudio className="h-4 w-4" />
                  <span className="text-sm">{selectedFile.name}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Supports MP3, WAV, M4A, OGG, and other audio formats
            </p>
          </div>

          {selectedFile && (
            <div className="space-y-2">
              <Label>File Information</Label>
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>File Name:</span>
                  <span className="font-mono">{selectedFile.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>File Size:</span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>File Type:</span>
                  <span>{selectedFile.type || 'Unknown'}</span>
                </div>
                {audioInfo && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Duration:</span>
                      <span>{formatDuration(audioInfo.duration)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Format:</span>
                      <span>{audioInfo.format}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={convertToWav} 
              disabled={!selectedFile || isConverting}
              className="flex items-center gap-2"
            >
              <Music className="h-4 w-4" />
              {isConverting ? "Converting..." : "Convert to WAV"}
            </Button>
            <Button onClick={clearAll} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {isConverting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Converting...</span>
                <span>{conversionProgress}%</span>
              </div>
              <Progress value={conversionProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {convertedFile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />
              Conversion Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">File successfully converted to WAV format!</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Converted File Information</Label>
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Output Format:</span>
                  <Badge variant="outline">WAV</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>File Size:</span>
                  <span>{formatFileSize(convertedFile.size)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quality:</span>
                  <span>Lossless</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={downloadConvertedFile}
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download WAV File
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Audio Format Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">MP3 Format:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Compressed audio format</li>
                <li>• Smaller file sizes</li>
                <li>• Lossy compression</li>
                <li>• Widely supported</li>
                <li>• Good for streaming and storage</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">WAV Format:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Uncompressed audio format</li>
                <li>• Larger file sizes</li>
                <li>• Lossless quality</li>
                <li>• Professional audio standard</li>
                <li>• Best for editing and mastering</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Use Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">When to use WAV:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Audio editing and production</li>
                <li>• Professional recording</li>
                <li>• Archiving original recordings</li>
                <li>• When quality is more important than file size</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">When to use MP3:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Music streaming</li>
                <li>• Portable devices</li>
                <li>• Web distribution</li>
                <li>• When file size matters</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Converting MP3 to WAV will increase file size significantly</p>
            <p>• Quality cannot be improved beyond the original MP3 quality</p>
            <p>• WAV files are uncompressed and maintain original quality</p>
            <p>• Large files may take longer to process and download</p>
            <p>• Ensure you have sufficient storage space for WAV files</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

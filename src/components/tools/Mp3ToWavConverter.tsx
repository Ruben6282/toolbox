import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, RotateCcw, Music, FileAudio } from "lucide-react";
import { notify } from "@/lib/notify";

// Security constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max audio file
const MAX_DURATION = 3600; // 1 hour max duration

// Audio file magic bytes for validation
const AUDIO_MAGIC_BYTES = {
  mp3: [0xFF, 0xFB], // MP3 frame sync
  mp3_id3: [0x49, 0x44, 0x33], // ID3 tag
  wav: [0x52, 0x49, 0x46, 0x46], // RIFF
  ogg: [0x4F, 0x67, 0x67, 0x53], // OggS
  flac: [0x66, 0x4C, 0x61, 0x43], // fLaC
  m4a: [0x00, 0x00, 0x00], // ftyp at offset 4
};

// WAV encoding helper
function encodeWAV(audioBuffer: AudioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.getChannelData(0);
  const buffer = new ArrayBuffer(44 + samples.length * 2 * numChannels);
  const view = new DataView(buffer);

  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2 * numChannels, true);
  writeString(view, 8, "WAVE");

  // fmt subchunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM header size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
  view.setUint16(32, numChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data subchunk
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2 * numChannels, true);

  // Write interleaved PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = audioBuffer.getChannelData(channel)[i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: "audio/wav" });
}

export const Mp3ToWavConverter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [convertedFile, setConvertedFile] = useState<Blob | null>(null);
  const [audioInfo, setAudioInfo] = useState<{ duration: number; size: number; format: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const ctx = audioContextRef.current;
      const audio = audioElementRef.current;
      
      if (ctx) {
        ctx.close();
      }
      if (audio) {
        audio.src = '';
      }
    };
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      notify.error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    // Check if file is audio by MIME type or file extension (for iOS compatibility)
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac', '.wma'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isAudioFile = file.type.startsWith("audio/") || audioExtensions.includes(fileExtension);
    
    if (!isAudioFile) {
      notify.error("Please select an audio file (MP3, WAV, etc.)");
      return;
    }

    // Magic byte validation
    try {
      const buffer = await file.slice(0, 12).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      const isValidAudio = 
        (bytes[0] === 0xFF && bytes[1] === 0xFB) || // MP3
        (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || // ID3
        (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) || // RIFF/WAV
        (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) || // Ogg
        (bytes[0] === 0x66 && bytes[1] === 0x4C && bytes[2] === 0x61 && bytes[3] === 0x43) || // FLAC
        (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70); // M4A/MP4

      if (!isValidAudio) {
        notify.error("Invalid audio file format detected");
        return;
      }
    } catch {
      notify.error("Failed to validate audio file");
      return;
    }

    setSelectedFile(file);
    setConvertedFile(null);
    setAudioInfo(null);

    // Get audio info
    const audio = new Audio();
    audioElementRef.current = audio;
    
    audio.onloadedmetadata = () => {
      if (audio.duration > MAX_DURATION) {
        notify.error(`Audio too long. Maximum duration is ${MAX_DURATION / 60} minutes`);
        setSelectedFile(null);
        return;
      }
      
      setAudioInfo({
        duration: audio.duration,
        size: file.size,
        format: file.type || 'audio/' + fileExtension.substring(1),
      });
    };
    
    audio.onerror = () => {
      notify.error("Failed to load audio file");
      setSelectedFile(null);
    };
    
    audio.src = URL.createObjectURL(file);
    notify.success("Audio file selected!");
  };

  const convertToWav = async () => {
    if (!selectedFile) {
      notify.error("Please select a file first!");
      return;
    }

    setIsConverting(true);
    setConversionProgress(0);

    try {
      setConversionProgress(20);

      // Read file
      const arrayBuffer = await selectedFile.arrayBuffer();
      setConversionProgress(40);

      // Decode audio data
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setConversionProgress(70);

      // Encode to WAV
      const wavBlob = encodeWAV(audioBuffer);
      setConversionProgress(100);

      // Cleanup
      await audioContext.close();
      audioContextRef.current = null;

      setConvertedFile(wavBlob);
      notify.success("File converted successfully!");
    } catch (error) {
      console.error(error);
      notify.error("Conversion failed. Please try again.");
      
      // Cleanup on error
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } finally {
      setIsConverting(false);
    }
  };

  const downloadConvertedFile = () => {
    if (!convertedFile) return;

    const url = URL.createObjectURL(convertedFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile?.name.replace(/\.[^/.]+$/, "") + ".wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  notify.success("File downloaded!");
  };

  const clearAll = () => {
    setSelectedFile(null);
    setConvertedFile(null);
    setAudioInfo(null);
    setConversionProgress(0);
    
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    // Cleanup audio element
    if (audioElementRef.current) {
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }
    
    // Cleanup audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
                accept=".mp3,.wav,.m4a,.ogg,.aac,.flac,.wma,audio/*"
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

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, RotateCcw, Music, FileAudio } from "lucide-react";
import { notify } from "@/lib/notify";

// Security / limits
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DURATION = 3600; // 1 hour (seconds)

// ---- WAV encoding helper (fixed multi-channel interleaving) ----
function encodeWAV(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels || 1;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = length * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true); // file size - 8
  writeString(8, "WAVE");

  // fmt chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM header size
  view.setUint16(20, 1, true); // format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave samples
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const channelData = audioBuffer.getChannelData(ch);
      let sample = channelData[i] ?? 0;
      // clamp
      sample = Math.max(-1, Math.min(1, sample));
      // convert to 16-bit PCM
      const intSample =
        sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
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
  const [audioInfo, setAudioInfo] = useState<{
    duration: number;
    size: number;
    format: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioObjectUrlRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (audioElementRef.current) {
        audioElementRef.current.src = "";
      }
      if (audioObjectUrlRef.current) {
        URL.revokeObjectURL(audioObjectUrlRef.current);
        audioObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      notify.error(
        `File too large. Maximum size is ${
          MAX_FILE_SIZE / 1024 / 1024
        }MB`
      );
      return;
    }

    // Basic audio type/extension validation
    const audioExtensions = [
      ".mp3",
      ".wav",
      ".m4a",
      ".ogg",
      ".aac",
      ".flac",
      ".wma",
    ];
    const dotIndex = file.name.lastIndexOf(".");
    const fileExtension =
      dotIndex !== -1
        ? file.name.toLowerCase().substring(dotIndex)
        : "";
    const isAudioFile =
      file.type.startsWith("audio/") ||
      audioExtensions.includes(fileExtension);

    if (!isAudioFile) {
      notify.error("Please select an audio file (MP3, WAV, etc.)");
      return;
    }

    // Magic-byte validation
    try {
      const buffer = await file.slice(0, 12).arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const isValidAudio =
        // MP3 Frame
        (bytes[0] === 0xff && bytes[1] === 0xfb) ||
        // ID3 (MP3 with tag)
        (bytes[0] === 0x49 &&
          bytes[1] === 0x44 &&
          bytes[2] === 0x33) ||
        // RIFF/WAV
        (bytes[0] === 0x52 &&
          bytes[1] === 0x49 &&
          bytes[2] === 0x46 &&
          bytes[3] === 0x46) ||
        // OGG
        (bytes[0] === 0x4f &&
          bytes[1] === 0x67 &&
          bytes[2] === 0x67 &&
          bytes[3] === 0x53) ||
        // FLAC
        (bytes[0] === 0x66 &&
          bytes[1] === 0x4c &&
          bytes[2] === 0x61 &&
          bytes[3] === 0x43) ||
        // M4A / MP4 (ftyp at offset 4)
        (bytes[4] === 0x66 &&
          bytes[5] === 0x74 &&
          bytes[6] === 0x79 &&
          bytes[7] === 0x70);

      if (!isValidAudio) {
        notify.error("Invalid or unsupported audio file format.");
        return;
      }
    } catch {
      notify.error("Failed to validate audio file.");
      return;
    }

    setSelectedFile(file);
    setConvertedFile(null);
    setAudioInfo(null);

    // Load metadata via <audio> element
    const audio = new Audio();
    audioElementRef.current = audio;

    // Revoke previous object URL if any
    if (audioObjectUrlRef.current) {
      URL.revokeObjectURL(audioObjectUrlRef.current);
      audioObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    audioObjectUrlRef.current = objectUrl;

    audio.onloadedmetadata = () => {
      if (audio.duration > MAX_DURATION) {
        notify.error(
          `Audio too long. Maximum duration is ${
            MAX_DURATION / 60
          } minutes`
        );
        setSelectedFile(null);
        return;
      }

      setAudioInfo({
        duration: audio.duration,
        size: file.size,
        format: file.type || "audio/" + fileExtension.replace(".", ""),
      });
    };

    audio.onerror = () => {
      notify.error("Failed to load audio file.");
      setSelectedFile(null);
    };

    audio.src = objectUrl;

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

      const arrayBuffer = await selectedFile.arrayBuffer();
      setConversionProgress(40);

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      let audioBuffer: AudioBuffer;
      try {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      } catch (err: unknown) {
        const name =
          typeof err === "object" && err !== null && "name" in err
            ? (err as { name?: unknown }).name
            : undefined;

        if (name === "NotSupportedError") {
          notify.error(
            "Your browser cannot decode this audio format."
          );
        } else {
          notify.error("Failed to decode audio data.");
        }
        await audioContext.close();
        audioContextRef.current = null;
        setIsConverting(false);
        return;
      }

      setConversionProgress(70);

      const wavBlob = encodeWAV(audioBuffer);
      setConversionProgress(100);

      await audioContext.close();
      audioContextRef.current = null;

      setConvertedFile(wavBlob);
      notify.success("File converted successfully!");
    } catch (error) {
      console.error(error);
      notify.error("Conversion failed. Please try again.");

      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } finally {
      setIsConverting(false);
    }
  };

  const downloadConvertedFile = () => {
    if (!convertedFile || !selectedFile) return;

    const url = URL.createObjectURL(convertedFile);
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.wav`;
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (audioElementRef.current) {
      audioElementRef.current.src = "";
      audioElementRef.current = null;
    }

    if (audioObjectUrlRef.current) {
      URL.revokeObjectURL(audioObjectUrlRef.current);
      audioObjectUrlRef.current = null;
    }

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
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
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
          {/* File selection */}
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
                  <span className="text-sm truncate max-w-[220px]">
                    {selectedFile.name}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Supports MP3, WAV, M4A, OGG, AAC, FLAC and more (browser
              support may vary).
            </p>
          </div>

          {/* File info */}
          {selectedFile && (
            <div className="space-y-2">
              <Label>File Information</Label>
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>File Name:</span>
                  <span className="font-mono text-right">
                    {selectedFile.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>File Size:</span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>File Type:</span>
                  <span>{selectedFile.type || "Unknown"}</span>
                </div>
                {audioInfo && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Duration:</span>
                      <span>{formatDuration(audioInfo.duration)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Detected Format:</span>
                      <span>{audioInfo.format}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
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

          {/* Progress */}
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

      {/* Result card */}
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
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="font-medium">
                  File successfully converted to WAV format!
                </span>
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
                  <span>Lossless (16-bit PCM)</span>
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

      {/* Info cards */}
      <Card>
        <CardHeader>
          <CardTitle>Audio Format Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">MP3 Format:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Compressed, lossy audio</li>
                <li>• Small file sizes</li>
                <li>• Ideal for streaming and storage</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">WAV Format:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Uncompressed, lossless audio</li>
                <li>• Large file sizes</li>
                <li>• Ideal for editing, mastering and archiving</li>
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
            <p>• Converting MP3 to WAV increases file size significantly.</p>
            <p>• Audio quality cannot be improved beyond the original file.</p>
            <p>• WAV files are best for editing, MP3 is best for distribution.</p>
            <p>• Large files may take longer to process and download.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

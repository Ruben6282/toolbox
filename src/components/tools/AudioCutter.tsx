// AudioCutter.tsx
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  RotateCcw,
  Play,
  Pause,
  Scissors,
  Volume2,
} from "lucide-react";
import { notify } from "@/lib/notify";
import { MAX_FILE_SIZE } from "@/lib/security";

// Worker type (Vite / modern bundlers)
const createAudioWorker = () =>
  new Worker(
    new URL("./audio-cutter.worker.ts", import.meta.url),
    { type: "module" }
  );

const MAX_AUDIO_DURATION_SEC = 3600; // 60 min max file
const MAX_CLIP_DURATION_SEC = 600;   // 10 min max clip
const MIN_CLIP_DURATION_SEC = 0.1;   // 100 ms min

type WorkerProgressMessage = {
  type: "PROGRESS";
  value: number;
};

type WorkerCutCompleteMessage = {
  type: "CUT_COMPLETE";
  wavBuffer: ArrayBuffer;
  duration: number;
};

type WorkerErrorMessage = {
  type: "ERROR";
  message: string;
};

type WorkerResponse =
  | WorkerProgressMessage
  | WorkerCutCompleteMessage
  | WorkerErrorMessage;

export const AudioCutter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const [isCutting, setIsCutting] = useState(false);
  const [cutProgress, setCutProgress] = useState(0);
  const [cutAudioBlob, setCutAudioBlob] = useState<Blob | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentUrlRef = useRef<string>("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const workerRef = useRef<Worker | null>(null);

  // --- Format mm:ss ---
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Initialize worker
  useEffect(() => {
    const worker = createAudioWorker();
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;

      if (data.type === "PROGRESS") {
        // Map worker progress (0-100) to final 50%-100% range
        setCutProgress((prev) => {
          const mapped = 50 + Math.round(data.value * 0.5);
          return mapped > prev ? mapped : prev;
        });
      } else if (data.type === "CUT_COMPLETE") {
        const { wavBuffer } = data;
        const blob = new Blob([wavBuffer], { type: "audio/wav" });
        setCutAudioBlob(blob);
        setCutProgress(100);
        setIsCutting(false);
        notify.success("Audio cut successfully!");
      } else if (data.type === "ERROR") {
        console.error("Worker error:", data.message);
        notify.error("Audio cutting failed. Please try again.");
        setIsCutting(false);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Attach audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);

    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      if (!isFinite(dur) || isNaN(dur)) {
        notify.error("Failed to read audio duration.");
        return;
      }
      if (dur > MAX_AUDIO_DURATION_SEC) {
        notify.error("Audio is too long. Please choose a file under 60 minutes.");
        audio.pause();
        setIsPlaying(false);
        setSelectedFile(null);
        setAudioUrl("");
        if (currentUrlRef.current) {
          URL.revokeObjectURL(currentUrlRef.current);
          currentUrlRef.current = "";
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setDuration(dur);
      setStartTime(0);
      setEndTime(dur);
    };

    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [audioUrl]);

  // Revoke audio URL on unmount as a safety net
  useEffect(() => {
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = "";
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // --- File selection ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic audio detection by MIME or extension
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
    const ext = dotIndex !== -1 ? file.name.toLowerCase().substring(dotIndex) : "";
    const isAudioFile =
      file.type.startsWith("audio/") || audioExtensions.includes(ext);

    if (!isAudioFile) {
      notify.error("Please select a valid audio file!");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      notify.error(
        `File is too large. Maximum allowed size is ${(
          MAX_FILE_SIZE /
          (1024 * 1024)
        ).toFixed(0)}MB.`
      );
      return;
    }

    // Revoke previous URL
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = "";
    }

    const url = URL.createObjectURL(file);
    currentUrlRef.current = url;

    setSelectedFile(file);
    setAudioUrl(url);
    setCutAudioBlob(null);
    setDuration(0);
    setCurrentTime(0);
    setStartTime(0);
    setEndTime(0);
    setCutProgress(0);

    // Reset decoded buffer
    audioBufferRef.current = null;

    notify.success(`Loaded: ${file.name}`);
  };

  // --- Play / Pause ---
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => notify.error("Unable to play audio."));
    } else {
      audio.pause();
    }
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const setStartToCurrent = () => {
    if (currentTime >= endTime) {
      notify.error("Start time must be before end time.");
      return;
    }
    setStartTime(currentTime);
    audioRef.current?.pause();
  };

  const setEndToCurrent = () => {
    if (currentTime <= startTime) {
      notify.error("End time must be after start time.");
      return;
    }
    setEndTime(currentTime);
    audioRef.current?.pause();
  };

  // --- Cutting logic using AudioContext + Worker ---
  const cutAudio = async () => {
    if (!selectedFile) {
      notify.error("No audio loaded.");
      return;
    }
    if (startTime >= endTime) {
      notify.error("Invalid start and end times.");
      return;
    }
    const clipDuration = endTime - startTime;
    if (clipDuration < MIN_CLIP_DURATION_SEC) {
      notify.error("Clip must be at least 0.1 seconds long.");
      return;
    }
    if (clipDuration > MAX_CLIP_DURATION_SEC) {
      notify.error("Clip too long. Max 10 minutes.");
      return;
    }
    if (!workerRef.current) {
      notify.error("Cut engine not initialized.");
      return;
    }

    setIsCutting(true);
    setCutProgress(5);

    try {
      let audioBuffer = audioBufferRef.current;

      if (!audioBuffer) {
        // Decode once per file
        setCutProgress(15);
        const arrayBuffer = await selectedFile.arrayBuffer();
        let audioCtx = audioContextRef.current;
        if (!audioCtx) {
          audioCtx = new AudioContext();
          audioContextRef.current = audioCtx;
        }

        try {
          audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (err: unknown) {
          const maybeErr = err as { name?: string } | undefined;
          if (maybeErr?.name === "NotSupportedError") {
            notify.error("This browser cannot decode this audio format.");
          } else {
            notify.error("Failed to decode audio.");
          }
          setIsCutting(false);
          return;
        }

        audioBufferRef.current = audioBuffer;
      }

      setCutProgress(30);

      const sampleRate = audioBuffer.sampleRate;
      const numChannels = audioBuffer.numberOfChannels;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const length = Math.max(0, endSample - startSample);

      if (length <= 0) {
        notify.error("Invalid selection. Please adjust your start/end times.");
        setIsCutting(false);
        return;
      }

      // Extract per-channel region into Float32Arrays
      const channelData: ArrayBuffer[] = [];
      for (let ch = 0; ch < numChannels; ch++) {
        const source = audioBuffer.getChannelData(ch);
        const segment = source.slice(startSample, endSample);
        channelData.push(segment.buffer);
      }

      setCutProgress(50);

      // Send work to Web Worker
      const payload = {
        type: "CUT" as const,
        sampleRate,
        numChannels,
        length,
        channelData,
      };

      // Transfer channel buffers to worker (zero-copy)
      const transfers = channelData.map((buf) => buf) as Transferable[];
      workerRef.current.postMessage(payload, transfers);
    } catch (err) {
      console.error(err);
      notify.error("Failed to start cutting.");
      setIsCutting(false);
    }
  };

  const downloadCutAudio = () => {
    if (!cutAudioBlob || !selectedFile) return;

    const url = URL.createObjectURL(cutAudioBlob);
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}_cut.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    notify.success("Cut audio downloaded!");
  };

  const clearAll = () => {
    setSelectedFile(null);
    setAudioUrl("");
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setStartTime(0);
    setEndTime(0);
    setCutAudioBlob(null);
    setCutProgress(0);
    setIsCutting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = "";
    }

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    audioBufferRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audio Cutter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File selection */}
          <div>
            <Label>Select Audio File</Label>
            <div className="flex items-center gap-4 mt-1">
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,.aac,.flac,.wma,audio/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              {selectedFile && (
                <span className="text-sm text-muted-foreground flex items-center gap-2 truncate max-w-[240px]">
                  <Volume2 className="h-4 w-4" />
                  {selectedFile.name}
                </span>
              )}
            </div>
          </div>

          {/* Player & selection controls */}
          {audioUrl && (
            <>
              <div className="flex items-center gap-4">
                <Button onClick={togglePlayPause} size="sm">
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <Slider
                    value={[currentTime]}
                    onValueChange={(v) => seekTo(v[0])}
                    max={duration || 0}
                    step={0.05}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Time: {formatTime(startTime)}</Label>
                  <div className="flex gap-2 mt-1">
                    <Slider
                      value={[startTime]}
                      onValueChange={(v) => {
                        const newStart = Math.min(v[0], endTime - 0.01);
                        setStartTime(Math.max(0, newStart));
                      }}
                      max={duration || 0}
                      step={0.05}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={setStartToCurrent}
                    >
                      Set
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>End Time: {formatTime(endTime)}</Label>
                  <div className="flex gap-2 mt-1">
                    <Slider
                      value={[endTime]}
                      onValueChange={(v) => {
                        const newEnd = Math.max(v[0], startTime + 0.01);
                        setEndTime(Math.min(duration, newEnd));
                      }}
                      max={duration || 0}
                      step={0.05}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={setEndToCurrent}
                    >
                      Set
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg flex justify-between text-sm">
                <span>Clip Duration:</span>
                <Badge variant="outline">
                  {formatTime(Math.max(0, endTime - startTime))}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={cutAudio}
                  disabled={
                    isCutting ||
                    !selectedFile ||
                    endTime <= startTime ||
                    !isFinite(endTime - startTime)
                  }
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  {isCutting ? "Cutting..." : "Cut Audio"}
                </Button>
                <Button onClick={clearAll} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              {isCutting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{cutProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${cutProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Hidden audio element */}
              <audio ref={audioRef} src={audioUrl} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Result card */}
      {cutAudioBlob && (
        <Card>
          <CardHeader>
            <CardTitle>Cut Audio Ready</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              Audio cut successfully!
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Duration: {formatTime(endTime - startTime)}</p>
              <p>Start: {formatTime(startTime)}</p>
              <p>End: {formatTime(endTime)}</p>
              <p>
                Size: {(cutAudioBlob.size / 1024).toFixed(1)}
                {" "}KB
              </p>
            </div>
            <Button onClick={downloadCutAudio} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download WAV
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

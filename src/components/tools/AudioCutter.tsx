import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, RotateCcw, Play, Pause, Scissors, Volume2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { MAX_FILE_SIZE } from "@/lib/security";

export const AudioCutter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isCutting, setIsCutting] = useState(false);
  const [cutProgress, setCutProgress] = useState(0);
  const [cutAudioBlob, setCutAudioBlob] = useState<Blob | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUrlRef = useRef<string>("");

  // Guardrails to prevent resource exhaustion
  const MAX_AUDIO_DURATION_SEC = 3600; // 60 minutes max source file duration
  const MAX_CLIP_DURATION_SEC = 600;   // 10 minutes max clip to export

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
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
      setEndTime(dur);
    };

  const onEnded = () => setIsPlaying(false);
  audio.addEventListener("timeupdate", updateTime);
  audio.addEventListener("loadedmetadata", updateDuration);
  audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  // File selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is audio by MIME type or file extension (for iOS compatibility)
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac', '.wma'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isAudioFile = file.type.startsWith("audio/") || audioExtensions.includes(fileExtension);
    
    if (!isAudioFile) {
      notify.error("Please select a valid audio file!");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      notify.error(`File is too large. Maximum allowed size is ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB.`);
      return;
    }

    // Revoke previous URL if any
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = "";
    }
    const url = URL.createObjectURL(file);
    currentUrlRef.current = url;
    setSelectedFile(file);
    setAudioUrl(url);
    setCutAudioBlob(null);
    setStartTime(0);
    setEndTime(0);
    setCurrentTime(0);
    notify.success(`Loaded: ${file.name}`);
  };

  // Play / Pause
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  const seekTo = (t: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = t;
    setCurrentTime(t);
  };

  const setStartToCurrent = () => {
    setStartTime(currentTime);
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const setEndToCurrent = () => {
    setEndTime(currentTime);
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  // Real audio cutting using Web Audio API
  const cutAudio = async () => {
  if (!selectedFile) return notify.error("No audio loaded.");
  if (startTime >= endTime) return notify.error("Invalid start/end times.");
  if (startTime < 0 || endTime > duration) return notify.error("Cut times are out of range.");
  if ((endTime - startTime) > MAX_CLIP_DURATION_SEC) return notify.error("Clip too long. Max 10 minutes.");

    setIsCutting(true);
    setCutProgress(10);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const audioCtx = new AudioContext();
      setCutProgress(30);
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setCutProgress(50);

      const startSample = Math.floor(startTime * audioBuffer.sampleRate);
      const endSample = Math.floor(endTime * audioBuffer.sampleRate);
      const length = endSample - startSample;

      const cutBuffer = audioCtx.createBuffer(
        audioBuffer.numberOfChannels,
        length,
        audioBuffer.sampleRate
      );

      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        cutBuffer
          .getChannelData(i)
          .set(audioBuffer.getChannelData(i).slice(startSample, endSample));
      }

      setCutProgress(80);

      // Convert to WAV blob
      const wavBlob = audioBufferToWav(cutBuffer);
      setCutAudioBlob(wavBlob);

      setCutProgress(100);
      notify.success("Audio cut successfully!");
      await audioCtx.close();
    } catch (err) {
      console.error(err);
      notify.error("Failed to cut audio.");
    } finally {
      setIsCutting(false);
    }
  };

  // Convert AudioBuffer → WAV Blob
  const audioBufferToWav = (buffer: AudioBuffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    // RIFF header
    writeString(0, "RIFF");
    view.setUint32(4, 36 + buffer.length * numChannels * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, buffer.length * numChannels * 2, true);

    // PCM samples
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = buffer.getChannelData(ch)[i];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  };

  const downloadCutAudio = () => {
    if (!cutAudioBlob || !selectedFile) return;
    const url = URL.createObjectURL(cutAudioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_cut.wav`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success("Cut audio downloaded!");
  };

  const clearAll = () => {
    setSelectedFile(null);
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = "";
    }
    setAudioUrl("");
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setStartTime(0);
    setEndTime(0);
    setCutAudioBlob(null);
    setCutProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  // Revoke object URL on unmount as a safety net
  useEffect(() => {
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = "";
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audio Cutter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Audio File</Label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,.aac,.flac,.wma,audio/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                <Upload className="h-4 w-4 mr-2" /> Choose File
              </Button>
              {selectedFile && (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Volume2 className="h-4 w-4" /> {selectedFile.name}
                </span>
              )}
            </div>
          </div>

          {audioUrl && (
            <>
              <div className="flex items-center gap-4">
                <Button onClick={togglePlayPause} size="sm">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <Slider
                    value={[currentTime]}
                    onValueChange={(v) => seekTo(v[0])}
                    max={duration}
                    step={0.1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Time: {formatTime(startTime)}</Label>
                  <div className="flex gap-2">
                    <Slider
                      value={[startTime]}
                      onValueChange={(v) => setStartTime(v[0])}
                      max={duration}
                      step={0.1}
                      className="flex-1"
                    />
                    <Button size="sm" variant="outline" onClick={setStartToCurrent}>
                      Set
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>End Time: {formatTime(endTime)}</Label>
                  <div className="flex gap-2">
                    <Slider
                      value={[endTime]}
                      onValueChange={(v) => setEndTime(v[0])}
                      max={duration}
                      step={0.1}
                      className="flex-1"
                    />
                    <Button size="sm" variant="outline" onClick={setEndToCurrent}>
                      Set
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg flex justify-between text-sm">
                <span>Cut Duration:</span>
                <Badge variant="outline">{formatTime(endTime - startTime)}</Badge>
              </div>

              <div className="flex gap-2">
                <Button onClick={cutAudio} disabled={isCutting || startTime >= endTime}>
                  <Scissors className="h-4 w-4 mr-2" />
                  {isCutting ? "Cutting..." : "Cut Audio"}
                </Button>
                <Button onClick={clearAll} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" /> Clear
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

              <audio ref={audioRef} src={audioUrl} />
            </>
          )}
        </CardContent>
      </Card>

      {cutAudioBlob && (
        <Card>
          <CardHeader>
            <CardTitle>Cut Audio Ready</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              Audio cut successfully!
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Duration: {formatTime(endTime - startTime)}</p>
              <p>Start: {formatTime(startTime)}</p>
              <p>End: {formatTime(endTime)}</p>
              <p>Size: {(cutAudioBlob.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button onClick={downloadCutAudio} className="w-full">
              <Download className="h-4 w-4 mr-2" /> Download WAV
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

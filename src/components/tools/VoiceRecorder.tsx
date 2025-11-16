import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Download,
  RotateCcw,
} from "lucide-react";
import { notify } from "@/lib/notify";

type AudioQuality = "high" | "medium" | "low";

const ALLOWED_QUALITIES: AudioQuality[] = ["high", "medium", "low"];
const coerceQuality = (val: string): AudioQuality =>
  ALLOWED_QUALITIES.includes(val as AudioQuality)
    ? (val as AudioQuality)
    : "high";

const qualityOptions = [
  { label: "High Quality", value: "high", bitrate: 192000 },
  { label: "Medium Quality", value: "medium", bitrate: 96000 },
  { label: "Low Quality", value: "low", bitrate: 64000 },
];

export const VoiceRecorder = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioQuality, setAudioQuality] = useState<AudioQuality>("high");
  const [mimeType, setMimeType] = useState<string>("audio/webm");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* --------------------------------
   * Detect browser support
   * -------------------------------- */
  useEffect(() => {
    const supported =
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined";
    setIsSupported(supported);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  /* --------------------------------
   * MIME type selection (Safari safe)
   * -------------------------------- */
  const getMimeType = () => {
    const preferred = "audio/webm;codecs=opus";
    if (MediaRecorder.isTypeSupported(preferred)) return preferred;

    const fallback = "audio/mp4";
    if (MediaRecorder.isTypeSupported(fallback)) return fallback;

    return "audio/webm";
  };

  /* --------------------------------
   * Start Recording (with warm-up fix)
   * -------------------------------- */
  const startRecording = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const bitrate =
        qualityOptions.find((q) => q.value === audioQuality)?.bitrate ??
        192000;

      const type = getMimeType();
      setMimeType(type);

      const recorder = new MediaRecorder(stream, {
        mimeType: type,
        audioBitsPerSecond: bitrate,
      });

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];

        setAudioBlob(blob);

        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      };

      /* -------------------------------------------------------
       * 🔥 FIX 1: Double-buffer DSP warm-up (removes clicks)
       * ------------------------------------------------------- */
      const firstTrack = stream.getAudioTracks()[0];
      firstTrack.enabled = false;
      await new Promise((r) => setTimeout(r, 200));
      firstTrack.enabled = true;

      /* -------------------------------------------------------
       * 🔥 FIX 2: Pre-roll warm-up before starting recorder
       * ------------------------------------------------------- */
      notify.success("Microphone ready…");
      setIsRecording(true);
      setRecordingTime(0);

      await new Promise((r) => setTimeout(r, 400)); // stabilizes AGC + encoder

      recorder.start();

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      notify.success("Recording started");
    } catch (err: unknown) {
      console.error("Microphone error:", err);
      handleRecordingError(err);
    }
  };

  const handleRecordingError = (error: unknown) => {
    const name =
      typeof error === "object" && error !== null && "name" in error
        ? (error as { name?: unknown }).name
        : undefined;

    if (name === "NotAllowedError")
      return notify.error("Microphone permission denied.");
    if (name === "NotFoundError")
      return notify.error("No microphone detected.");
    if (name === "NotReadableError")
      return notify.error("Microphone is used by another app.");
    notify.error("Unable to access microphone.");
  };

  /* --------------------------------
   * Stop Recording
   * -------------------------------- */
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    notify.success("Recording stopped");
  };

  /* --------------------------------
   * Playback Controls
   * -------------------------------- */
  const playRecording = () => {
    if (!audioUrl || !audioRef.current) return;

    if (isPlaying) return audioRef.current.pause();

    audioRef.current
      .play()
      .then(() => {})
      .catch(() => notify.error("Cannot play audio"));
  };

  /* --------------------------------
   * Download Recording
   * -------------------------------- */
  const downloadRecording = () => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const ext = mimeType.includes("mp4") ? "m4a" : "webm";

    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${new Date()
      .toISOString()
      .replace(/:/g, "-")
      .slice(0, 19)}.${ext}`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  /* --------------------------------
   * Clear Recording
   * -------------------------------- */
  const clearRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    notify.success("Recording cleared");
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
      s % 60
    ).padStart(2, "0")}`;

  /* --------------------------------
   * Unsupported Browser
   * -------------------------------- */
  if (isSupported === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voice Recorder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MicOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Voice Recording Unsupported</p>
            <p>Your browser does not support recording. Try Chrome, Safari, Edge, or Firefox.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* MAIN RECORDER CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Recorder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* QUALITY SELECTOR */}
          <div className="space-y-2">
            <Label>Audio Quality</Label>
            <Select
              value={audioQuality}
              disabled={isRecording}
              onValueChange={(v) => setAudioQuality(coerceQuality(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                {qualityOptions.map((q) => (
                  <SelectItem key={q.value} value={q.value}>
                    {q.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-wrap gap-2">
            {!isRecording ? (
              <Button onClick={startRecording} className="flex-1 min-w-[200px]">
                <Mic className="h-4 w-4 mr-2" /> Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex-1 min-w-[200px]"
              >
                <MicOff className="h-4 w-4 mr-2" /> Stop Recording
              </Button>
            )}

            {audioUrl && (
              <>
                <Button
                  onClick={playRecording}
                  variant="outline"
                  className="flex-1 min-w-[120px]"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span className="ml-2">
                    {isPlaying ? "Pause" : "Play"}
                  </span>
                </Button>

                <Button
                  onClick={downloadRecording}
                  variant="outline"
                  className="flex-1 min-w-[120px]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </>
            )}

            <Button
              onClick={clearRecording}
              variant="outline"
              className="flex-1 min-w-[100px]"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* RECORDING STATUS */}
          {isRecording && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-950 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-700 dark:text-red-200">
                  Recording…
                </span>
              </div>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                {formatTime(recordingTime)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PLAYBACK CARD */}
      {audioUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Recording Playback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex gap-1">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{formatTime(recordingTime)}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-muted-foreground">Quality:</span>
                <span className="font-medium">
                  {qualityOptions.find((q) => q.value === audioQuality)?.label}
                </span>
              </div>
              <div className="flex gap-1">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">
                  {mimeType.includes("mp4") ? "MP4 (audio)" : "WebM"}
                </span>
              </div>
              <div className="flex gap-1">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">
                  {audioBlob ? `${(audioBlob.size / 1024).toFixed(1)} KB` : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TIPS */}
      <Card>
        <CardHeader>
          <CardTitle>Recording Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Speak clearly and at a moderate pace</li>
            <li>• Use a good microphone for best audio</li>
            <li>• Avoid background noise</li>
            <li>• Higher quality uses larger file sizes</li>
            <li>• Recordings save in WebM or MP4 depending on your browser</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

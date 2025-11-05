import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Play, Pause, Square, Download, RotateCcw } from "lucide-react";

export const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [audioQuality, setAudioQuality] = useState("high");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const qualityOptions = [
    { label: "High Quality", value: "high" },
    { label: "Medium Quality", value: "medium" },
    { label: "Low Quality", value: "low" },
  ];

  useEffect(() => {
    // Check if getUserMedia is supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setIsSupported(true);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: audioQuality === "high" ? 44100 : audioQuality === "medium" ? 22050 : 16000,
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        chunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const downloadRecording = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voice Recorder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MicOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Voice Recording Not Supported</p>
            <p className="text-muted-foreground">
              Your browser doesn't support voice recording. Please use a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Voice Recorder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="audio-quality">Audio Quality</Label>
            <Select value={audioQuality} onValueChange={setAudioQuality}>
              <SelectTrigger>
                <SelectValue placeholder="Select audio quality" />
              </SelectTrigger>
              <SelectContent>
                {qualityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isRecording ? (
              <Button onClick={startRecording} className="flex-1 min-w-[200px] sm:flex-initial sm:w-auto">
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="flex-1 min-w-[200px] sm:flex-initial sm:w-auto">
                <MicOff className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
            )}

            {audioUrl && (
              <>
                <Button onClick={playRecording} variant="outline" className="flex-1 min-w-[120px] sm:flex-initial sm:w-auto">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span className="ml-2">{isPlaying ? "Pause" : "Play"}</span>
                </Button>
                
                <Button onClick={downloadRecording} variant="outline" className="flex-1 min-w-[120px] sm:flex-initial sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </>
            )}

            <Button onClick={clearRecording} variant="outline" className="flex-1 min-w-[100px] sm:flex-initial sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {isRecording && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-800 dark:text-red-200">Recording...</span>
              </div>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                {formatTime(recordingTime)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                controls
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{formatTime(recordingTime)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="text-muted-foreground">Quality:</span>
                <span className="font-medium">
                  {qualityOptions.find(q => q.value === audioQuality)?.label}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">WebM</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">
                  {audioBlob ? `${(audioBlob.size / 1024).toFixed(1)} KB` : "Unknown"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recording Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Speak clearly and at a moderate pace for best results</li>
            <li>• Use a good quality microphone for better audio quality</li>
            <li>• Minimize background noise when recording</li>
            <li>• Test your microphone permissions before recording</li>
            <li>• Higher quality settings produce larger file sizes</li>
            <li>• Recordings are saved in WebM format for broad compatibility</li>
            <li>• You can download recordings for offline use</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

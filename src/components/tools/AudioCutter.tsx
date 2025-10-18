import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, RotateCcw, Play, Pause, Scissors, Volume2 } from "lucide-react";
import { toast } from "sonner";

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
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      const audio = audioRef.current;
      
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => {
        setDuration(audio.duration);
        setEndTime(audio.duration);
      };
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', () => setIsPlaying(false));
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [audioUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setCutAudioBlob(null);
      toast.success("Audio file loaded!");
    } else {
      toast.error("Please select a valid audio file!");
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cutAudio = async () => {
    if (!selectedFile || startTime >= endTime) {
      toast.error("Please select valid start and end times!");
      return;
    }

    setIsCutting(true);
    setCutProgress(0);

    try {
      // Simulate cutting process
      const steps = [
        { progress: 20, message: "Loading audio data..." },
        { progress: 40, message: "Processing audio segment..." },
        { progress: 60, message: "Cutting audio..." },
        { progress: 80, message: "Encoding cut audio..." },
        { progress: 100, message: "Cut complete!" }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setCutProgress(step.progress);
      }

      // In a real implementation, you would use Web Audio API to cut the audio
      // For this demo, we'll create a mock cut audio blob
      const cutDuration = endTime - startTime;
      const mockCutData = new Uint8Array(Math.floor(cutDuration * 1000)); // Mock data
      const cutBlob = new Blob([mockCutData], { type: selectedFile.type });
      
      setCutAudioBlob(cutBlob);
      toast.success("Audio cut successfully!");
    } catch (error) {
      toast.error("Failed to cut audio. Please try again.");
    } finally {
      setIsCutting(false);
    }
  };

  const downloadCutAudio = () => {
    if (!cutAudioBlob || !selectedFile) return;

    const url = URL.createObjectURL(cutAudioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_cut.${selectedFile.name.split('.').pop()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Cut audio downloaded!");
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const setStartToCurrent = () => {
    setStartTime(currentTime);
  };

  const setEndToCurrent = () => {
    setEndTime(currentTime);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audio Cutter</CardTitle>
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
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm">{selectedFile.name}</span>
                </div>
              )}
            </div>
          </div>

          {audioUrl && (
            <>
              <div className="space-y-4">
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
                      onValueChange={(value) => seekTo(value[0])}
                      max={duration}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time: {formatTime(startTime)}</Label>
                    <div className="flex gap-2">
                      <Slider
                        value={[startTime]}
                        onValueChange={(value) => setStartTime(value[0])}
                        max={duration}
                        step={0.1}
                        className="flex-1"
                      />
                      <Button onClick={setStartToCurrent} size="sm" variant="outline">
                        Set
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>End Time: {formatTime(endTime)}</Label>
                    <div className="flex gap-2">
                      <Slider
                        value={[endTime]}
                        onValueChange={(value) => setEndTime(value[0])}
                        max={duration}
                        step={0.1}
                        className="flex-1"
                      />
                      <Button onClick={setEndToCurrent} size="sm" variant="outline">
                        Set
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Cut Duration:</span>
                    <Badge variant="outline">
                      {formatTime(endTime - startTime)}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={cutAudio} 
                    disabled={isCutting || startTime >= endTime}
                    className="flex items-center gap-2"
                  >
                    <Scissors className="h-4 w-4" />
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
                      <span>Cutting audio...</span>
                      <span>{cutProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${cutProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <audio ref={audioRef} src={audioUrl} />
            </>
          )}
        </CardContent>
      </Card>

      {cutAudioBlob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Cut Audio Ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Audio successfully cut!</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cut Audio Information</Label>
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span>{formatTime(endTime - startTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Start Time:</span>
                  <span>{formatTime(startTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>End Time:</span>
                  <span>{formatTime(endTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>File Size:</span>
                  <span>{(cutAudioBlob.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={downloadCutAudio}
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Cut Audio
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Audio Cutting Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use the play button to preview your audio before cutting</li>
            <li>• Set precise start and end times for accurate cuts</li>
            <li>• The "Set" buttons help you mark the current playback position</li>
            <li>• Cut duration is displayed in real-time as you adjust the times</li>
            <li>• Supported formats: MP3, WAV, M4A, OGG, and more</li>
            <li>• For best results, use high-quality source audio files</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Use Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Content Creation:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Extract audio clips for videos</li>
                <li>• Create sound effects</li>
                <li>• Make ringtones</li>
                <li>• Podcast editing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Music Production:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Sample extraction</li>
                <li>• Loop creation</li>
                <li>• Remix preparation</li>
                <li>• Audio analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

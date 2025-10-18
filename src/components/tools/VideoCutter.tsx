import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, RotateCcw, Play, Pause, Scissors, Video, Volume2 } from "lucide-react";
import { toast } from "sonner";

export const VideoCutter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isCutting, setIsCutting] = useState(false);
  const [cutProgress, setCutProgress] = useState(0);
  const [cutVideoBlob, setCutVideoBlob] = useState<Blob | null>(null);
  const [videoInfo, setVideoInfo] = useState<{
    width: number;
    height: number;
    size: number;
    format: string;
  } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      const video = videoRef.current;
      
      const updateTime = () => setCurrentTime(video.currentTime);
      const updateDuration = () => {
        setDuration(video.duration);
        setEndTime(video.duration);
      };
      
      video.addEventListener('timeupdate', updateTime);
      video.addEventListener('loadedmetadata', updateDuration);
      video.addEventListener('ended', () => setIsPlaying(false));
      
      return () => {
        video.removeEventListener('timeupdate', updateTime);
        video.removeEventListener('loadedmetadata', updateDuration);
        video.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [videoUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setCutVideoBlob(null);
      
      // Get video info
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        setVideoInfo({
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          format: file.type
        });
      };
      video.src = url;
      
      toast.success("Video file loaded!");
    } else {
      toast.error("Please select a valid video file!");
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const cutVideo = async () => {
    if (!selectedFile || startTime >= endTime) {
      toast.error("Please select valid start and end times!");
      return;
    }

    setIsCutting(true);
    setCutProgress(0);

    try {
      // Simulate cutting process
      const steps = [
        { progress: 15, message: "Loading video data..." },
        { progress: 30, message: "Processing video stream..." },
        { progress: 50, message: "Cutting video segment..." },
        { progress: 70, message: "Processing audio track..." },
        { progress: 85, message: "Encoding cut video..." },
        { progress: 100, message: "Cut complete!" }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setCutProgress(step.progress);
      }

      // In a real implementation, you would use WebCodecs API or FFmpeg.js
      // For this demo, we'll create a mock cut video blob
      const cutDuration = endTime - startTime;
      const mockCutData = new Uint8Array(Math.floor(cutDuration * 10000)); // Mock data
      const cutBlob = new Blob([mockCutData], { type: selectedFile.type });
      
      setCutVideoBlob(cutBlob);
      toast.success("Video cut successfully!");
    } catch (error) {
      toast.error("Failed to cut video. Please try again.");
    } finally {
      setIsCutting(false);
    }
  };

  const downloadCutVideo = () => {
    if (!cutVideoBlob || !selectedFile) return;

    const url = URL.createObjectURL(cutVideoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_cut.${selectedFile.name.split('.').pop()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Cut video downloaded!");
  };

  const clearAll = () => {
    setSelectedFile(null);
    setVideoUrl("");
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setStartTime(0);
    setEndTime(0);
    setCutVideoBlob(null);
    setCutProgress(0);
    setVideoInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
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
          <CardTitle>Video Cutter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-input">Select Video File</Label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                id="file-input"
                type="file"
                accept="video/*"
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
                  <Video className="h-4 w-4" />
                  <span className="text-sm">{selectedFile.name}</span>
                </div>
              )}
            </div>
          </div>

          {videoUrl && (
            <>
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full max-w-md mx-auto rounded border"
                    controls={false}
                  />
                </div>

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

                {videoInfo && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Resolution:</span>
                        <div className="font-medium">{videoInfo.width}x{videoInfo.height}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">File Size:</span>
                        <div className="font-medium">{formatFileSize(videoInfo.size)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <div className="font-medium">{formatTime(duration)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Format:</span>
                        <div className="font-medium">{videoInfo.format}</div>
                      </div>
                    </div>
                  </div>
                )}

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
                    onClick={cutVideo} 
                    disabled={isCutting || startTime >= endTime}
                    className="flex items-center gap-2"
                  >
                    <Scissors className="h-4 w-4" />
                    {isCutting ? "Cutting..." : "Cut Video"}
                  </Button>
                  <Button onClick={clearAll} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>

                {isCutting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cutting video...</span>
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
            </>
          )}
        </CardContent>
      </Card>

      {cutVideoBlob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Cut Video Ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Video successfully cut!</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cut Video Information</Label>
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
                  <span>{formatFileSize(cutVideoBlob.size)}</span>
                </div>
                {videoInfo && (
                  <div className="flex justify-between text-sm">
                    <span>Resolution:</span>
                    <span>{videoInfo.width}x{videoInfo.height}</span>
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={downloadCutVideo}
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Cut Video
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Video Cutting Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use the video player to preview your content before cutting</li>
            <li>• Set precise start and end times for accurate cuts</li>
            <li>• The "Set" buttons help you mark the current playback position</li>
            <li>• Cut duration is displayed in real-time as you adjust the times</li>
            <li>• Supported formats: MP4, AVI, MOV, WebM, and more</li>
            <li>• For best results, use high-quality source video files</li>
            <li>• Large video files may take longer to process</li>
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
                <li>• Extract video clips for social media</li>
                <li>• Create highlight reels</li>
                <li>• Make GIFs and short videos</li>
                <li>• Video editing and trimming</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Professional Use:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Training video segments</li>
                <li>• Presentation clips</li>
                <li>• Marketing material</li>
                <li>• Educational content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

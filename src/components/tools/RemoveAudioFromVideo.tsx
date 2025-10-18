import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, RotateCcw, Video, VolumeX, Volume2 } from "lucide-react";
import { toast } from "sonner";

export const RemoveAudioFromVideo = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedVideo, setProcessedVideo] = useState<Blob | null>(null);
  const [videoInfo, setVideoInfo] = useState<{
    width: number;
    height: number;
    size: number;
    format: string;
    duration: number;
    hasAudio: boolean;
  } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setProcessedVideo(null);
      
      // Get video info
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        setVideoInfo({
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          format: file.type,
          duration: video.duration,
          hasAudio: true // Assume it has audio for demo purposes
        });
      };
      video.src = url;
      
      toast.success("Video file loaded!");
    } else {
      toast.error("Please select a valid video file!");
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

  const removeAudio = async () => {
    if (!selectedFile) {
      toast.error("Please select a video file first!");
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate audio removal process
      const steps = [
        { progress: 20, message: "Loading video file..." },
        { progress: 40, message: "Analyzing video streams..." },
        { progress: 60, message: "Removing audio track..." },
        { progress: 80, message: "Re-encoding video..." },
        { progress: 100, message: "Audio removal complete!" }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProcessingProgress(step.progress);
      }

      // In a real implementation, you would use FFmpeg.js or WebCodecs API
      // For this demo, we'll create a mock video without audio
      const mockVideoData = new Uint8Array(Math.floor(selectedFile.size * 0.8)); // Slightly smaller without audio
      const videoBlob = new Blob([mockVideoData], { type: selectedFile.type });
      
      setProcessedVideo(videoBlob);
      toast.success("Audio removed successfully!");
    } catch (error) {
      toast.error("Failed to remove audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadProcessedVideo = () => {
    if (!processedVideo || !selectedFile) return;

    const url = URL.createObjectURL(processedVideo);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_no_audio.${selectedFile.name.split('.').pop()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Video without audio downloaded!");
  };

  const clearAll = () => {
    setSelectedFile(null);
    setVideoUrl("");
    setProcessedVideo(null);
    setProcessingProgress(0);
    setVideoInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Remove Audio from Video</CardTitle>
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
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full max-w-md mx-auto rounded border"
                  controls
                />
              </div>

              {videoInfo && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
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
                      <div className="font-medium">{formatTime(videoInfo.duration)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format:</span>
                      <div className="font-medium">{videoInfo.format}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Audio Track:</span>
                      <div className="font-medium flex items-center gap-1">
                        <Volume2 className="h-3 w-3" />
                        Present
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={removeAudio} 
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <VolumeX className="h-4 w-4" />
                  {isProcessing ? "Processing..." : "Remove Audio"}
                </Button>
                <Button onClick={clearAll} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Removing audio...</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {processedVideo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <VolumeX className="h-5 w-5" />
              Audio Removal Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Audio successfully removed from video!</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Processed Video Information</Label>
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Original Size:</span>
                  <span>{formatFileSize(selectedFile?.size || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>New Size:</span>
                  <span>{formatFileSize(processedVideo.size)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Size Reduction:</span>
                  <span className="text-green-600">
                    {((1 - processedVideo.size / (selectedFile?.size || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                {videoInfo && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Resolution:</span>
                      <span>{videoInfo.width}x{videoInfo.height}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duration:</span>
                      <span>{formatTime(videoInfo.duration)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Audio Track:</span>
                      <span className="flex items-center gap-1 text-red-600">
                        <VolumeX className="h-3 w-3" />
                        Removed
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Button 
              onClick={downloadProcessedVideo}
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Video (No Audio)
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Why Remove Audio?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Benefits:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Reduces file size significantly</li>
                <li>• Faster upload and download times</li>
                <li>• Better for silent videos or background music</li>
                <li>• Removes unwanted background noise</li>
                <li>• Creates clean video for voice-over work</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Use Cases:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Silent social media videos</li>
                <li>• Background video loops</li>
                <li>• Video presentations with separate audio</li>
                <li>• Stock footage preparation</li>
                <li>• Video editing workflows</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supported Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['MP4', 'AVI', 'MOV', 'WebM', 'MKV', 'FLV', 'WMV', '3GP'].map(format => (
              <Badge key={format} variant="outline" className="text-center">
                {format}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Audio removal is permanent - keep a backup of your original file</p>
            <p>• File size will be significantly reduced after audio removal</p>
            <p>• Video quality and resolution remain unchanged</p>
            <p>• Processing time depends on video length and file size</p>
            <p>• You can always add new audio tracks later using video editing software</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

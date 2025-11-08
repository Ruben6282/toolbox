import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, RotateCcw, Play, Image, AlertCircle } from "lucide-react";
import { notify } from "@/lib/notify";

interface ThumbnailInfo {
  url: string;
  quality: string;
  resolution: string;
  size: string;
}

export const YouTubeThumbnailDownloader = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [thumbnails, setThumbnails] = useState<ThumbnailInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const generateThumbnails = (id: string): ThumbnailInfo[] => {
    const baseUrl = `https://img.youtube.com/vi/${id}`;
    
    return [
      {
        url: `${baseUrl}/maxresdefault.jpg`,
        quality: "Maximum Resolution",
        resolution: "1280x720",
        size: "HD"
      },
      {
        url: `${baseUrl}/hqdefault.jpg`,
        quality: "High Quality",
        resolution: "480x360",
        size: "HQ"
      },
      {
        url: `${baseUrl}/mqdefault.jpg`,
        quality: "Medium Quality",
        resolution: "320x180",
        size: "MQ"
      },
      {
        url: `${baseUrl}/default.jpg`,
        quality: "Default",
        resolution: "120x90",
        size: "SD"
      },
      {
        url: `${baseUrl}/0.jpg`,
        quality: "First Frame",
        resolution: "480x360",
        size: "First"
      },
      {
        url: `${baseUrl}/1.jpg`,
        quality: "Second Frame",
        resolution: "480x360",
        size: "Second"
      },
      {
        url: `${baseUrl}/2.jpg`,
        quality: "Third Frame",
        resolution: "480x360",
        size: "Third"
      }
    ];
  };

  const getThumbnails = async () => {
    if (!videoUrl.trim()) {
  notify.error("Please enter a YouTube URL!");
      return;
    }

    setIsLoading(true);
    
    try {
      const id = extractVideoId(videoUrl);
      if (!id) {
  notify.error("Invalid YouTube URL! Please check the URL format.");
        setIsLoading(false);
        return;
      }

      setVideoId(id);
      const thumbnailList = generateThumbnails(id);
      setThumbnails(thumbnailList);
      
      // Simulate getting video title (in real implementation, you'd call YouTube API)
      setVideoTitle(`YouTube Video ${id}`);
      
  notify.success("Thumbnails generated successfully!");
    } catch (error) {
  notify.error("Failed to process YouTube URL. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadThumbnail = async (thumbnail: ThumbnailInfo) => {
    try {
      const response = await fetch(thumbnail.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `youtube-thumbnail-${videoId}-${thumbnail.size.toLowerCase()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
  notify.success(`Downloaded ${thumbnail.quality} thumbnail!`);
    } catch (error) {
  notify.error("Failed to download thumbnail. Please try again.");
    }
  };

  const downloadAllThumbnails = async () => {
    for (const thumbnail of thumbnails) {
      try {
        await downloadThumbnail(thumbnail);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download ${thumbnail.quality}:`, error);
      }
    }
  notify.success("All thumbnails downloaded!");
  };

  const clearAll = () => {
    setVideoUrl("");
    setVideoId("");
    setThumbnails([]);
    setVideoTitle("");
  };

  const getQualityColor = (quality: string) => {
    if (quality.includes("Maximum")) return "bg-green-100 text-green-800 border-green-200";
    if (quality.includes("High")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (quality.includes("Medium")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
  <div className="space-y-6 px-2 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle>YouTube Thumbnail Downloader</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">YouTube Video URL</Label>
            <Input
              id="video-url"
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Supports various YouTube URL formats
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              onClick={getThumbnails} 
              disabled={isLoading || !videoUrl.trim()}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Play className="h-4 w-4" />
              {isLoading ? "Processing..." : "Get Thumbnails"}
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Extracting video information...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {thumbnails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-base sm:text-lg">
                <Image className="h-5 w-5" />
                Available Thumbnails
              </span>
              <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={downloadAllThumbnails} variant="outline" size="sm" className="w-full xs:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
                <Button 
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')} 
                  variant="outline" 
                  size="sm"
                  className="w-full xs:w-auto"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Watch Video
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {videoTitle && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium break-words text-xs sm:text-sm">Video: {videoTitle}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-all">ID: {videoId}</div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {thumbnails.map((thumbnail, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="relative">
                      <img
                        src={thumbnail.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-32 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-full h-32 bg-muted rounded border items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <div className="text-xs sm:text-sm">Image not available</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                        <Badge className={getQualityColor(thumbnail.quality) + " text-xs sm:text-sm px-2 py-1"}>
                          {thumbnail.quality}
                        </Badge>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {thumbnail.resolution}
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Size: {thumbnail.size}
                      </div>

                      <Button 
                        onClick={() => downloadThumbnail(thumbnail)}
                        size="sm"
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Supported URL Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="font-mono bg-muted p-2 rounded break-all">
              https://www.youtube.com/watch?v=VIDEO_ID
            </div>
            <div className="font-mono bg-muted p-2 rounded break-all">
              https://youtu.be/VIDEO_ID
            </div>
            <div className="font-mono bg-muted p-2 rounded break-all">
              https://www.youtube.com/embed/VIDEO_ID
            </div>
            <div className="font-mono bg-muted p-2 rounded break-all">
              https://www.youtube.com/v/VIDEO_ID
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thumbnail Quality Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <strong>Maximum Resolution (1280x720):</strong> Best quality, HD resolution
            </div>
            <div>
              <strong>High Quality (480x360):</strong> Good quality, standard resolution
            </div>
            <div>
              <strong>Medium Quality (320x180):</strong> Medium quality, smaller file size
            </div>
            <div>
              <strong>Default (120x90):</strong> Basic quality, smallest file size
            </div>
            <div>
              <strong>Frame Thumbnails (0, 1, 2):</strong> Different frames from the video
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <p>• Thumbnails are provided by YouTube's public API</p>
            <p>• Some thumbnails may not be available for all videos</p>
            <p>• Respect YouTube's terms of service when using thumbnails</p>
            <p>• Thumbnails are for personal use only</p>
            <p>• Always give proper attribution when using thumbnails</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  ExternalLink,
  RotateCcw,
  Play,
  Image,
  AlertCircle,
} from "lucide-react";
import { notify } from "@/lib/notify";

const MAX_URL_LENGTH = 2048;

// Clean user input
const sanitizeUrlInput = (val: string): string => {
  let out = "";
  for (const ch of val) {
    const code = ch.charCodeAt(0);
    if (code >= 32 || code === 9 || code === 10 || code === 13) out += ch;
  }
  return out.slice(0, MAX_URL_LENGTH);
};

interface ThumbnailInfo {
  url: string;
  quality: string;
  resolution: string;
  size: string;
}

export const YouTubeThumbnailDownloader = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [thumbnails, setThumbnails] = useState<ThumbnailInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  /** BLOCK dangerous protocols */
  const isBlockedProtocol = (url: string) =>
    /^(javascript|data|vbscript):/i.test(url.trim());

  /** Extract Video ID (supports Shorts, timestamps, etc.) */
  const extractVideoId = (rawUrl: string): string | null => {
    const sanitized = sanitizeUrlInput(rawUrl);

    if (isBlockedProtocol(sanitized)) return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^?&/#]+)/,
      /youtube\.com\/v\/([^?&/#]+)/,
      /youtube\.com\/shorts\/([^?&/#]+)/,
      /youtube\.com\/clip\/([^?&/#]+)/,
      /v=([^?&]+)/,
    ];

    for (const pattern of patterns) {
      const match = sanitized.match(pattern);
      if (match && match[1]) {
        const id = match[1].trim();
        if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
      }
    }

    return null;
  };

  /** Build thumbnail list */
  const generateThumbnails = (id: string): ThumbnailInfo[] => {
    const baseUrl = `https://img.youtube.com/vi/${id}`;
    return [
      { url: `${baseUrl}/maxresdefault.jpg`, quality: "Maximum Resolution", resolution: "1280x720", size: "HD" },
      { url: `${baseUrl}/hqdefault.jpg`, resolution: "480x360", quality: "High Quality", size: "HQ" },
      { url: `${baseUrl}/mqdefault.jpg`, resolution: "320x180", quality: "Medium Quality", size: "MQ" },
      { url: `${baseUrl}/sddefault.jpg`, resolution: "640x480", quality: "Standard Definition", size: "SD" },
      { url: `${baseUrl}/default.jpg`, resolution: "120x90", quality: "Default", size: "Default" },
      { url: `${baseUrl}/0.jpg`, resolution: "480x360", quality: "Frame 0", size: "F0" },
      { url: `${baseUrl}/1.jpg`, resolution: "480x360", quality: "Frame 1", size: "F1" },
      { url: `${baseUrl}/2.jpg}`, resolution: "480x360", quality: "Frame 2", size: "F2" },
    ];
  };

  /** Fetch and display thumbnails */
  const getThumbnails = async () => {
    if (!videoUrl.trim()) {
      notify.error("Please enter a YouTube URL!");
      return;
    }

    setIsLoading(true);

    try {
      const id = extractVideoId(videoUrl);
      if (!id) {
        notify.error("Invalid YouTube URL! Please check the URL.");
        return;
      }

      setVideoId(id);
      setVideoTitle(`Video ID: ${id}`);
      setThumbnails(generateThumbnails(id));

      notify.success("Thumbnails loaded!");
    } catch {
      notify.error("Unable to process video. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /** Download a single thumbnail */
  const downloadThumbnail = async (thumb: ThumbnailInfo) => {
    try {
      const response = await fetch(thumb.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `youtube-thumbnail-${videoId}-${thumb.size.toLowerCase()}.jpg`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      notify.success(`Downloaded ${thumb.quality}!`);
    } catch {
      notify.error("Failed to download thumbnail.");
    }
  };

  /** Download all thumbnails */
  const downloadAllThumbnails = async () => {
    if (isDownloadingAll) return;
    setIsDownloadingAll(true);

    for (const thumb of thumbnails) {
      await downloadThumbnail(thumb);
      await new Promise((r) => setTimeout(r, 350));
    }

    notify.success("All thumbnails downloaded!");
    setIsDownloadingAll(false);
  };

  /** Clear state */
  const clearAll = () => {
    setVideoUrl("");
    setVideoId("");
    setVideoTitle("");
    setThumbnails([]);
  };

  /** Badge color helper */
  const getQualityColor = (quality: string) => {
    if (quality.includes("Maximum")) return "bg-green-100 text-green-800 border-green-200";
    if (quality.includes("High")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (quality.includes("Medium")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">

      {/* INPUT CARD */}
      <Card>
        <CardHeader>
          <CardTitle>YouTube Thumbnail Downloader</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">YouTube Video URL</Label>
            <Input
              id="video-url"
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
              value={videoUrl}
              onChange={(e) => setVideoUrl(sanitizeUrlInput(e.target.value))}
              maxLength={MAX_URL_LENGTH}
              onKeyDown={(e) => e.key === "Enter" && getThumbnails()}
            />
            <p className="text-sm text-muted-foreground">
              Supports YouTube, Shorts, embeds, and timestamped URLs
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={getThumbnails}
              disabled={isLoading || !videoUrl.trim()}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Play className="h-4 w-4" />
              {isLoading ? "Processing..." : "Get Thumbnails"}
            </Button>

            <Button
              onClick={clearAll}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* THUMBNAILS */}
      {thumbnails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <span className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Available Thumbnails
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={downloadAllThumbnails}
                  variant="outline"
                  disabled={isDownloadingAll}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isDownloadingAll ? "Downloading..." : "Download All"}
                </Button>

                <Button
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank")}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Watch Video
                </Button>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {videoTitle && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{videoTitle}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {thumbnails.map((thumb, i) => (
                <ThumbnailCard
                  key={i}
                  thumbnail={thumb}
                  getQualityColor={getQualityColor}
                  downloadThumbnail={() => downloadThumbnail(thumb)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/** Sub-component for clean separation */
const ThumbnailCard = ({
  thumbnail,
  getQualityColor,
  downloadThumbnail,
}: {
  thumbnail: ThumbnailInfo;
  getQualityColor: (q: string) => string;
  downloadThumbnail: () => void;
}) => {
  const [error, setError] = useState(false);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="relative w-full h-32">
        {!error ? (
          <img
            src={thumbnail.url}
            alt={thumbnail.quality}
            className="w-full h-full object-cover rounded border"
            onError={() => setError(true)}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center rounded border">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-1" />
              <div className="text-xs">Image not available</div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge className={`${getQualityColor(thumbnail.quality)} text-xs px-2`}>
            {thumbnail.quality}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {thumbnail.resolution}
          </span>
        </div>

        <div className="text-xs text-muted-foreground">Size: {thumbnail.size}</div>

        <Button size="sm" className="w-full" onClick={downloadThumbnail}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
};

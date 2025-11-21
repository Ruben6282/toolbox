import { useState, useCallback } from "react";
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

/* ------------------------------------------------------------------
   CONSTANTS & HELPERS
------------------------------------------------------------------ */

const MAX_URL_LENGTH = 2048;

/** Sanitize URL input (removes control chars, trims length) */
const sanitizeUrlInput = (val: string): string => {
  let out = "";
  for (const ch of val) {
    const c = ch.charCodeAt(0);
    if (c >= 32 || c === 9 || c === 10 || c === 13) out += ch;
  }
  return out.slice(0, MAX_URL_LENGTH);
};

/** Block JS/data/vbscript protocols */
const isBlockedProtocol = (url: string) =>
  /^(javascript|data|vbscript):/i.test(url.trim());

/** Safer, more complete YouTube ID extraction */
const extractVideoId = (rawUrl: string): string | null => {
  const url = sanitizeUrlInput(rawUrl);

  if (isBlockedProtocol(url)) return null;

  // Normalized patterns:
  const patterns = [
    /(?:youtube\.com\/watch\?.*?[?&]v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/clip\/)([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

interface ThumbnailInfo {
  url: string;
  quality: string;
  resolution: string;
  size: string;
}

/** Build thumbnail list */
const buildThumbnails = (id: string): ThumbnailInfo[] => {
  const base = `https://img.youtube.com/vi/${id}`;
  return [
    { url: `${base}/maxresdefault.jpg`, quality: "Maximum Resolution", resolution: "1280x720", size: "HD" },
    { url: `${base}/hqdefault.jpg`,       quality: "High Quality",      resolution: "480x360",  size: "HQ" },
    { url: `${base}/sddefault.jpg`,       quality: "Standard Def",      resolution: "640x480",  size: "SD" },
    { url: `${base}/mqdefault.jpg`,       quality: "Medium Quality",    resolution: "320x180",  size: "MQ" },
    { url: `${base}/default.jpg`,         quality: "Default",           resolution: "120x90",   size: "Default" },
    { url: `${base}/0.jpg`,               quality: "Frame 0",           resolution: "480x360",  size: "F0" },
  ];
};

/** Quality tag colors */
const getQualityColor = (q: string) => {
  if (q.includes("Maximum")) return "bg-green-100 text-green-800 border-green-200";
  if (q.includes("High")) return "bg-blue-100 text-blue-800 border-blue-200";
  if (q.includes("Medium")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

/* ------------------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------------ */

export const YouTubeThumbnailDownloader = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId,     setVideoId]     = useState("");
  const [videoTitle,  setVideoTitle]  = useState("");
  const [thumbnails,  setThumbnails]  = useState<ThumbnailInfo[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  /* ------------------------------
     Get thumbnails (safe & idempotent)
  ------------------------------ */
  const getThumbnails = useCallback(async () => {
    if (isLoading) return;            // prevent double-trigger
    if (!videoUrl.trim()) {
      notify.error("Please enter a YouTube URL.");
      return;
    }

    setIsLoading(true);

    try {
      const id = extractVideoId(videoUrl);
      if (!id) {
        notify.error("Invalid YouTube URL. Check the link.");
        setIsLoading(false);
        return;
      }

      setVideoId(id);
      setVideoTitle(`Video ID: ${id}`);
      setThumbnails(buildThumbnails(id));

      notify.success("Thumbnails loaded!");
    } catch (err) {
      notify.error("Unable to load thumbnails.");
    } finally {
      setIsLoading(false);
    }
  }, [videoUrl, isLoading]);

  /* ------------------------------
     Download single thumbnail
  ------------------------------ */
  const downloadThumbnail = async (thumb: ThumbnailInfo) => {
    try {
      const response = await fetch(thumb.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `youtube-${videoId}-${thumb.size}.jpg`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      notify.success(`Downloaded ${thumb.quality}`);
    } catch {
      notify.error("Failed to download thumbnail.");
    }
  };

  /* ------------------------------
     Download all thumbnails
  ------------------------------ */
  const downloadAll = async () => {
    if (isDownloadingAll) return;
    setIsDownloadingAll(true);

    for (const thumb of thumbnails) {
      await downloadThumbnail(thumb);

      // Short delay to avoid overwhelming browser
      await new Promise((r) => setTimeout(r, 300));
    }

    notify.success("All thumbnails downloaded!");
    setIsDownloadingAll(false);
  };

  /* ------------------------------
     Clear state
  ------------------------------ */
  const clearAll = () => {
    setVideoUrl("");
    setVideoId("");
    setVideoTitle("");
    setThumbnails([]);
  };

  /* ------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------ */

  return (
    <div className="space-y-6 px-2 sm:px-0">

      {/* INPUT CARD */}
      <Card>
        <CardHeader>
          <CardTitle>YouTube Thumbnail Downloader</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>YouTube Video URL</Label>
            <Input
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
              value={videoUrl}
              maxLength={MAX_URL_LENGTH}
              onChange={(e) => setVideoUrl(sanitizeUrlInput(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && getThumbnails()}
            />
            <p className="text-sm text-muted-foreground">
              Supports watch URLs, Shorts, embeds & timestamped URLs.
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
                <Image className="h-5 w-5" /> Available Thumbnails
              </span>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={downloadAll}
                  variant="outline"
                  disabled={isDownloadingAll}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isDownloadingAll ? "Downloading..." : "Download All"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    window.open(
                      `https://www.youtube.com/watch?v=${videoId}`,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
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
                  onDownload={() => downloadThumbnail(thumb)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------
   Sub-component: ThumbnailCard
------------------------------------------------------------------ */

const ThumbnailCard = ({
  thumbnail,
  getQualityColor,
  onDownload,
}: {
  thumbnail: ThumbnailInfo;
  getQualityColor: (q: string) => string;
  onDownload: () => void;
}) => {
  const [error, setError] = useState(false);

  return (
    <div className="border rounded-lg p-4 space-y-3 shadow-sm bg-card">
      <div className="relative w-full h-32">
        {!error ? (
          <img
            src={thumbnail.url}
            alt={thumbnail.quality}
            loading="lazy"
            className="w-full h-full object-cover rounded border"
            onError={() => setError(true)}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center rounded border">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-1" />
              <div className="text-xs">Not available</div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge className={`${getQualityColor(thumbnail.quality)} text-xs px-2`}>
            {thumbnail.quality}
          </Badge>
          <span className="text-xs text-muted-foreground">{thumbnail.resolution}</span>
        </div>

        <div className="text-xs text-muted-foreground">
          Size: {thumbnail.size}
        </div>

        <Button size="sm" className="w-full" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" /> Download
        </Button>
      </div>
    </div>
  );
};

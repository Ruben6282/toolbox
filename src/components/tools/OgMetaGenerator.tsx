import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Download, RotateCcw, Share2 } from "lucide-react";
import { notify } from "@/lib/notify";
import {
  sanitizeUrl,
  truncateText,
  encodeMetaTag,
  SEO_LIMITS,
} from "@/lib/security";

/**
 * DoS Protection: Maximum input length for text fields
 * Prevents performance degradation from excessively large inputs
 * that could cause re-render storms or memory issues.
 */
const MAX_INPUT_LENGTH = 2000;

// Allowed OG types
const ALLOWED_OG_TYPES = [
  "website",
  "article",
  "book",
  "profile",
  "video.movie",
  "video.episode",
  "video.tv_show",
  "video.other",
  "music.song",
  "music.album",
  "music.playlist",
] as const;
type OGType = (typeof ALLOWED_OG_TYPES)[number];

// Allowed locales
const ALLOWED_LOCALES = [
  "en_US",
  "en_GB",
  "es_ES",
  "es_MX",
  "fr_FR",
  "de_DE",
  "it_IT",
  "pt_BR",
  "ru_RU",
  "ja_JP",
  "ko_KR",
  "zh_CN",
] as const;
type Locale = (typeof ALLOWED_LOCALES)[number];

// Coerce enum values
const coerceOGType = (val: string): OGType => {
  if (ALLOWED_OG_TYPES.includes(val as OGType)) return val as OGType;
  return "website";
};

const coerceLocale = (val: string): Locale => {
  if (ALLOWED_LOCALES.includes(val as Locale)) return val as Locale;
  return "en_US";
};

// Strip control characters (keep normal whitespace)
const stripControlChars = (value: string): string =>
  // eslint-disable-next-line no-control-regex
  value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

export const OgMetaGenerator = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    url: "",
    type: "website" as OGType,
    siteName: "",
    locale: "en_US" as Locale,
    imageWidth: "1200",
    imageHeight: "630",
    imageAlt: "",
  });

  /**
   * Handle input changes with DoS protection + control-char stripping
   */
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    // DoS Protection: Reject excessively large inputs early
    if (value.length > MAX_INPUT_LENGTH) {
      notify.error(`Input too long (max ${MAX_INPUT_LENGTH} characters)`);
      return;
    }

    const cleaned = stripControlChars(value);

    // Coerce enum values
    let safeValue: string | OGType | Locale = cleaned;
    if (field === "type") safeValue = coerceOGType(cleaned);
    if (field === "locale") safeValue = coerceLocale(cleaned);

    setFormData((prev) => ({ ...prev, [field]: safeValue }));
  };

  /**
   * Build OG + Twitter meta tag string
   * Pure function: NO side effects, safe to call in render.
   */
  const buildOgMeta = useMemo(() => {
    const {
      title,
      description,
      image,
      url,
      type,
      siteName,
      locale,
      imageWidth,
      imageHeight,
      imageAlt,
    } = formData;

    // Encode and enforce OG-specific character limits
    const safeTitle = title
      ? encodeMetaTag(truncateText(title.trim(), SEO_LIMITS.OG_TITLE))
      : "";
    const safeDescription = description
      ? encodeMetaTag(
          truncateText(description.trim(), SEO_LIMITS.OG_DESCRIPTION)
        )
      : "";
    const safeSiteName = siteName
      ? encodeMetaTag(truncateText(siteName.trim(), 100))
      : "";
    const safeImageAlt = imageAlt
      ? encodeMetaTag(truncateText(imageAlt.trim(), 200))
      : "";
    const safeLocale = encodeMetaTag(locale);
    const safeType = encodeMetaTag(type);

    // Validate and sanitize URLs (block dangerous protocols, allow http/https)
    const rawImage = image.trim();
    const rawUrl = url.trim();

    const sanitizedImage = rawImage ? sanitizeUrl(rawImage, false) || "" : "";
    const sanitizedUrl = rawUrl ? sanitizeUrl(rawUrl, false) || "" : "";

    // Sanitize and validate numeric inputs (width/height)
    const widthNum = parseInt(formData.imageWidth.trim(), 10);
    const heightNum = parseInt(formData.imageHeight.trim(), 10);

    const safeImageWidth =
      Number.isFinite(widthNum) && widthNum >= 1 && widthNum <= 4096
        ? widthNum
        : 1200;
    const safeImageHeight =
      Number.isFinite(heightNum) && heightNum >= 1 && heightNum <= 4096
        ? heightNum
        : 630;

    const hasCoreData =
      safeTitle || safeDescription || sanitizedImage || sanitizedUrl || safeSiteName;

    if (!hasCoreData) {
      return "<!-- No Open Graph meta tags configured yet. Fill in the form to generate tags. -->";
    }

    let ogMeta = `<!-- Open Graph Meta Tags -->\n`;

    if (safeTitle) {
      ogMeta += `<meta property="og:title" content="${safeTitle}">\n`;
    }

    if (safeDescription) {
      ogMeta += `<meta property="og:description" content="${safeDescription}">\n`;
    }

    if (sanitizedImage) {
      ogMeta += `<meta property="og:image" content="${encodeMetaTag(
        sanitizedImage
      )}">\n`;
      ogMeta += `<meta property="og:image:width" content="${safeImageWidth}">\n`;
      ogMeta += `<meta property="og:image:height" content="${safeImageHeight}">\n`;
      if (safeImageAlt) {
        ogMeta += `<meta property="og:image:alt" content="${safeImageAlt}">\n`;
      }
    }

    if (sanitizedUrl) {
      ogMeta += `<meta property="og:url" content="${encodeMetaTag(
        sanitizedUrl
      )}">\n`;
    }

    ogMeta += `<meta property="og:type" content="${safeType}">\n`;

    if (safeSiteName) {
      ogMeta += `<meta property="og:site_name" content="${safeSiteName}">\n`;
    }

    ogMeta += `<meta property="og:locale" content="${safeLocale}">\n`;

    // Twitter Card tags
    ogMeta += `\n<!-- Twitter Card Meta Tags -->\n`;
    ogMeta += `<meta name="twitter:card" content="summary_large_image">\n`;

    if (safeTitle) {
      ogMeta += `<meta name="twitter:title" content="${safeTitle}">\n`;
    }

    if (safeDescription) {
      ogMeta += `<meta name="twitter:description" content="${safeDescription}">\n`;
    }

    if (sanitizedImage) {
      ogMeta += `<meta name="twitter:image" content="${encodeMetaTag(
        sanitizedImage
      )}">\n`;
    }

    return ogMeta.trim();
  }, [formData]);

  /**
   * Validate URLs before export (soft HTTPS warning, hard block only on invalid)
   */
  const validateBeforeExport = (): boolean => {
    const { image, url } = formData;

    // Image URL: block if invalid/malicious, warn if HTTP
    if (image.trim()) {
      const sanitized = sanitizeUrl(image.trim(), false);
      if (!sanitized) {
        notify.error("OG Image URL is not a valid or safe URL.");
        return false;
      }
      if (!sanitized.startsWith("https://")) {
        notify.warning(
          "OG Image URL should use HTTPS for better compatibility on social platforms."
        );
      }
    }

    // Page URL: block if invalid/malicious, warn if HTTP
    if (url.trim()) {
      const sanitized = sanitizeUrl(url.trim(), false);
      if (!sanitized) {
        notify.error("OG URL is not a valid or safe URL.");
        return false;
      }
      if (!sanitized.startsWith("https://")) {
        notify.warning(
          "OG URL should use HTTPS for better security and sharing compatibility."
        );
      }
    }

    return true;
  };

  /**
   * Copy to clipboard
   */
  const copyToClipboard = async () => {
    const meta = buildOgMeta;

    // Prevent copying when there is nothing configured
    if (
      !meta ||
      meta.startsWith(
        "<!-- No Open Graph meta tags configured yet."
      )
    ) {
      notify.error("Please fill at least a title, URL, or image before copying.");
      return;
    }

    if (!validateBeforeExport()) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(meta);
        notify.success("OG meta tags copied to clipboard!");
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = meta;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          const ok = document.execCommand("copy");
          if (ok) {
            notify.success("OG meta tags copied to clipboard!");
          } else {
            notify.error("Failed to copy");
          }
        } catch {
          notify.error("Failed to copy");
        } finally {
          document.body.removeChild(textarea);
        }
      }
    } catch {
      notify.error("Failed to copy");
    }
  };

  /**
   * Download OG meta tags as a .html (text/plain for safety)
   */
  const downloadOgMeta = () => {
    const meta = buildOgMeta;

    if (
      !meta ||
      meta.startsWith(
        "<!-- No Open Graph meta tags configured yet."
      )
    ) {
      notify.error("Please fill at least a title, URL, or image before downloading.");
      return;
    }

    if (!validateBeforeExport()) {
      return;
    }

    try {
      const blob = new Blob([meta], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "og-meta-tags.html";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      notify.success("OG meta tags downloaded!");
    } catch {
      notify.error("Failed to download OG meta tags.");
    }
  };

  const clearAll = () => {
    setFormData({
      title: "",
      description: "",
      image: "",
      url: "",
      type: "website",
      siteName: "",
      locale: "en_US",
      imageWidth: "1200",
      imageHeight: "630",
      imageAlt: "",
    });
  };

  // Preview values
  const previewUrl = formData.url || "https://example.com";
  const previewTitle = formData.title || "Your Page Title";
  const previewDescription =
    formData.description || "Your page description will appear here...";

  // Safe preview image (fallback if URL invalid/empty)
  const previewImage = (() => {
    const raw = formData.image.trim();
    if (!raw) {
      return "https://via.placeholder.com/1200x630/4F46E5/FFFFFF?text=Your+Image";
    }
    const sanitized = sanitizeUrl(raw, false);
    if (!sanitized) {
      return "https://via.placeholder.com/1200x630/4F46E5/FFFFFF?text=Image+Not+Valid";
    }
    return sanitized;
  })();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Open Graph Meta Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                placeholder="Enter page title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name</Label>
              <Input
                id="site-name"
                placeholder="Your Website Name"
                value={formData.siteName}
                onChange={(e) => handleInputChange("siteName", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter page description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              placeholder="https://example.com/image.jpg"
              value={formData.image}
              onChange={(e) => handleInputChange("image", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              For best results, use an HTTPS image URL (1200×630px recommended).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">Page URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/page"
                value={formData.url}
                onChange={(e) => handleInputChange("url", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Content Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="music.song">Music Song</SelectItem>
                  <SelectItem value="music.album">Music Album</SelectItem>
                  <SelectItem value="music.playlist">Music Playlist</SelectItem>
                  <SelectItem value="video.movie">Video Movie</SelectItem>
                  <SelectItem value="video.episode">Video Episode</SelectItem>
                  <SelectItem value="video.tv_show">TV Show</SelectItem>
                  <SelectItem value="video.other">Video Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image-width">Image Width</Label>
              <Input
                id="image-width"
                placeholder="1200"
                value={formData.imageWidth}
                onChange={(e) => handleInputChange("imageWidth", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-height">Image Height</Label>
              <Input
                id="image-height"
                placeholder="630"
                value={formData.imageHeight}
                onChange={(e) => handleInputChange("imageHeight", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locale">Locale</Label>
              <Select
                value={formData.locale}
                onValueChange={(value) => handleInputChange("locale", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select locale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_US">English (US)</SelectItem>
                  <SelectItem value="en_GB">English (UK)</SelectItem>
                  <SelectItem value="es_ES">Spanish (Spain)</SelectItem>
                  <SelectItem value="es_MX">Spanish (Mexico)</SelectItem>
                  <SelectItem value="fr_FR">French</SelectItem>
                  <SelectItem value="de_DE">German</SelectItem>
                  <SelectItem value="it_IT">Italian</SelectItem>
                  <SelectItem value="pt_BR">Portuguese (Brazil)</SelectItem>
                  <SelectItem value="ru_RU">Russian</SelectItem>
                  <SelectItem value="ja_JP">Japanese</SelectItem>
                  <SelectItem value="ko_KR">Korean</SelectItem>
                  <SelectItem value="zh_CN">Chinese (Simplified)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-alt">Image Alt Text</Label>
            <Input
              id="image-alt"
              placeholder="Describe your image for accessibility"
              value={formData.imageAlt}
              onChange={(e) => handleInputChange("imageAlt", e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Copy className="h-4 w-4" />
              Copy Meta Tags
            </Button>
            <Button
              onClick={downloadOgMeta}
              variant="outline"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={clearAll}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Social Media Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-3 sm:p-4 bg-white dark:bg-zinc-900">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-all">
                  <span>{previewUrl}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-base sm:text-lg text-blue-600 dark:text-blue-400 hover:underline cursor-pointer break-words">
                    {previewTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 break-words">
                    {previewDescription}
                  </p>
                </div>
                <div className="relative">
                  <img
                    src={previewImage}
                    alt={formData.imageAlt || "Preview image"}
                    className="w-full h-32 sm:h-48 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/1200x630/4F46E5/FFFFFF?text=Image+Not+Found";
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Meta Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm break-words">
                {buildOgMeta}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Graph Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use high-quality images (1200×630px recommended).</li>
            <li>• Keep titles under ~60 characters for optimal display.</li>
            <li>• Descriptions should be around 150–160 characters.</li>
            <li>• Use absolute URLs for images and page URLs.</li>
            <li>• Prefer HTTPS for both OG URL and OG image.</li>
            <li>• Test your meta tags with Facebook’s Sharing Debugger.</li>
            <li>• Include alt text for better accessibility.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

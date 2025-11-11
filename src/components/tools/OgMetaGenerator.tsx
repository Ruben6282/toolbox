import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, RotateCcw, Share2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { sanitizeUrl, truncateText, encodeMetaTag, sanitizeNumber, SEO_LIMITS } from "@/lib/security";

/**
 * DoS Protection: Maximum input length for text fields
 * Prevents performance degradation from excessively large inputs
 * that could cause re-render storms or memory issues.
 */
const MAX_INPUT_LENGTH = 2000;

export const OgMetaGenerator = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    url: "",
    type: "website",
    siteName: "",
    locale: "en_US",
    imageWidth: "1200",
    imageHeight: "630",
    imageAlt: ""
  });

  /**
   * Handle input changes with DoS protection
   * Rejects inputs exceeding MAX_INPUT_LENGTH to prevent performance issues
   */
  const handleInputChange = (field: string, value: string) => {
    // DoS Protection: Reject excessively large inputs early
    if (value.length > MAX_INPUT_LENGTH) {
      notify.error(`Input too long (max ${MAX_INPUT_LENGTH} characters)`);
      return;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateOgMeta = () => {
    const {
      title, description, image, url, type, siteName, locale,
      imageWidth, imageHeight, imageAlt
    } = formData;

    // Encode and enforce OG-specific character limits
    const safeTitle = encodeMetaTag(truncateText(title, SEO_LIMITS.OG_TITLE));
    const safeDescription = encodeMetaTag(truncateText(description, SEO_LIMITS.OG_DESCRIPTION));
    const safeSiteName = encodeMetaTag(truncateText(siteName, 100));
    const safeImageAlt = encodeMetaTag(truncateText(imageAlt, 200));
    const safeLocale = encodeMetaTag(locale);
    const safeType = encodeMetaTag(type);
    
    // Validate and sanitize URLs (prefer HTTPS for images)
    const safeImage = image ? (sanitizeUrl(image, false) || '') : '';
    const safeUrl = url ? (sanitizeUrl(url, false) || '') : '';
    
    // Validate image URLs use HTTPS
    if (safeImage && !safeImage.startsWith('https://')) {
      notify.warning('OG Image URL should use HTTPS for better compatibility');
      return;
    }
    if (safeUrl && !safeUrl.startsWith('https://')) {
      notify.warning('OG URL should use HTTPS for better security');
      return;
    }
    
    // Sanitize and validate numeric inputs
    const safeImageWidth = sanitizeNumber(imageWidth, 1, 4096) || 1200;
    const safeImageHeight = sanitizeNumber(imageHeight, 1, 4096) || 630;

    let ogMeta = `<!-- Open Graph Meta Tags -->\n`;

    if (safeTitle) {
      ogMeta += `<meta property="og:title" content="${safeTitle}">\n`;
    }

    if (safeDescription) {
      ogMeta += `<meta property="og:description" content="${safeDescription}">\n`;
    }

    if (safeImage) {
      ogMeta += `<meta property="og:image" content="${encodeMetaTag(safeImage)}">\n`;
      ogMeta += `<meta property="og:image:width" content="${safeImageWidth}">\n`;
      ogMeta += `<meta property="og:image:height" content="${safeImageHeight}">\n`;
      if (safeImageAlt) {
        ogMeta += `<meta property="og:image:alt" content="${safeImageAlt}">\n`;
      }
    }

    if (safeUrl) {
      ogMeta += `<meta property="og:url" content="${encodeMetaTag(safeUrl)}">\n`;
    }

    ogMeta += `<meta property="og:type" content="${safeType}">\n`;

    if (safeSiteName) {
      ogMeta += `<meta property="og:site_name" content="${safeSiteName}">\n`;
    }

    ogMeta += `<meta property="og:locale" content="${safeLocale}">\n`;

    // Add Twitter Card tags
    ogMeta += `\n<!-- Twitter Card Meta Tags -->\n`;
    ogMeta += `<meta name="twitter:card" content="summary_large_image">\n`;
    
    if (safeTitle) {
      ogMeta += `<meta name="twitter:title" content="${safeTitle}">\n`;
    }
    
    if (safeDescription) {
      ogMeta += `<meta name="twitter:description" content="${safeDescription}">\n`;
    }
    
    if (safeImage) {
      ogMeta += `<meta name="twitter:image" content="${safeImage}">\n`;
    }

    return ogMeta;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateOgMeta());
  notify.success("OG Meta tags copied!");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadOgMeta = () => {
    // Use text/plain to prevent HTML execution in browser
    const blob = new Blob([generateOgMeta()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'og-meta-tags.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("OG Meta tags downloaded!");
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
      imageAlt: ""
    });
  };

  const previewUrl = formData.url || "https://example.com";
  const previewTitle = formData.title || "Your Page Title";
  const previewDescription = formData.description || "Your page description will appear here...";
  const previewImage = formData.image || "https://via.placeholder.com/1200x630/4F46E5/FFFFFF?text=Your+Image";

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
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name</Label>
              <Input
                id="site-name"
                placeholder="Your Website Name"
                value={formData.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter page description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              placeholder="https://example.com/image.jpg"
              value={formData.image}
              onChange={(e) => handleInputChange('image', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">Page URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/page"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Content Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="music.song">Music Song</SelectItem>
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
                onChange={(e) => handleInputChange('imageWidth', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-height">Image Height</Label>
              <Input
                id="image-height"
                placeholder="630"
                value={formData.imageHeight}
                onChange={(e) => handleInputChange('imageHeight', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locale">Locale</Label>
              <Select value={formData.locale} onValueChange={(value) => handleInputChange('locale', value)}>
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
              onChange={(e) => handleInputChange('imageAlt', e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={copyToClipboard} className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Copy className="h-4 w-4" />
              Copy Meta Tags
            </Button>
            <Button onClick={downloadOgMeta} variant="outline" className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Social Media Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-3 sm:p-4 bg-white">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 break-all">
                  <span>{previewUrl}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-base sm:text-lg text-blue-600 hover:underline cursor-pointer break-words">
                    {previewTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 break-words">
                    {previewDescription}
                  </p>
                </div>
                <div className="relative">
                  <img
                    src={previewImage}
                    alt={formData.imageAlt || "Preview image"}
                    className="w-full h-32 sm:h-48 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/1200x630/4F46E5/FFFFFF?text=Image+Not+Found";
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
                {generateOgMeta()}
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
            <li>• Use high-quality images (1200x630px recommended)</li>
            <li>• Keep titles under 60 characters for optimal display</li>
            <li>• Descriptions should be 150-160 characters</li>
            <li>• Use absolute URLs for images and page URLs</li>
            <li>• Test your meta tags with Facebook's Sharing Debugger</li>
            <li>• Include alt text for better accessibility</li>
            <li>• Use appropriate content types for better categorization</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

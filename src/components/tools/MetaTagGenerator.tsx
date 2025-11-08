import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, RotateCcw } from "lucide-react";
import { notify } from "@/lib/notify";

export const MetaTagGenerator = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    keywords: "",
    author: "",
    robots: "index, follow",
    language: "en",
    charset: "UTF-8",
    viewport: "width=device-width, initial-scale=1.0",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    ogUrl: "",
    ogType: "website",
    twitterCard: "summary_large_image",
    twitterSite: "",
    twitterCreator: "",
    canonicalUrl: "",
    themeColor: "#000000"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateMetaTags = () => {
    const {
      title, description, keywords, author, robots, language, charset, viewport,
      ogTitle, ogDescription, ogImage, ogUrl, ogType,
      twitterCard, twitterSite, twitterCreator,
      canonicalUrl, themeColor
    } = formData;

    let metaTags = `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="${charset}">
    <meta name="viewport" content="${viewport}">
    <title>${title}</title>
    <meta name="description" content="${description}">`;

    if (keywords) {
      metaTags += `\n    <meta name="keywords" content="${keywords}">`;
    }

    if (author) {
      metaTags += `\n    <meta name="author" content="${author}">`;
    }

    metaTags += `\n    <meta name="robots" content="${robots}">`;

    if (themeColor) {
      metaTags += `\n    <meta name="theme-color" content="${themeColor}">`;
    }

    // Open Graph tags
    if (ogTitle || title) {
      metaTags += `\n    <meta property="og:title" content="${ogTitle || title}">`;
    }

    if (ogDescription || description) {
      metaTags += `\n    <meta property="og:description" content="${ogDescription || description}">`;
    }

    if (ogImage) {
      metaTags += `\n    <meta property="og:image" content="${ogImage}">`;
    }

    if (ogUrl) {
      metaTags += `\n    <meta property="og:url" content="${ogUrl}">`;
    }

    metaTags += `\n    <meta property="og:type" content="${ogType}">`;

    // Twitter Card tags
    metaTags += `\n    <meta name="twitter:card" content="${twitterCard}">`;

    if (twitterSite) {
      metaTags += `\n    <meta name="twitter:site" content="${twitterSite}">`;
    }

    if (twitterCreator) {
      metaTags += `\n    <meta name="twitter:creator" content="${twitterCreator}">`;
    }

    if (ogTitle || title) {
      metaTags += `\n    <meta name="twitter:title" content="${ogTitle || title}">`;
    }

    if (ogDescription || description) {
      metaTags += `\n    <meta name="twitter:description" content="${ogDescription || description}">`;
    }

    if (ogImage) {
      metaTags += `\n    <meta name="twitter:image" content="${ogImage}">`;
    }

    // Canonical URL
    if (canonicalUrl) {
      metaTags += `\n    <link rel="canonical" href="${canonicalUrl}">`;
    }

    metaTags += `\n</head>
<body>
    <!-- Your content here -->
</body>
</html>`;

    return metaTags;
  };

  const copyToClipboard = async () => {
    try {
      // Modern approach - works on most browsers including mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generateMetaTags());
        notify.success("Meta tags copied to clipboard!");
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement("textarea");
        textArea.value = generateMetaTags();
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            notify.success("Meta tags copied to clipboard!");
          } else {
            notify.error("Failed to copy!");
          }
        } catch (err) {
          console.error('Fallback: Failed to copy', err);
          notify.error("Failed to copy to clipboard!");
        }
        
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      notify.error("Failed to copy to clipboard!");
    }
  };

  const downloadMetaTags = () => {
    const blob = new Blob([generateMetaTags()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meta-tags.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("Meta tags downloaded!");
  };

  const clearAll = () => {
    setFormData({
      title: "",
      description: "",
      keywords: "",
      author: "",
      robots: "index, follow",
      language: "en",
      charset: "UTF-8",
      viewport: "width=device-width, initial-scale=1.0",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      ogUrl: "",
      ogType: "website",
      twitterCard: "summary_large_image",
      twitterSite: "",
      twitterCreator: "",
      canonicalUrl: "",
      themeColor: "#000000"
    });
    notify.success("Form cleared!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meta Tag Generator</CardTitle>
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
              <Label htmlFor="description">Meta Description</Label>
              <Textarea
                id="description"
                placeholder="Enter meta description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                placeholder="keyword1, keyword2, keyword3"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                placeholder="Author name"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="robots">Robots</Label>
              <Select value={formData.robots} onValueChange={(value) => handleInputChange('robots', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select robots directive" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="index, follow">Index, Follow</SelectItem>
                  <SelectItem value="noindex, follow">No Index, Follow</SelectItem>
                  <SelectItem value="index, nofollow">Index, No Follow</SelectItem>
                  <SelectItem value="noindex, nofollow">No Index, No Follow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Open Graph Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="og-title">OG Title</Label>
                <Input
                  id="og-title"
                  placeholder="Open Graph title"
                  value={formData.ogTitle}
                  onChange={(e) => handleInputChange('ogTitle', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-description">OG Description</Label>
                <Textarea
                  id="og-description"
                  placeholder="Open Graph description"
                  value={formData.ogDescription}
                  onChange={(e) => handleInputChange('ogDescription', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-image">OG Image URL</Label>
                <Input
                  id="og-image"
                  placeholder="https://example.com/image.jpg"
                  value={formData.ogImage}
                  onChange={(e) => handleInputChange('ogImage', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-url">OG URL</Label>
                <Input
                  id="og-url"
                  placeholder="https://example.com/page"
                  value={formData.ogUrl}
                  onChange={(e) => handleInputChange('ogUrl', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Twitter Card Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twitter-site">Twitter Site</Label>
                <Input
                  id="twitter-site"
                  placeholder="@yourwebsite"
                  value={formData.twitterSite}
                  onChange={(e) => handleInputChange('twitterSite', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter-creator">Twitter Creator</Label>
                <Input
                  id="twitter-creator"
                  placeholder="@yourusername"
                  value={formData.twitterCreator}
                  onChange={(e) => handleInputChange('twitterCreator', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Additional Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="canonical-url">Canonical URL</Label>
                <Input
                  id="canonical-url"
                  placeholder="https://example.com/canonical-page"
                  value={formData.canonicalUrl}
                  onChange={(e) => handleInputChange('canonicalUrl', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme-color">Theme Color</Label>
                <Input
                  id="theme-color"
                  type="color"
                  value={formData.themeColor}
                  onChange={(e) => handleInputChange('themeColor', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={copyToClipboard} className="flex-1 w-full sm:w-auto">
              <Copy className="h-4 w-4 mr-2" />
              Copy Meta Tags
            </Button>
            <Button onClick={downloadMetaTags} variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Download HTML
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
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
              {generateMetaTags()}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Keep title tags between 50-60 characters for optimal display</li>
            <li>• Meta descriptions should be 150-160 characters</li>
            <li>• Use relevant keywords naturally in your content</li>
            <li>• Include Open Graph tags for better social media sharing</li>
            <li>• Set up canonical URLs to avoid duplicate content issues</li>
            <li>• Use descriptive alt text for images</li>
            <li>• Ensure your site is mobile-friendly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

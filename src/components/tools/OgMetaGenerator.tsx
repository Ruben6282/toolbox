import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, RotateCcw, Share2 } from "lucide-react";
import { toast } from "sonner";

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateOgMeta = () => {
    const {
      title, description, image, url, type, siteName, locale,
      imageWidth, imageHeight, imageAlt
    } = formData;

    let ogMeta = `<!-- Open Graph Meta Tags -->\n`;

    if (title) {
      ogMeta += `<meta property="og:title" content="${title}">\n`;
    }

    if (description) {
      ogMeta += `<meta property="og:description" content="${description}">\n`;
    }

    if (image) {
      ogMeta += `<meta property="og:image" content="${image}">\n`;
      ogMeta += `<meta property="og:image:width" content="${imageWidth}">\n`;
      ogMeta += `<meta property="og:image:height" content="${imageHeight}">\n`;
      if (imageAlt) {
        ogMeta += `<meta property="og:image:alt" content="${imageAlt}">\n`;
      }
    }

    if (url) {
      ogMeta += `<meta property="og:url" content="${url}">\n`;
    }

    ogMeta += `<meta property="og:type" content="${type}">\n`;

    if (siteName) {
      ogMeta += `<meta property="og:site_name" content="${siteName}">\n`;
    }

    ogMeta += `<meta property="og:locale" content="${locale}">\n`;

    // Add Twitter Card tags
    ogMeta += `\n<!-- Twitter Card Meta Tags -->\n`;
    ogMeta += `<meta name="twitter:card" content="summary_large_image">\n`;
    
    if (title) {
      ogMeta += `<meta name="twitter:title" content="${title}">\n`;
    }
    
    if (description) {
      ogMeta += `<meta name="twitter:description" content="${description}">\n`;
    }
    
    if (image) {
      ogMeta += `<meta name="twitter:image" content="${image}">\n`;
    }

    return ogMeta;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateOgMeta());
      toast.success("OG Meta tags copied!");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadOgMeta = () => {
    const blob = new Blob([generateOgMeta()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'og-meta-tags.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("OG Meta tags downloaded!");
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

          <div className="flex gap-2">
            <Button onClick={copyToClipboard} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy Meta Tags
            </Button>
            <Button onClick={downloadOgMeta} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={clearAll} variant="outline">
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
            <div className="border rounded-lg p-4 bg-white">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{previewUrl}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-blue-600 hover:underline cursor-pointer">
                    {previewTitle}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {previewDescription}
                  </p>
                </div>
                <div className="relative">
                  <img
                    src={previewImage}
                    alt={formData.imageAlt || "Preview image"}
                    className="w-full h-48 object-cover rounded"
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
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
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

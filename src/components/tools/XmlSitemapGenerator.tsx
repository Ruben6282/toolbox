import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, RotateCcw, Plus, Trash2, Map } from "lucide-react";
import { toast } from "sonner";

interface SitemapUrl {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

export const XmlSitemapGenerator = () => {
  const [baseUrl, setBaseUrl] = useState("");
  const [urls, setUrls] = useState<SitemapUrl[]>([
    { url: "", lastmod: new Date().toISOString().split('T')[0], changefreq: "weekly", priority: "1.0" }
  ]);
  const [generatedSitemap, setGeneratedSitemap] = useState("");

  const addUrl = () => {
    setUrls([...urls, { 
      url: "", 
      lastmod: new Date().toISOString().split('T')[0], 
      changefreq: "weekly", 
      priority: "0.5" 
    }]);
  };

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, field: keyof SitemapUrl, value: string) => {
    const updated = [...urls];
    updated[index] = { ...updated[index], [field]: value };
    setUrls(updated);
  };

  const generateSitemap = () => {
    if (!baseUrl.trim()) {
      toast.error("Please enter a base URL!");
      return;
    }

    const validUrls = urls.filter(url => url.url.trim());
    if (validUrls.length === 0) {
      toast.error("Please add at least one URL!");
      return;
    }

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    validUrls.forEach((urlData) => {
      const fullUrl = urlData.url.startsWith('http') ? urlData.url : `${baseUrl.replace(/\/$/, '')}/${urlData.url.replace(/^\//, '')}`;
      
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${fullUrl}</loc>\n`;
      sitemap += `    <lastmod>${urlData.lastmod}</lastmod>\n`;
      sitemap += `    <changefreq>${urlData.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${urlData.priority}</priority>\n`;
      sitemap += `  </url>\n`;
    });

    sitemap += `</urlset>`;

    setGeneratedSitemap(sitemap);
    toast.success("XML Sitemap generated!");
  };

  const generateFromText = () => {
    const textarea = document.getElementById('url-list') as HTMLTextAreaElement;
    if (!textarea?.value.trim()) {
      toast.error("Please enter URLs in the text area!");
      return;
    }

    const urlList = textarea.value.split('\n').filter(url => url.trim());
    const newUrls = urlList.map(url => ({
      url: url.trim(),
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "weekly",
      priority: "0.5"
    }));

    setUrls(newUrls);
    toast.success(`${newUrls.length} URLs added!`);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedSitemap);
      toast.success("Sitemap copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadSitemap = () => {
    const blob = new Blob([generatedSitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Sitemap downloaded!");
  };

  const clearAll = () => {
    setBaseUrl("");
    setUrls([{ url: "", lastmod: new Date().toISOString().split('T')[0], changefreq: "weekly", priority: "1.0" }]);
    setGeneratedSitemap("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>XML Sitemap Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base-url">Base URL</Label>
            <Input
              id="base-url"
              placeholder="https://example.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Your website's base URL (e.g., https://example.com)
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>URLs ({urls.length} entries)</Label>
              <Button onClick={addUrl} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add URL
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {urls.map((urlData, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">URL {index + 1}</h4>
                    {urls.length > 1 && (
                      <Button
                        onClick={() => removeUrl(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>URL Path</Label>
                      <Input
                        placeholder="/page or full URL"
                        value={urlData.url}
                        onChange={(e) => updateUrl(index, 'url', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Last Modified</Label>
                      <Input
                        type="date"
                        value={urlData.lastmod}
                        onChange={(e) => updateUrl(index, 'lastmod', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Change Frequency</Label>
                      <Select value={urlData.changefreq} onValueChange={(value) => updateUrl(index, 'changefreq', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="always">Always</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={urlData.priority} onValueChange={(value) => updateUrl(index, 'priority', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1.0">1.0 (Highest)</SelectItem>
                          <SelectItem value="0.9">0.9</SelectItem>
                          <SelectItem value="0.8">0.8</SelectItem>
                          <SelectItem value="0.7">0.7</SelectItem>
                          <SelectItem value="0.6">0.6</SelectItem>
                          <SelectItem value="0.5">0.5 (Default)</SelectItem>
                          <SelectItem value="0.4">0.4</SelectItem>
                          <SelectItem value="0.3">0.3</SelectItem>
                          <SelectItem value="0.2">0.2</SelectItem>
                          <SelectItem value="0.1">0.1 (Lowest)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url-list">Bulk Add URLs (one per line)</Label>
            <Textarea
              id="url-list"
              placeholder="/page1&#10;/page2&#10;/blog/post1&#10;https://example.com/external-page"
              rows={4}
            />
            <Button onClick={generateFromText} variant="outline" size="sm">
              Add URLs from List
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateSitemap} className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Generate Sitemap
            </Button>
            <Button onClick={clearAll} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedSitemap && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated XML Sitemap
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={downloadSitemap} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
                {generatedSitemap}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>XML Sitemap Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Keep sitemaps under 50MB and 50,000 URLs</li>
            <li>• Use absolute URLs for better indexing</li>
            <li>• Update lastmod dates when content changes</li>
            <li>• Set appropriate priorities (1.0 for homepage, 0.5-0.8 for important pages)</li>
            <li>• Use change frequency to indicate how often content updates</li>
            <li>• Submit sitemaps to Google Search Console and Bing Webmaster Tools</li>
            <li>• Include only canonical URLs (avoid duplicates)</li>
            <li>• Place sitemap.xml in your website's root directory</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Priority Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>1.0:</strong> Homepage, main landing pages</div>
            <div><strong>0.8-0.9:</strong> Important category pages, product pages</div>
            <div><strong>0.6-0.7:</strong> Blog posts, articles, secondary pages</div>
            <div><strong>0.4-0.5:</strong> Archive pages, tag pages, less important content</div>
            <div><strong>0.1-0.3:</strong> Footer pages, legal pages, old content</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

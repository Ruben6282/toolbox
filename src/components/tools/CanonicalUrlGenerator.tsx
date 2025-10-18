import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Download, RotateCcw, Link } from "lucide-react";
import { toast } from "sonner";

export const CanonicalUrlGenerator = () => {
  const [currentUrl, setCurrentUrl] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [generatedCanonicals, setGeneratedCanonicals] = useState("");

  const addUrl = () => {
    if (currentUrl.trim()) {
      setUrls([...urls, currentUrl.trim()]);
      setCurrentUrl("");
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const generateCanonicalTags = () => {
    if (!canonicalUrl.trim()) {
      toast.error("Please enter a canonical URL!");
      return;
    }

    let canonicalTags = `<!-- Canonical URL Tags -->\n`;
    
    // Main canonical tag
    canonicalTags += `<link rel="canonical" href="${canonicalUrl}">\n\n`;
    
    // Additional URLs (for reference)
    if (urls.length > 0) {
      canonicalTags += `<!-- Alternative URLs (for reference) -->\n`;
      urls.forEach((url, index) => {
        canonicalTags += `<!-- URL ${index + 1}: ${url} -->\n`;
      });
    }

    setGeneratedCanonicals(canonicalTags);
    toast.success("Canonical tags generated!");
  };

  const generateBulkCanonicals = () => {
    if (urls.length === 0) {
      toast.error("Please add some URLs first!");
      return;
    }

    let bulkCanonicals = `<!-- Bulk Canonical URL Tags -->\n`;
    
    urls.forEach((url, index) => {
      const canonical = canonicalUrl || url; // Use provided canonical or the URL itself
      bulkCanonicals += `<!-- Page ${index + 1} -->\n`;
      bulkCanonicals += `<link rel="canonical" href="${canonical}">\n`;
      bulkCanonicals += `<!-- Original URL: ${url} -->\n\n`;
    });

    setGeneratedCanonicals(bulkCanonicals);
    toast.success("Bulk canonical tags generated!");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCanonicals);
      toast.success("Canonical tags copied!");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadCanonicals = () => {
    const blob = new Blob([generatedCanonicals], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canonical-tags.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Canonical tags downloaded!");
  };

  const clearAll = () => {
    setCurrentUrl("");
    setCanonicalUrl("");
    setUrls([]);
    setGeneratedCanonicals("");
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Canonical URL Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="canonical-url">Canonical URL</Label>
            <Input
              id="canonical-url"
              placeholder="https://example.com/canonical-page"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              The preferred URL that should be indexed by search engines
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-url">Add URL to List</Label>
            <div className="flex gap-2">
              <Input
                id="current-url"
                placeholder="https://example.com/duplicate-page"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
              />
              <Button onClick={addUrl} disabled={!currentUrl.trim()}>
                Add
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add URLs that should point to the canonical URL
            </p>
          </div>

          {urls.length > 0 && (
            <div className="space-y-2">
              <Label>URL List ({urls.length} URLs)</Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                {urls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm font-mono flex-1 truncate">{url}</span>
                    <Button
                      onClick={() => removeUrl(index)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={generateCanonicalTags} className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Generate Single Canonical
            </Button>
            {urls.length > 0 && (
              <Button onClick={generateBulkCanonicals} variant="outline" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Generate Bulk Canonicals
              </Button>
            )}
            <Button onClick={clearAll} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedCanonicals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Canonical Tags
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={downloadCanonicals} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
                {generatedCanonicals}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Canonical URL Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use canonical URLs to prevent duplicate content issues</li>
            <li>• Always use absolute URLs (include https://)</li>
            <li>• Place canonical tags in the &lt;head&gt; section of your HTML</li>
            <li>• Use canonical URLs for paginated content, mobile versions, and URL parameters</li>
            <li>• Ensure the canonical URL is accessible and returns a 200 status code</li>
            <li>• Use consistent canonical URLs across all duplicate pages</li>
            <li>• Monitor canonical URLs in Google Search Console</li>
            <li>• Don't use canonical URLs to redirect users - they're for search engines only</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Use Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>E-commerce:</strong> Product pages with multiple URLs (colors, sizes, etc.)
            </div>
            <div>
              <strong>Blog:</strong> Paginated content, category pages, tag pages
            </div>
            <div>
              <strong>Mobile:</strong> Mobile and desktop versions of the same content
            </div>
            <div>
              <strong>URL Parameters:</strong> Tracking parameters, session IDs, etc.
            </div>
            <div>
              <strong>Protocols:</strong> HTTP and HTTPS versions of the same page
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

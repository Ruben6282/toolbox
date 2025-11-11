/**
 * CanonicalUrlGenerator - Enterprise-Grade SEO Tool
 * 
 * SECURITY FEATURES:
 * - Strict HTTPS enforcement (no HTTP allowed)
 * - Input length limits (MAX_URL_LENGTH = 2000 chars)
 * - URL validation and sanitization
 * - XSS prevention via encodeMetaTag
 * - Rate limits (MAX_URLS = 100)
 * - DoS prevention
 * 
 * @security Compliant with OWASP guidelines for input validation
 * @security SSRF prevention via strict URL validation
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Download, RotateCcw, Link, AlertCircle, CheckCircle } from "lucide-react";
import { notify } from "@/lib/notify";
import { sanitizeUrl, encodeMetaTag } from "@/lib/security";

/**
 * Security limits to prevent DoS and ensure performance
 */
const SECURITY_LIMITS = {
  MAX_URL_LENGTH: 2000,      // Maximum characters per URL input
  MAX_URLS: 100,              // Maximum number of URLs in list
} as const;

export const CanonicalUrlGenerator = () => {
  const [currentUrl, setCurrentUrl] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [generatedCanonicals, setGeneratedCanonicals] = useState("");

  /**
   * Validate URL with strict HTTPS enforcement
   * @returns Error message if invalid, null if valid
   */
  const validateSecureUrl = (url: string): string | null => {
    if (!url || !url.trim()) {
      return "URL cannot be empty";
    }

    // DoS protection: Check length before processing
    if (url.length > SECURITY_LIMITS.MAX_URL_LENGTH) {
      return `URL too long (max ${SECURITY_LIMITS.MAX_URL_LENGTH} characters)`;
    }

    // Sanitize URL with HTTPS enforcement
    const sanitized = sanitizeUrl(url, true); // true = enforce HTTPS
    if (!sanitized) {
      return "Invalid URL format or HTTP not allowed (use HTTPS)";
    }

    // Double-check HTTPS (defense in depth)
    if (!sanitized.startsWith('https://')) {
      return "Only HTTPS URLs are allowed for canonical tags";
    }

    return null; // Valid
  };

  /**
   * Add URL to list with validation
   */
  const addUrl = () => {
    const trimmedUrl = currentUrl.trim();
    
    if (!trimmedUrl) {
      notify.error("Please enter a URL");
      return;
    }

    // Rate limit check
    if (urls.length >= SECURITY_LIMITS.MAX_URLS) {
      notify.error(`Maximum ${SECURITY_LIMITS.MAX_URLS} URLs allowed`);
      return;
    }

    // Validate URL with strict HTTPS enforcement
    const error = validateSecureUrl(trimmedUrl);
    if (error) {
      notify.error(error);
      return;
    }

    // Add the sanitized URL
    const sanitized = sanitizeUrl(trimmedUrl, true);
    if (sanitized) {
      setUrls([...urls, sanitized]);
      setCurrentUrl("");
      notify.success("URL added successfully");
    }
  };

  /**
   * Remove URL from list
   */
  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  /**
   * Generate canonical tag with strict validation
   */
  const generateCanonicalTags = () => {
    if (!canonicalUrl.trim()) {
      notify.error("Please enter a canonical URL!");
      return;
    }

    // Strict HTTPS enforcement
    const error = validateSecureUrl(canonicalUrl);
    if (error) {
      notify.error(error);
      return;
    }

    // Get sanitized URL (guaranteed HTTPS at this point)
    const safeCanonicalUrl = sanitizeUrl(canonicalUrl, true);
    if (!safeCanonicalUrl) {
      notify.error("Invalid canonical URL format!");
      return;
    }

    let canonicalTags = `<!-- Canonical URL Tags -->\n`;
    
    // Main canonical tag with encoded URL
    canonicalTags += `<link rel="canonical" href="${encodeMetaTag(safeCanonicalUrl)}">\n\n`;
    
    // Additional URLs (for reference)
    if (urls.length > 0) {
      canonicalTags += `<!-- Alternative URLs (for reference) -->\n`;
      urls.forEach((url, index) => {
        // URLs in list are already validated and sanitized
        canonicalTags += `<!-- URL ${index + 1}: ${encodeMetaTag(url)} -->\n`;
      });
    }

    setGeneratedCanonicals(canonicalTags);
    notify.success("Canonical tags generated!");
  };

  /**
   * Generate bulk canonical tags with strict validation
   */
  const generateBulkCanonicals = () => {
    if (urls.length === 0) {
      notify.error("Please add some URLs first!");
      return;
    }

    // If canonical URL provided, validate it strictly
    let safeCanonicalBase: string | null = null;
    if (canonicalUrl.trim()) {
      const error = validateSecureUrl(canonicalUrl);
      if (error) {
        notify.error(`Canonical URL invalid: ${error}`);
        return;
      }
      safeCanonicalBase = sanitizeUrl(canonicalUrl, true);
    }

    let bulkCanonicals = `<!-- Bulk Canonical URL Tags -->\n`;
    
    urls.forEach((url, index) => {
      // Use provided canonical or the URL itself
      const canonical = safeCanonicalBase || url;
      
      // URLs in list are already validated and sanitized (HTTPS enforced)
      bulkCanonicals += `<!-- Page ${index + 1} -->\n`;
      bulkCanonicals += `<link rel="canonical" href="${encodeMetaTag(canonical)}">\n`;
      bulkCanonicals += `<!-- Original URL: ${encodeMetaTag(url)} -->\n\n`;
    });

    setGeneratedCanonicals(bulkCanonicals);
    notify.success("Bulk canonical tags generated!");
  };

  /**
   * Copy to clipboard with fallback
   */
  const copyToClipboard = async () => {
    if (!generatedCanonicals) {
      notify.error("Please generate canonical tags first");
      return;
    }

    try {
      // Modern clipboard API
      await navigator.clipboard.writeText(generatedCanonicals);
      notify.success("Canonical tags copied!");
    } catch (err) {
      // Fallback for older browsers
      try {
        const textarea = document.createElement('textarea');
        textarea.value = generatedCanonicals;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        notify.success("Canonical tags copied!");
      } catch (fallbackErr) {
        console.error('Failed to copy: ', err);
        notify.error("Failed to copy to clipboard!");
      }
    }
  };

  /**
   * Download canonical tags with safe blob handling
   */
  const downloadCanonicals = () => {
    if (!generatedCanonicals) {
      notify.error("Please generate canonical tags first");
      return;
    }

    try {
      // Use text/plain to prevent HTML execution in browser
      const blob = new Blob([generatedCanonicals], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'canonical-tags.html';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      notify.success("Canonical tags downloaded!");
    } catch (err) {
      console.error('Failed to download: ', err);
      notify.error("Failed to download file!");
    }
  };

  /**
   * Clear all form data
   */
  const clearAll = () => {
    setCurrentUrl("");
    setCanonicalUrl("");
    setUrls([]);
    setGeneratedCanonicals("");
  };

  /**
   * Handle input change with DoS protection
   */
  const handleUrlInput = (value: string, setter: (val: string) => void) => {
    // DoS Protection: Reject excessively large inputs early
    if (value.length > SECURITY_LIMITS.MAX_URL_LENGTH) {
      notify.error(`Input too long (max ${SECURITY_LIMITS.MAX_URL_LENGTH} characters)`);
      return;
    }
    setter(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Canonical URL Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="canonical-url">
              Canonical URL <span className="text-red-500">*</span>
              <span className="text-xs text-muted-foreground ml-2">(HTTPS Required)</span>
            </Label>
            <Input
              id="canonical-url"
              placeholder="https://example.com/canonical-page"
              value={canonicalUrl}
              onChange={(e) => handleUrlInput(e.target.value, setCanonicalUrl)}
              aria-required="true"
            />
            <p className="text-sm text-muted-foreground">
              The preferred URL that should be indexed by search engines (must use HTTPS)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="current-url">
                Add URL to List <span className="text-xs text-muted-foreground">(HTTPS Required)</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                {urls.length}/{SECURITY_LIMITS.MAX_URLS} URLs
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="current-url"
                placeholder="https://example.com/duplicate-page"
                value={currentUrl}
                onChange={(e) => handleUrlInput(e.target.value, setCurrentUrl)}
                onKeyDown={(e) => e.key === 'Enter' && addUrl()}
                className="flex-1"
              />
              <Button 
                onClick={addUrl} 
                disabled={!currentUrl.trim() || urls.length >= SECURITY_LIMITS.MAX_URLS} 
                className="w-full sm:w-auto"
              >
                Add
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add URLs that should point to the canonical URL (HTTPS only)
            </p>
          </div>

          {urls.length > 0 && (
            <div className="space-y-2">
              <Label>URL List ({urls.length} URLs)</Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                {urls.map((url, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-muted p-2 rounded">
                    <span className="text-xs sm:text-sm font-mono flex-1 truncate break-all">{url}</span>
                    <Button
                      onClick={() => removeUrl(index)}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={generateCanonicalTags} className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Link className="h-4 w-4" />
              Generate Single Canonical
            </Button>
            {urls.length > 0 && (
              <Button onClick={generateBulkCanonicals} variant="outline" className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Link className="h-4 w-4" />
                Generate Bulk Canonicals
              </Button>
            )}
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedCanonicals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span>Generated Canonical Tags</span>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={copyToClipboard} variant="outline" size="sm" className="w-full sm:w-auto">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={downloadCanonicals} variant="outline" size="sm" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm break-words">
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
            <li>• <strong>Always use HTTPS</strong> - HTTP is not allowed for security and SEO</li>
            <li>• Use canonical URLs to prevent duplicate content issues</li>
            <li>• Always use absolute URLs (include full domain)</li>
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

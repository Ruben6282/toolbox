/**
 * CanonicalUrlGenerator - Enterprise-Grade SEO Tool
 *
 * SECURITY FEATURES:
 * - Strict HTTPS enforcement (no HTTP allowed)
 * - Input length limits (MAX_URL_LENGTH = 2000 chars)
 * - URL validation and sanitization
 * - XSS prevention via encodeMetaTag
 * - Rate limits (MAX_URLS = 100)
 * - DoS prevention and control character stripping
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
import { Copy, Download, RotateCcw, Link } from "lucide-react";
import { notify } from "@/lib/notify";
import { sanitizeUrl, encodeMetaTag } from "@/lib/security";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Security limits to prevent DoS and ensure performance
 */
const SECURITY_LIMITS = {
  MAX_URL_LENGTH: 2000, // Maximum characters per URL input
  MAX_URLS: 100, // Maximum number of URLs in list
} as const;

interface NormalizationOptions {
  autoTrimSlash: boolean;
  normalizeHostLowercase: boolean;
  removeTrackingParams: boolean;
  stripIndexHtml: boolean;
}

export const CanonicalUrlGenerator = () => {
  const [currentUrl, setCurrentUrl] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [generatedCanonicals, setGeneratedCanonicals] = useState("");

  const [canonicalError, setCanonicalError] = useState<string | null>(null);

  // Bulk paste dialog state
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkStats, setBulkStats] = useState<{ valid: number; invalid: number } | null>(null);

  const [options, setOptions] = useState<NormalizationOptions>({
    autoTrimSlash: true,
    normalizeHostLowercase: true,
    removeTrackingParams: true,
    stripIndexHtml: true,
  });

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
    if (!sanitized.startsWith("https://")) {
      return "Only HTTPS URLs are allowed for canonical tags";
    }

    return null; // Valid
  };

  /**
   * Normalize URL according to selected options.
   * NOTE: This operates only on already-sanitized HTTPS URLs.
   */
  const normalizeUrl = (safeUrl: string): string => {
    try {
      const url = new URL(safeUrl);

      if (options.normalizeHostLowercase) {
        url.hostname = url.hostname.toLowerCase();
      }

      if (options.stripIndexHtml && /\/index\.html?$/i.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/index\.html?$/i, "/");
      }

      if (options.autoTrimSlash && url.pathname.length > 1 && url.pathname.endsWith("/")) {
        url.pathname = url.pathname.slice(0, -1);
      }

      if (options.removeTrackingParams) {
        const params = url.searchParams;
        const keys = Array.from(params.keys());
        for (const key of keys) {
          if (/^utm_/i.test(key) || /^fbclid$/i.test(key) || /^gclid$/i.test(key)) {
            params.delete(key);
          }
        }
        url.search = params.toString() ? `?${params.toString()}` : "";
      }

      return url.toString();
    } catch {
      // If URL parsing fails for any reason, just return the original sanitized URL
      return safeUrl;
    }
  };

  /**
   * Handle input change with DoS protection and control-char stripping
   */
  const handleUrlInput = (value: string, setter: (val: string) => void) => {
    if (value.length > SECURITY_LIMITS.MAX_URL_LENGTH) {
      notify.error(`Input too long (max ${SECURITY_LIMITS.MAX_URL_LENGTH} characters)`);
      return;
    }

    // Strip control characters; keep it user-visible and reversible enough
    const cleaned = Array.from(value)
      .filter((ch) => {
        const code = ch.charCodeAt(0);
        return code >= 0x20 && code !== 0x7f; // printable ASCII
      })
      .join("");

    setter(cleaned);
  };

  /**
   * Add URL to list with validation + normalization
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

    // Sanitize and normalize URL
    const sanitized = sanitizeUrl(trimmedUrl, true);
    if (sanitized) {
      const normalized = normalizeUrl(sanitized);
      if (urls.includes(normalized)) {
        notify.error("This URL is already in the list");
        return;
      }
      setUrls((prev) => [...prev, normalized]);
      setCurrentUrl("");
      notify.success("URL added successfully");
    }
  };

  /**
   * Bulk add URLs from textarea
   */
  const handleBulkAdd = () => {
    const lines = bulkInput
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      notify.error("Please paste at least one URL");
      return;
    }

    const remainingSlots = SECURITY_LIMITS.MAX_URLS - urls.length;
    if (remainingSlots <= 0) {
      notify.error(`You already reached the limit of ${SECURITY_LIMITS.MAX_URLS} URLs`);
      return;
    }

    let valid = 0;
    let invalid = 0;
    const newUrls: string[] = [];

    for (const line of lines.slice(0, remainingSlots)) {
      const err = validateSecureUrl(line);
      if (err) {
        invalid++;
        continue;
      }
      const sanitized = sanitizeUrl(line, true);
      if (!sanitized) {
        invalid++;
        continue;
      }
      const normalized = normalizeUrl(sanitized);
      if (!urls.includes(normalized) && !newUrls.includes(normalized)) {
        newUrls.push(normalized);
        valid++;
      }
    }

    if (newUrls.length > 0) {
      setUrls((prev) => [...prev, ...newUrls]);
      notify.success(`Added ${valid} URL${valid !== 1 ? "s" : ""} from bulk paste`);
    } else {
      notify.error("No valid new URLs were found");
    }

    setBulkStats({ valid, invalid });
  };

  const closeBulkDialog = () => {
    setIsBulkOpen(false);
    setBulkInput("");
    setBulkStats(null);
  };

  /**
   * Remove URL from list
   */
  const removeUrl = (index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Generate canonical tag with strict validation + normalization
   */
  const generateCanonicalTags = () => {
    setCanonicalError(null);

    if (!canonicalUrl.trim()) {
      const msg = "Please enter a canonical URL!";
      setCanonicalError(msg);
      notify.error(msg);
      return;
    }

    const error = validateSecureUrl(canonicalUrl);
    if (error) {
      setCanonicalError(error);
      notify.error(error);
      return;
    }

    // Get sanitized URL (guaranteed HTTPS at this point), then normalize
    const safeCanonicalRaw = sanitizeUrl(canonicalUrl, true);
    if (!safeCanonicalRaw) {
      const msg = "Invalid canonical URL format!";
      setCanonicalError(msg);
      notify.error(msg);
      return;
    }

    const safeCanonicalUrl = normalizeUrl(safeCanonicalRaw);

    let canonicalTags = `<!-- Canonical URL Tags -->\n`;
    canonicalTags += `<link rel="canonical" href="${encodeMetaTag(safeCanonicalUrl)}">\n\n`;

    // Additional URLs (for reference)
    if (urls.length > 0) {
      canonicalTags += `<!-- Alternative URLs (for reference) -->\n`;
      urls.forEach((url, index) => {
        canonicalTags += `<!-- URL ${index + 1}: ${encodeMetaTag(url)} -->\n`;
      });
    }

    setGeneratedCanonicals(canonicalTags);
    notify.success("Canonical tags generated!");
  };

  /**
   * Generate bulk canonical tags with strict validation + normalization
   */
  const generateBulkCanonicals = () => {
    if (urls.length === 0) {
      notify.error("Please add some URLs first!");
      return;
    }

    let safeCanonicalBase: string | null = null;

    if (canonicalUrl.trim()) {
      const error = validateSecureUrl(canonicalUrl);
      if (error) {
        setCanonicalError(`Canonical URL invalid: ${error}`);
        notify.error(`Canonical URL invalid: ${error}`);
        return;
      }
      const sanitized = sanitizeUrl(canonicalUrl, true);
      if (!sanitized) {
        const msg = "Canonical URL could not be sanitized";
        setCanonicalError(msg);
        notify.error(msg);
        return;
      }
      safeCanonicalBase = normalizeUrl(sanitized);
    } else {
      setCanonicalError(null);
    }

    let bulkCanonicals = `<!-- Bulk Canonical URL Tags -->\n`;

    urls.forEach((url, index) => {
      const canonical = safeCanonicalBase || url;

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
      await navigator.clipboard.writeText(generatedCanonicals);
      notify.success("Canonical tags copied!");
    } catch (err) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = generatedCanonicals;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        notify.success("Canonical tags copied!");
      } catch (fallbackErr) {
        console.error("Failed to copy: ", err || fallbackErr);
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
      const blob = new Blob([generatedCanonicals], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "canonical-tags.html";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      notify.success("Canonical tags downloaded!");
    } catch (err) {
      console.error("Failed to download: ", err);
      notify.error("Failed to download file!");
    }
  };

  /**
   * Clear all form data
   */
  const clearAll = () => {
    setCurrentUrl("");
    setCanonicalUrl("");
    setCanonicalError(null);
    setUrls([]);
    setGeneratedCanonicals("");
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Canonical URL Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Canonical URL */}
            <div className="space-y-2">
              <Label htmlFor="canonical-url">
                Canonical URL <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-2">(HTTPS Required)</span>
              </Label>
              <Input
                id="canonical-url"
                placeholder="https://example.com/canonical-page"
                value={canonicalUrl}
                onChange={(e) => {
                  handleUrlInput(e.target.value, setCanonicalUrl);
                  setCanonicalError(null);
                }}
                aria-required="true"
                aria-invalid={!!canonicalError}
                className={canonicalError ? "border-red-500" : ""}
              />
              {canonicalError && (
                <p className="text-sm text-red-500 mt-1" role="alert">
                  {canonicalError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                The preferred URL that should be indexed by search engines (must use HTTPS).
              </p>
            </div>

            {/* Normalization options */}
            <div className="space-y-2">
              <Label>Canonical Normalization Options</Label>
              <p className="text-xs text-muted-foreground mb-1">
                These safe transformations help keep your canonical URLs consistent.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="normalize-host"
                    checked={options.normalizeHostLowercase}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({
                        ...prev,
                        normalizeHostLowercase: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor="normalize-host" className="text-sm leading-snug">
                    Lowercase hostname
                    <span className="block text-xs text-muted-foreground">
                      Converts <code>WWW.Example.com</code> to <code>www.example.com</code>.
                    </span>
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="trim-slash"
                    checked={options.autoTrimSlash}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({
                        ...prev,
                        autoTrimSlash: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor="trim-slash" className="text-sm leading-snug">
                    Trim trailing slash
                    <span className="block text-xs text-muted-foreground">
                      Normalizes <code>/page/</code> to <code>/page</code> (except root).
                    </span>
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="strip-index"
                    checked={options.stripIndexHtml}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({
                        ...prev,
                        stripIndexHtml: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor="strip-index" className="text-sm leading-snug">
                    Strip /index.html
                    <span className="block text-xs text-muted-foreground">
                      Converts <code>/index.html</code> to <code>/</code>.
                    </span>
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="remove-tracking"
                    checked={options.removeTrackingParams}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({
                        ...prev,
                        removeTrackingParams: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor="remove-tracking" className="text-sm leading-snug">
                    Remove tracking parameters
                    <span className="block text-xs text-muted-foreground">
                      Strips <code>utm_*</code>, <code>fbclid</code>, <code>gclid</code>.
                    </span>
                  </Label>
                </div>
              </div>
            </div>

            {/* URL list + bulk */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="current-url">
                    Add URL to List{" "}
                    <span className="text-xs text-muted-foreground">(HTTPS Required)</span>
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
                    onKeyDown={(e) => e.key === "Enter" && addUrl()}
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setIsBulkOpen(true)}
                    disabled={urls.length >= SECURITY_LIMITS.MAX_URLS}
                  >
                    Bulk Add URLs
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add URLs that should point to the canonical URL (HTTPS only). Bulk paste lets you
                  add multiple URLs at once.
                </p>
              </div>

              {urls.length > 0 && (
                <div className="space-y-2">
                  <Label>URL List ({urls.length} URLs)</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2 bg-muted/40">
                    {urls.map((url, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-background p-2 rounded border"
                      >
                        <span className="text-xs sm:text-sm font-mono flex-1 break-all">
                          {url}
                        </span>
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
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={generateCanonicalTags}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Link className="h-4 w-4" />
                Generate Single Canonical
              </Button>
              {urls.length > 0 && (
                <Button
                  onClick={generateBulkCanonicals}
                  variant="outline"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
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

        {/* Generated output */}
        {generatedCanonicals && (
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>Generated Canonical Tags</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    onClick={downloadCanonicals}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
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

        {/* Best practices cards (unchanged content, just kept for UX completeness) */}
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
            <div className="space-y-3 text-sm text-muted-foreground">
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

      {/* Bulk paste dialog */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Add URLs</DialogTitle>
            <DialogDescription>
              Paste one HTTPS URL per line. Invalid or duplicate URLs will be skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Textarea
              value={bulkInput}
              onChange={(e) => handleUrlInput(e.target.value, setBulkInput)}
              placeholder={"https://example.com/page-1\nhttps://example.com/page-2\nhttps://example.com/page-3"}
              rows={6}
            />
            {bulkStats && (
              <p className="text-xs text-muted-foreground">
                Added {bulkStats.valid} URL{bulkStats.valid !== 1 ? "s" : ""}, skipped{" "}
                {bulkStats.invalid} invalid URL{bulkStats.invalid !== 1 ? "s" : ""}.
              </p>
            )}
          </div>
          <DialogFooter className="mt-3 flex justify-between gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={closeBulkDialog}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={handleBulkAdd}
              disabled={!bulkInput.trim() || urls.length >= SECURITY_LIMITS.MAX_URLS}
            >
              Add URLs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Download, RotateCcw } from "lucide-react";
import { notify } from "@/lib/notify";
import {
  minifyHtml,
  DEFAULT_HTML_MINIFY_OPTIONS,
} from "@/lib/html-minifier";

type UiOptions = {
  removeComments: boolean;
  removeWhitespace: boolean; // maps to removeWhitespaceBetweenTags
  removeEmptyAttributes: boolean;
  collapseWhitespace: boolean;
  removeRedundantAttributes: boolean;
  removeScriptTypeAttributes: boolean;
  removeStyleLinkTypeAttributes: boolean;
  removeOptionalTags: boolean;
  removeEmptyElements: boolean;
  minifyCSS: boolean;
  minifyJS: boolean;
};

const DEFAULT_UI_OPTIONS: UiOptions = {
  removeComments: DEFAULT_HTML_MINIFY_OPTIONS.removeComments,
  removeWhitespace: DEFAULT_HTML_MINIFY_OPTIONS.removeWhitespaceBetweenTags,
  removeEmptyAttributes: DEFAULT_HTML_MINIFY_OPTIONS.removeEmptyAttributes,
  collapseWhitespace: DEFAULT_HTML_MINIFY_OPTIONS.collapseWhitespace,
  removeRedundantAttributes: DEFAULT_HTML_MINIFY_OPTIONS.removeRedundantAttributes,
  removeScriptTypeAttributes: DEFAULT_HTML_MINIFY_OPTIONS.removeScriptTypeAttributes,
  removeStyleLinkTypeAttributes: DEFAULT_HTML_MINIFY_OPTIONS.removeStyleLinkTypeAttributes,
  removeOptionalTags: DEFAULT_HTML_MINIFY_OPTIONS.removeOptionalTags,
  removeEmptyElements: DEFAULT_HTML_MINIFY_OPTIONS.removeEmptyElements,
  minifyCSS: DEFAULT_HTML_MINIFY_OPTIONS.minifyCSS,
  minifyJS: DEFAULT_HTML_MINIFY_OPTIONS.minifyJS,
};

export const HtmlMinifier = () => {
  const [htmlInput, setHtmlInput] = useState("");
  const [minifiedHtml, setMinifiedHtml] = useState("");
  const [options, setOptions] = useState<UiOptions>(DEFAULT_UI_OPTIONS);

  const handleMinify = () => {
    const input = htmlInput.trim();
    if (!input) return;

    const minified = minifyHtml(input, {
      removeComments: options.removeComments,
      collapseWhitespace: options.collapseWhitespace,
      removeWhitespaceBetweenTags: options.removeWhitespace,
      removeEmptyAttributes: options.removeEmptyAttributes,
      removeRedundantAttributes: options.removeRedundantAttributes,
      removeScriptTypeAttributes: options.removeScriptTypeAttributes,
      removeStyleLinkTypeAttributes: options.removeStyleLinkTypeAttributes,
      removeOptionalTags: options.removeOptionalTags,
      removeEmptyElements: options.removeEmptyElements,
      minifyCSS: options.minifyCSS,
      minifyJS: options.minifyJS,
    });

    setMinifiedHtml(minified);

    const originalSize = htmlInput.length;
    const minifiedSize = minified.length;
    const savings = originalSize - minifiedSize;
    const savingsPercent =
      originalSize > 0 ? ((savings / originalSize) * 100).toFixed(1) : "0.0";

    notify.success(`HTML minified! ${savingsPercent}% size reduction`);
  };

  const copyToClipboard = async () => {
    if (!minifiedHtml) {
      notify.error("Nothing to copy yet.");
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(minifiedHtml);
        notify.success("Minified HTML copied to clipboard!");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = minifiedHtml;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand("copy");
          if (successful) {
            notify.success("Minified HTML copied to clipboard!");
          } else {
            notify.error("Failed to copy!");
          }
        } catch (err) {
          console.error("Fallback: Failed to copy", err);
          notify.error("Failed to copy to clipboard!");
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error("Failed to copy: ", err);
      notify.error("Failed to copy to clipboard!");
    }
  };

  const downloadMinified = () => {
    if (!minifiedHtml) {
      notify.error("Nothing to download yet.");
      return;
    }

    const blob = new Blob([minifiedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "minified.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("Minified HTML downloaded!");
  };

  const clearAll = () => {
    setHtmlInput("");
    setMinifiedHtml("");
    setOptions(DEFAULT_UI_OPTIONS);
    notify.success("Cleared all content!");
  };

  const originalSize = htmlInput.length;
  const minifiedSize = minifiedHtml.length;
  const savings = originalSize - minifiedSize;
  const savingsPercent =
    originalSize > 0 ? ((savings / originalSize) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HTML Minifier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="html-input">HTML Code</Label>
            <Textarea
              id="html-input"
              placeholder="Paste your HTML code here..."
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-3">
            <Label>Minification Options</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-comments"
                  checked={options.removeComments}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      removeComments: Boolean(checked),
                    }))
                  }
                />
                <Label htmlFor="remove-comments" className="text-sm">
                  Remove Comments
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-whitespace"
                  checked={options.removeWhitespace}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      removeWhitespace: Boolean(checked),
                    }))
                  }
                />
                <Label htmlFor="remove-whitespace" className="text-sm">
                  Normalize Space Between Tags
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="collapse-whitespace"
                  checked={options.collapseWhitespace}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      collapseWhitespace: Boolean(checked),
                    }))
                  }
                />
                <Label htmlFor="collapse-whitespace" className="text-sm">
                  Collapse Whitespace
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-empty-attributes"
                  checked={options.removeEmptyAttributes}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      removeEmptyAttributes: Boolean(checked),
                    }))
                  }
                />
                <Label htmlFor="remove-empty-attributes" className="text-sm">
                  Remove Empty Attributes
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-redundant"
                  checked={options.removeRedundantAttributes}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      removeRedundantAttributes: Boolean(checked),
                    }))
                  }
                />
                <Label htmlFor="remove-redundant" className="text-sm">
                  Remove Redundant Type Attributes
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="minify-css"
                  checked={options.minifyCSS}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      minifyCSS: Boolean(checked),
                    }))
                  }
                />
                <Label htmlFor="minify-css" className="text-sm">
                  Minify CSS (basic)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="minify-js"
                  checked={options.minifyJS}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      minifyJS: Boolean(checked),
                    }))
                  }
                />
                <Label htmlFor="minify-js" className="text-sm">
                  Minify JS (conservative)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-optional-tags"
                  checked={options.removeOptionalTags}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      removeOptionalTags: Boolean(checked),
                    }))
                  }
                />
                <Label htmlFor="remove-optional-tags" className="text-sm">
                  Remove Optional Tags
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-empty-elements"
                  checked={options.removeEmptyElements}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      removeEmptyElements: Boolean(checked),
                    }))
                  }
                />
                <Label htmlFor="remove-empty-elements" className="text-sm">
                  Remove Empty Elements
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleMinify}
              disabled={!htmlInput.trim()}
              className="w-full sm:w-auto"
            >
              Minify HTML
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

      {minifiedHtml && (
        <Card>
          <CardHeader>
            <CardTitle>Minified HTML</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-3 sm:p-4 rounded-lg">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs sm:text-sm overflow-x-auto">
                {minifiedHtml}
              </pre>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-bold break-words">
                  {originalSize.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Original Size
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold break-words">
                  {minifiedSize.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Minified Size
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold break-words">
                  {savings.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Bytes Saved
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold break-words">
                  {savingsPercent}%
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Reduction
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Minified HTML
              </Button>
              <Button
                onClick={downloadMinified}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>HTML Minification Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Always test your minified HTML to ensure it still works correctly</li>
            <li>• Keep a backup of your original HTML before minifying</li>
            <li>• Some options (like removing empty elements) can be destructive</li>
            <li>• Minified HTML is harder to debug, so use it only for production</li>
            <li>• Consider using build tools for automated minification in your workflow</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

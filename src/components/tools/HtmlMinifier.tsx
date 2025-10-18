import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Download, RotateCcw } from "lucide-react";

export const HtmlMinifier = () => {
  const [htmlInput, setHtmlInput] = useState("");
  const [minifiedHtml, setMinifiedHtml] = useState("");
  const [options, setOptions] = useState({
    removeComments: true,
    removeWhitespace: true,
    removeEmptyAttributes: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeOptionalTags: false,
    removeEmptyElements: false,
    minifyCSS: false,
    minifyJS: false
  });

  const minifyHtml = (html: string): string => {
    let result = html;

    // Remove HTML comments
    if (options.removeComments) {
      result = result.replace(/<!--[\s\S]*?-->/g, '');
    }

    // Remove script type attributes
    if (options.removeScriptTypeAttributes) {
      result = result.replace(/<script(?:\s+[^>]*)?\s+type\s*=\s*["']text\/javascript["'](?:\s+[^>]*)?>/gi, '<script$1>');
    }

    // Remove style link type attributes
    if (options.removeStyleLinkTypeAttributes) {
      result = result.replace(/<link(?:\s+[^>]*)?\s+type\s*=\s*["']text\/css["'](?:\s+[^>]*)?>/gi, '<link$1>');
    }

    // Remove redundant attributes
    if (options.removeRedundantAttributes) {
      result = result.replace(/\s+type\s*=\s*["']text\/css["']/gi, '');
      result = result.replace(/\s+type\s*=\s*["']text\/javascript["']/gi, '');
    }

    // Remove empty attributes
    if (options.removeEmptyAttributes) {
      result = result.replace(/\s+[a-zA-Z-]+\s*=\s*["']\s*["']/g, '');
    }

    // Collapse whitespace
    if (options.collapseWhitespace) {
      result = result.replace(/\s+/g, ' ');
    }

    // Remove whitespace between tags
    if (options.removeWhitespace) {
      result = result.replace(/>\s+</g, '><');
    }

    // Remove optional tags
    if (options.removeOptionalTags) {
      result = result.replace(/<\/?(?:html|head|body|p|li|dt|dd|option|thead|tbody|tfoot|tr|td|th)>/gi, '');
    }

    // Remove empty elements
    if (options.removeEmptyElements) {
      result = result.replace(/<(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(?:\s+[^>]*)?\/?>/gi, '');
    }

    // Basic CSS minification
    if (options.minifyCSS) {
      result = result.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
        const minifiedCSS = css
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\s+/g, ' ') // Collapse whitespace
          .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
          .replace(/\s*{\s*/g, '{') // Remove spaces around opening brace
          .replace(/;\s*/g, ';') // Remove spaces after semicolons
          .trim();
        return `<style>${minifiedCSS}</style>`;
      });
    }

    // Basic JS minification
    if (options.minifyJS) {
      result = result.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, js) => {
        const minifiedJS = js
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
          .replace(/\/\/.*$/gm, '') // Remove line comments
          .replace(/\s+/g, ' ') // Collapse whitespace
          .replace(/\s*([{}();,=])\s*/g, '$1') // Remove spaces around operators
          .trim();
        return `<script>${minifiedJS}</script>`;
      });
    }

    return result.trim();
  };

  const handleMinify = () => {
    if (!htmlInput.trim()) return;
    
    const minified = minifyHtml(htmlInput);
    setMinifiedHtml(minified);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(minifiedHtml);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadMinified = () => {
    const blob = new Blob([minifiedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minified.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setHtmlInput("");
    setMinifiedHtml("");
  };

  const originalSize = htmlInput.length;
  const minifiedSize = minifiedHtml.length;
  const savings = originalSize - minifiedSize;
  const savingsPercent = originalSize > 0 ? ((savings / originalSize) * 100).toFixed(1) : 0;

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
                  onCheckedChange={(checked) => setOptions({...options, removeComments: checked as boolean})}
                />
                <Label htmlFor="remove-comments" className="text-sm">Remove Comments</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-whitespace"
                  checked={options.removeWhitespace}
                  onCheckedChange={(checked) => setOptions({...options, removeWhitespace: checked as boolean})}
                />
                <Label htmlFor="remove-whitespace" className="text-sm">Remove Whitespace</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="collapse-whitespace"
                  checked={options.collapseWhitespace}
                  onCheckedChange={(checked) => setOptions({...options, collapseWhitespace: checked as boolean})}
                />
                <Label htmlFor="collapse-whitespace" className="text-sm">Collapse Whitespace</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-empty-attributes"
                  checked={options.removeEmptyAttributes}
                  onCheckedChange={(checked) => setOptions({...options, removeEmptyAttributes: checked as boolean})}
                />
                <Label htmlFor="remove-empty-attributes" className="text-sm">Remove Empty Attributes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-redundant"
                  checked={options.removeRedundantAttributes}
                  onCheckedChange={(checked) => setOptions({...options, removeRedundantAttributes: checked as boolean})}
                />
                <Label htmlFor="remove-redundant" className="text-sm">Remove Redundant Attributes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="minify-css"
                  checked={options.minifyCSS}
                  onCheckedChange={(checked) => setOptions({...options, minifyCSS: checked as boolean})}
                />
                <Label htmlFor="minify-css" className="text-sm">Minify CSS</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleMinify} disabled={!htmlInput.trim()}>
              Minify HTML
            </Button>
            <Button onClick={clearAll} variant="outline">
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
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
                {minifiedHtml}
              </pre>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{originalSize.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Original Size</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{minifiedSize.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Minified Size</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{savings.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Bytes Saved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{savingsPercent}%</div>
                <div className="text-sm text-muted-foreground">Reduction</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy Minified HTML
              </Button>
              <Button onClick={downloadMinified} variant="outline">
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
            <li>• Some minification options may break certain HTML structures</li>
            <li>• Minified HTML is harder to debug, so use it only for production</li>
            <li>• Consider using build tools for automated minification in your workflow</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

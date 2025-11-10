import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Download, RotateCcw, Bot } from "lucide-react";
import { notify } from "@/lib/notify";
import { sanitizeUrl, truncateText, sanitizeUserAgent, validateRobotsPath, SEO_LIMITS } from "@/lib/security";

export const RobotsTxtGenerator = () => {
  const [siteUrl, setSiteUrl] = useState("");
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [userAgents, setUserAgents] = useState([
    { name: "*", allow: true, disallow: [], crawlDelay: 0 }
  ]);
  const [customRules, setCustomRules] = useState("");
  const [generatedRobots, setGeneratedRobots] = useState("");

  const addUserAgent = () => {
    setUserAgents([...userAgents, { name: "*", allow: true, disallow: [], crawlDelay: 0 }]);
  };

  const removeUserAgent = (index: number) => {
    if (userAgents.length > 1) {
      setUserAgents(userAgents.filter((_, i) => i !== index));
    }
  };

  const updateUserAgent = (index: number, field: string, value: string | number | boolean) => {
    const updated = [...userAgents];
    updated[index] = { ...updated[index], [field]: value };
    setUserAgents(updated);
  };

  const addDisallowPath = (userAgentIndex: number) => {
    const updated = [...userAgents];
    updated[userAgentIndex].disallow.push("");
    setUserAgents(updated);
  };

  const removeDisallowPath = (userAgentIndex: number, pathIndex: number) => {
    const updated = [...userAgents];
    updated[userAgentIndex].disallow.splice(pathIndex, 1);
    setUserAgents(updated);
  };

  const updateDisallowPath = (userAgentIndex: number, pathIndex: number, value: string) => {
    const updated = [...userAgents];
    updated[userAgentIndex].disallow[pathIndex] = value;
    setUserAgents(updated);
  };

  const generateRobotsTxt = () => {
    let robots = "";
    let hasErrors = false;

    // Add user agent rules
    userAgents.forEach((agent) => {
      // Sanitize user agent name (only alphanumeric, dash, underscore, dot, asterisk)
      const safeAgentName = sanitizeUserAgent(agent.name);
      if (!safeAgentName) {
        notify.error(`Invalid user agent name: ${agent.name}`);
        hasErrors = true;
        return;
      }
      robots += `User-agent: ${safeAgentName}\n`;
      
      if (agent.allow) {
        robots += "Allow: /\n";
      }
      
      agent.disallow.forEach((path) => {
        const trimmedPath = path.trim();
        if (trimmedPath) {
          // Validate path format (must start with /, no special chars)
          if (!validateRobotsPath(trimmedPath)) {
            notify.error(`Invalid path format: ${trimmedPath}. Must start with / and contain only safe characters`);
            hasErrors = true;
            return;
          }
          const safePath = truncateText(trimmedPath, SEO_LIMITS.ROBOTS_PATH);
          robots += `Disallow: ${safePath}\n`;
        }
      });
      
      if (agent.crawlDelay > 0) {
        robots += `Crawl-delay: ${Math.min(Math.max(0, agent.crawlDelay), 3600)}\n`;
      }
      
      robots += "\n";
    });

    if (hasErrors) {
      return;
    }

    // Add sitemap with URL validation (prefer HTTPS)
    if (sitemapUrl) {
      const safeSitemapUrl = sanitizeUrl(sitemapUrl, false);
      if (!safeSitemapUrl) {
        notify.error("Invalid sitemap URL format!");
        return;
      }
      if (!safeSitemapUrl.startsWith('https://')) {
        notify.warning('Sitemap URL should use HTTPS for better security');
      }
      if (safeSitemapUrl.length > SEO_LIMITS.SITEMAP_URL) {
        notify.error(`Sitemap URL too long (max ${SEO_LIMITS.SITEMAP_URL} characters)`);
        return;
      }
      robots += `Sitemap: ${safeSitemapUrl}\n`;
    }

    // Add custom rules with sanitization (remove control characters)
    if (customRules.trim()) {
      const safeCustomRules = truncateText(customRules, 5000)
        .replace(/[\r\n\0\t]+/g, '\n')  // Normalize line breaks
        .split('\n')
        .filter(line => line.trim())
        .join('\n');
      robots += `\n# Custom rules\n${safeCustomRules}\n`;
    }

    setGeneratedRobots(robots.trim());
    notify.success("Robots.txt generated!");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedRobots);
  notify.success("Copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadRobotsTxt = () => {
    const blob = new Blob([generatedRobots], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  notify.success("Robots.txt downloaded!");
  };

  const clearAll = () => {
    setSiteUrl("");
    setSitemapUrl("");
    setUserAgents([{ name: "*", allow: true, disallow: [], crawlDelay: 0 }]);
    setCustomRules("");
    setGeneratedRobots("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Robots.txt Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site-url">Site URL</Label>
              <Input
                id="site-url"
                placeholder="https://example.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sitemap-url">Sitemap URL</Label>
              <Input
                id="sitemap-url"
                placeholder="https://example.com/sitemap.xml"
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <Label>User Agents</Label>
              <Button onClick={addUserAgent} size="sm" className="w-full sm:w-auto">
                Add User Agent
              </Button>
            </div>

            {userAgents.map((agent, index) => (
              <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h4 className="font-medium">User Agent {index + 1}</h4>
                  {userAgents.length > 1 && (
                    <Button
                      onClick={() => removeUserAgent(index)}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>User Agent</Label>
                    <Input
                      placeholder="*"
                      value={agent.name}
                      onChange={(e) => updateUserAgent(index, 'name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Crawl Delay (seconds)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={agent.crawlDelay}
                      onChange={(e) => updateUserAgent(index, 'crawlDelay', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`allow-${index}`}
                        checked={agent.allow}
                        onCheckedChange={(checked) => updateUserAgent(index, 'allow', checked)}
                      />
                      <Label htmlFor={`allow-${index}`}>Allow all</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <Label>Disallow Paths</Label>
                    <Button
                      onClick={() => addDisallowPath(index)}
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Add Path
                    </Button>
                  </div>

                  {agent.disallow.map((path, pathIndex) => (
                    <div key={pathIndex} className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="/admin, /private, etc."
                        value={path}
                        onChange={(e) => updateDisallowPath(index, pathIndex, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => removeDisallowPath(index, pathIndex)}
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
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-rules">Custom Rules (optional)</Label>
            <Textarea
              id="custom-rules"
              placeholder="# Add any custom robots.txt rules here..."
              value={customRules}
              onChange={(e) => setCustomRules(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={generateRobotsTxt} className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Bot className="h-4 w-4" />
              Generate Robots.txt
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedRobots && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span>Generated Robots.txt</span>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={copyToClipboard} variant="outline" size="sm" className="w-full sm:w-auto">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={downloadRobotsTxt} variant="outline" size="sm" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm break-words">{generatedRobots}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Robots.txt Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use "User-agent: *" to apply rules to all crawlers</li>
            <li>• Disallow sensitive directories like /admin, /private, /api</li>
            <li>• Always include your sitemap URL for better indexing</li>
            <li>• Use crawl-delay to prevent overloading your server</li>
            <li>• Test your robots.txt with Google Search Console</li>
            <li>• Keep the file in your website's root directory</li>
            <li>• Don't block important pages like your homepage or product pages</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

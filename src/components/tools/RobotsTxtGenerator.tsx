import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Download, RotateCcw, Bot } from "lucide-react";
import { toast } from "sonner";

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

    // Add user agent rules
    userAgents.forEach((agent) => {
      robots += `User-agent: ${agent.name}\n`;
      
      if (agent.allow) {
        robots += "Allow: /\n";
      }
      
      agent.disallow.forEach((path) => {
        if (path.trim()) {
          robots += `Disallow: ${path}\n`;
        }
      });
      
      if (agent.crawlDelay > 0) {
        robots += `Crawl-delay: ${agent.crawlDelay}\n`;
      }
      
      robots += "\n";
    });

    // Add sitemap
    if (sitemapUrl) {
      robots += `Sitemap: ${sitemapUrl}\n`;
    }

    // Add custom rules
    if (customRules.trim()) {
      robots += `\n# Custom rules\n${customRules}\n`;
    }

    setGeneratedRobots(robots.trim());
    toast.success("Robots.txt generated!");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedRobots);
      toast.success("Copied to clipboard!");
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
    toast.success("Robots.txt downloaded!");
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

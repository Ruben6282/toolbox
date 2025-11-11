/**
 * RobotsTxtGenerator - Enterprise-Grade Security Component
 * 
 * SECURITY FEATURES:
 * - HTTPS-only enforcement for sitemap URLs
 * - Strict path validation (prevents directory traversal)
 * - User agent sanitization (alphanumeric + safe chars only)
 * - Control character filtering
 * - Rate limits (max user agents, paths, custom rules)
 * - Input length validation
 * - DoS prevention via limits
 * 
 * LIMITS:
 * - Max 20 user agents
 * - Max 50 disallow paths per user agent
 * - Max 5KB custom rules
 * - Max 500 chars per path
 * - Max 2048 chars for sitemap URL
 * 
 * @module RobotsTxtGenerator
 * @security enterprise-level
 * @version 2.0.0
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Download, RotateCcw, Bot, AlertCircle, CheckCircle } from "lucide-react";
import { notify } from "@/lib/notify";
import { sanitizeUrl, truncateText, sanitizeUserAgent, validateRobotsPath, SEO_LIMITS } from "@/lib/security";

// Enterprise-level security limits
const SECURITY_LIMITS = {
  MAX_USER_AGENTS: 20,
  MAX_DISALLOW_PATHS_PER_AGENT: 50,
  MAX_CUSTOM_RULES_LENGTH: 5000,
  MAX_CRAWL_DELAY: 3600, // 1 hour max
  MAX_PATH_LENGTH: 500,
} as const;

// Field validation errors interface
interface ValidationErrors {
  [key: string]: string | null;
}

export const RobotsTxtGenerator = () => {
  const [siteUrl, setSiteUrl] = useState("");
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [userAgents, setUserAgents] = useState([
    { name: "*", allow: true, disallow: [], crawlDelay: 0 }
  ]);
  const [customRules, setCustomRules] = useState("");
  const [generatedRobots, setGeneratedRobots] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  /**
   * Validate sitemap URL with HTTPS enforcement
   */
  const validateSitemapUrl = (url: string): string | null => {
    if (!url.trim()) return null; // Optional field
    
    // Check for control characters
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1F\x7F]/.test(url)) {
      return 'Sitemap URL contains invalid control characters';
    }

    // Use sanitizeUrl with HTTPS enforcement
    const sanitized = sanitizeUrl(url, true);
    if (!sanitized) {
      return 'Sitemap URL must be a valid HTTPS URL (http:// not allowed)';
    }

    // Check length
    if (sanitized.length > SEO_LIMITS.SITEMAP_URL) {
      return `Sitemap URL too long (max ${SEO_LIMITS.SITEMAP_URL} characters)`;
    }

    // Must end with .xml or be a sitemap path
    if (!sanitized.endsWith('.xml') && !sanitized.includes('sitemap')) {
      return 'Sitemap URL should point to an XML file or sitemap path';
    }

    return null;
  };

  /**
   * Validate user agent name
   */
  const validateUserAgentName = (name: string): string | null => {
    if (!name.trim()) {
      return 'User agent name is required';
    }

    const sanitized = sanitizeUserAgent(name);
    if (!sanitized) {
      return 'Invalid user agent name (only alphanumeric, dash, underscore, dot, asterisk allowed)';
    }

    if (sanitized.length > 100) {
      return 'User agent name too long (max 100 characters)';
    }

    return null;
  };

  /**
   * Validate disallow path
   */
  const validatePath = (path: string): string | null => {
    if (!path.trim()) return null; // Empty paths are skipped

    // Check for control characters
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1F\x7F]/.test(path)) {
      return 'Path contains invalid control characters';
    }

    if (!validateRobotsPath(path.trim())) {
      return 'Invalid path format (must start with / and contain only safe characters)';
    }

    if (path.length > SECURITY_LIMITS.MAX_PATH_LENGTH) {
      return `Path too long (max ${SECURITY_LIMITS.MAX_PATH_LENGTH} characters)`;
    }

    return null;
  };

  /**
   * Validate crawl delay
   */
  const validateCrawlDelay = (delay: number): string | null => {
    if (delay < 0) {
      return 'Crawl delay cannot be negative';
    }

    if (delay > SECURITY_LIMITS.MAX_CRAWL_DELAY) {
      return `Crawl delay too high (max ${SECURITY_LIMITS.MAX_CRAWL_DELAY} seconds)`;
    }

    if (!Number.isFinite(delay)) {
      return 'Crawl delay must be a valid number';
    }

    return null;
  };

  /**
   * Validate all fields
   */
  const validateAllFields = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Validate sitemap URL
    errors.sitemapUrl = validateSitemapUrl(sitemapUrl);

    // Validate each user agent
    userAgents.forEach((agent, index) => {
      errors[`userAgent_${index}_name`] = validateUserAgentName(agent.name);
      errors[`userAgent_${index}_crawlDelay`] = validateCrawlDelay(agent.crawlDelay);

      // Validate disallow paths
      agent.disallow.forEach((path, pathIndex) => {
        if (path.trim()) { // Only validate non-empty paths
          errors[`userAgent_${index}_path_${pathIndex}`] = validatePath(path);
        }
      });
    });

    // Validate custom rules length
    if (customRules.length > SECURITY_LIMITS.MAX_CUSTOM_RULES_LENGTH) {
      errors.customRules = `Custom rules too long (max ${SECURITY_LIMITS.MAX_CUSTOM_RULES_LENGTH} characters)`;
    }

    // Filter out null errors
    Object.keys(errors).forEach(key => {
      if (errors[key] === null) {
        delete errors[key];
      }
    });

    return errors;
  };

  /**
   * Check if form is valid
   */
  const isFormValid = useMemo(() => {
    const errors = validateAllFields();
    return Object.keys(errors).length === 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitemapUrl, userAgents, customRules]);

  /**
   * Add user agent with security limit enforcement
   */
  const addUserAgent = () => {
    if (userAgents.length >= SECURITY_LIMITS.MAX_USER_AGENTS) {
      notify.error(`Maximum ${SECURITY_LIMITS.MAX_USER_AGENTS} user agents allowed`);
      return;
    }
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

  /**
   * Add disallow path with security limit enforcement
   */
  const addDisallowPath = (userAgentIndex: number) => {
    const agent = userAgents[userAgentIndex];
    if (agent.disallow.length >= SECURITY_LIMITS.MAX_DISALLOW_PATHS_PER_AGENT) {
      notify.error(`Maximum ${SECURITY_LIMITS.MAX_DISALLOW_PATHS_PER_AGENT} paths per user agent allowed`);
      return;
    }
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

  /**
   * Generate robots.txt with enterprise-level validation
   */
  const generateRobotsTxt = () => {
    // Validate all fields before generation
    const errors = validateAllFields();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      notify.error("Please fix validation errors before generating");
      return;
    }

    let robots = "";

    // Add user agent rules with strict validation
    userAgents.forEach((agent) => {
      // Sanitize and validate user agent name
      const safeAgentName = sanitizeUserAgent(agent.name);
      if (!safeAgentName) {
        notify.error(`Invalid user agent name: ${agent.name}`);
        return;
      }
      robots += `User-agent: ${safeAgentName}\n`;
      
      if (agent.allow) {
        robots += "Allow: /\n";
      }
      
      // Process disallow paths with validation
      agent.disallow.forEach((path) => {
        const trimmedPath = path.trim();
        if (trimmedPath) {
          // Strict path validation
          if (!validateRobotsPath(trimmedPath)) {
            notify.error(`Invalid path format: ${trimmedPath}`);
            return;
          }
          const safePath = truncateText(trimmedPath, SECURITY_LIMITS.MAX_PATH_LENGTH);
          robots += `Disallow: ${safePath}\n`;
        }
      });
      
      // Validate and add crawl delay
      if (agent.crawlDelay > 0) {
        const safeDelay = Math.min(Math.max(0, agent.crawlDelay), SECURITY_LIMITS.MAX_CRAWL_DELAY);
        robots += `Crawl-delay: ${safeDelay}\n`;
      }
      
      robots += "\n";
    });

    // Add sitemap with HTTPS enforcement
    if (sitemapUrl.trim()) {
      const safeSitemapUrl = sanitizeUrl(sitemapUrl.trim(), true); // HTTPS enforced
      if (!safeSitemapUrl) {
        notify.error("Sitemap URL must be a valid HTTPS URL");
        return;
      }
      robots += `Sitemap: ${safeSitemapUrl}\n`;
    }

    // Add custom rules with strict sanitization
    if (customRules.trim()) {
      // Control character removal and line normalization
      const safeCustomRules = truncateText(customRules, SECURITY_LIMITS.MAX_CUSTOM_RULES_LENGTH)
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
        .replace(/\r\n/g, '\n') // Normalize Windows line endings
        .replace(/\r/g, '\n') // Normalize Mac line endings
        .split('\n')
        .filter(line => line.trim()) // Remove empty lines
        .join('\n');
      
      if (safeCustomRules) {
        robots += `\n# Custom rules\n${safeCustomRules}\n`;
      }
    }

    setGeneratedRobots(robots.trim());
    setValidationErrors({}); // Clear errors on successful generation
    notify.success("Robots.txt generated successfully!");
  };

  /**
   * Copy to clipboard with validation
   */
  const copyToClipboard = async () => {
    if (!generatedRobots) {
      notify.error("Please generate robots.txt first");
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedRobots);
        notify.success("Copied to clipboard!");
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = generatedRobots;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            notify.success("Copied to clipboard!");
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

  /**
   * Download robots.txt with safe blob handling
   */
  const downloadRobotsTxt = () => {
    if (!generatedRobots) {
      notify.error("Please generate robots.txt first");
      return;
    }

    try {
      // Use text/plain MIME type for safety
      const blob = new Blob([generatedRobots], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'robots.txt';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      notify.success("Robots.txt downloaded!");
    } catch (err) {
      console.error('Failed to download: ', err);
      notify.error("Failed to download robots.txt!");
    }
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
          {/* Validation Status Banner */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">Please fix the following errors:</h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isFormValid && generatedRobots && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4" role="status">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                <p className="text-sm text-green-800 font-medium">All fields validated successfully!</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site-url">Site URL (optional)</Label>
              <Input
                id="site-url"
                placeholder="https://example.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                For reference only (not included in robots.txt)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sitemap-url">Sitemap URL (HTTPS Required)</Label>
              <Input
                id="sitemap-url"
                placeholder="https://example.com/sitemap.xml"
                value={sitemapUrl}
                onChange={(e) => {
                  setSitemapUrl(e.target.value);
                  // Clear error when user types
                  setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.sitemapUrl;
                    return newErrors;
                  });
                }}
                className={validationErrors.sitemapUrl ? 'border-red-500' : ''}
                aria-invalid={!!validationErrors.sitemapUrl}
                aria-describedby={validationErrors.sitemapUrl ? "sitemap-error" : "sitemap-hint"}
              />
              {validationErrors.sitemapUrl && (
                <p id="sitemap-error" className="text-sm text-red-500 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {validationErrors.sitemapUrl}
                </p>
              )}
              <p id="sitemap-hint" className="text-xs text-muted-foreground">
                Must use HTTPS protocol
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <Label>User Agents</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {userAgents.length}/{SECURITY_LIMITS.MAX_USER_AGENTS} user agents
                </p>
              </div>
              <Button 
                onClick={addUserAgent} 
                size="sm" 
                className="w-full sm:w-auto"
                disabled={userAgents.length >= SECURITY_LIMITS.MAX_USER_AGENTS}
              >
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
                      placeholder="* (all bots)"
                      value={agent.name}
                      onChange={(e) => {
                        updateUserAgent(index, 'name', e.target.value);
                        // Clear error when user types
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[`userAgent_${index}_name`];
                          return newErrors;
                        });
                      }}
                      className={validationErrors[`userAgent_${index}_name`] ? 'border-red-500' : ''}
                      aria-invalid={!!validationErrors[`userAgent_${index}_name`]}
                    />
                    {validationErrors[`userAgent_${index}_name`] && (
                      <p className="text-sm text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        {validationErrors[`userAgent_${index}_name`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Crawl Delay (seconds)</Label>
                    <Input
                      type="number"
                      min="0"
                      max={SECURITY_LIMITS.MAX_CRAWL_DELAY}
                      value={agent.crawlDelay}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        updateUserAgent(index, 'crawlDelay', value);
                        // Clear error when user types
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[`userAgent_${index}_crawlDelay`];
                          return newErrors;
                        });
                      }}
                      className={validationErrors[`userAgent_${index}_crawlDelay`] ? 'border-red-500' : ''}
                      aria-invalid={!!validationErrors[`userAgent_${index}_crawlDelay`]}
                    />
                    {validationErrors[`userAgent_${index}_crawlDelay`] && (
                      <p className="text-sm text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        {validationErrors[`userAgent_${index}_crawlDelay`]}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Max {SECURITY_LIMITS.MAX_CRAWL_DELAY}s
                    </p>
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
                    <div>
                      <Label>Disallow Paths</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {agent.disallow.length}/{SECURITY_LIMITS.MAX_DISALLOW_PATHS_PER_AGENT} paths
                      </p>
                    </div>
                    <Button
                      onClick={() => addDisallowPath(index)}
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={agent.disallow.length >= SECURITY_LIMITS.MAX_DISALLOW_PATHS_PER_AGENT}
                    >
                      Add Path
                    </Button>
                  </div>

                  {agent.disallow.map((path, pathIndex) => (
                    <div key={pathIndex} className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          placeholder="/admin, /private, etc."
                          value={path}
                          onChange={(e) => {
                            updateDisallowPath(index, pathIndex, e.target.value);
                            // Clear error when user types
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[`userAgent_${index}_path_${pathIndex}`];
                              return newErrors;
                            });
                          }}
                          className={validationErrors[`userAgent_${index}_path_${pathIndex}`] ? 'border-red-500 flex-1' : 'flex-1'}
                          aria-invalid={!!validationErrors[`userAgent_${index}_path_${pathIndex}`]}
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
                      {validationErrors[`userAgent_${index}_path_${pathIndex}`] && (
                        <p className="text-sm text-red-500 flex items-center gap-1" role="alert">
                          <AlertCircle className="h-3 w-3" aria-hidden="true" />
                          {validationErrors[`userAgent_${index}_path_${pathIndex}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="custom-rules">Custom Rules (optional)</Label>
              <p className="text-xs text-muted-foreground">
                {customRules.length}/{SECURITY_LIMITS.MAX_CUSTOM_RULES_LENGTH} characters
              </p>
            </div>
            <Textarea
              id="custom-rules"
              placeholder="# Add any custom robots.txt rules here..."
              value={customRules}
              onChange={(e) => {
                setCustomRules(e.target.value);
                // Clear error when user types
                setValidationErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.customRules;
                  return newErrors;
                });
              }}
              rows={3}
              className={validationErrors.customRules ? 'border-red-500' : ''}
              aria-invalid={!!validationErrors.customRules}
              aria-describedby={validationErrors.customRules ? 'custom-rules-error' : undefined}
            />
            {validationErrors.customRules && (
              <p id="custom-rules-error" className="text-sm text-red-500 flex items-center gap-1" role="alert">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                {validationErrors.customRules}
              </p>
            )}
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

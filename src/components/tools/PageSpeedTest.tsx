import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gauge, Clock, Zap, AlertTriangle, CheckCircle, ExternalLink, RotateCcw, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";

interface SpeedMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay (or TBT as fallback)
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  si: number; // Speed Index
  tti: number; // Time to Interactive
  tbt: number; // Total Blocking Time
  overall: number; // Overall score (0-100)
}

interface SpeedTestResult {
  url: string;
  metrics: SpeedMetrics;
  opportunities: Array<{ title: string; description: string; savings?: string }>;
  diagnostics: Array<{ title: string; description: string }>;
  timestamp: Date;
  strategy: 'mobile' | 'desktop';
}

// Free public API - no key required but rate limited
const PAGESPEED_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

interface LighthouseAudit {
  title: string;
  description?: string;
  score: number | null;
  numericValue?: number;
  displayValue?: string;
  details?: {
    overallSavingsMs?: number;
    [key: string]: unknown;
  };
}

interface LighthouseResult {
  audits: Record<string, LighthouseAudit>;
  categories?: {
    performance?: {
      score: number;
    };
  };
}

export const PageSpeedTest = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SpeedTestResult | null>(null);
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [error, setError] = useState<string | null>(null);

  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
    return hasScheme ? trimmed : `https://${trimmed}`;
  };

  const extractMetrics = (lighthouseResult: LighthouseResult): SpeedMetrics => {
    const audits = lighthouseResult.audits;
    
    // Extract Core Web Vitals and other metrics (values in milliseconds)
    const fcp = audits['first-contentful-paint']?.numericValue || 0;
    const lcp = audits['largest-contentful-paint']?.numericValue || 0;
    const cls = audits['cumulative-layout-shift']?.numericValue || 0;
    const ttfb = audits['server-response-time']?.numericValue || 0;
    const si = audits['speed-index']?.numericValue || 0;
    const tti = audits['interactive']?.numericValue || 0;
    const tbt = audits['total-blocking-time']?.numericValue || 0;
    
    // FID is not directly available in Lighthouse, use TBT as proxy
    const fid = tbt / 5; // Rough estimation
    
    // Overall performance score (0-1, convert to 0-100)
    const overall = (lighthouseResult.categories?.performance?.score || 0) * 100;
    
    return { fcp, lcp, fid, cls, ttfb, si, tti, tbt, overall };
  };

  const extractOpportunities = (lighthouseResult: LighthouseResult): Array<{ title: string; description: string; savings?: string }> => {
    const audits = lighthouseResult.audits;
    const opportunities: Array<{ title: string; description: string; savings?: string }> = [];
    
    // Key optimization opportunities
    const opportunityKeys = [
      'render-blocking-resources',
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'offscreen-images',
      'unminified-css',
      'unminified-javascript',
      'efficient-animated-content',
      'uses-optimized-images',
      'uses-text-compression',
      'uses-responsive-images'
    ];
    
    opportunityKeys.forEach(key => {
      const audit = audits[key];
      if (audit && audit.score !== null && audit.score < 1) {
        const savings = audit.details?.overallSavingsMs 
          ? `Save ~${Math.round(audit.details.overallSavingsMs)}ms`
          : undefined;
        
        opportunities.push({
          title: audit.title,
          description: audit.description || '',
          savings
        });
      }
    });
    
    return opportunities.slice(0, 10); // Limit to top 10
  };

  const extractDiagnostics = (lighthouseResult: LighthouseResult): Array<{ title: string; description: string }> => {
    const audits = lighthouseResult.audits;
    const diagnostics: Array<{ title: string; description: string }> = [];
    
    const diagnosticKeys = [
      'network-requests',
      'network-rtt',
      'network-server-latency',
      'main-thread-tasks',
      'bootup-time',
      'uses-long-cache-ttl',
      'dom-size',
      'critical-request-chains'
    ];
    
    diagnosticKeys.forEach(key => {
      const audit = audits[key];
      if (audit && audit.score !== null && audit.score < 1) {
        diagnostics.push({
          title: audit.title,
          description: audit.description || audit.displayValue || ''
        });
      }
    });
    
    return diagnostics.slice(0, 8); // Limit to top 8
  };

  const runSpeedTest = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL!");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const normalizedUrl = normalizeUrl(url);
      
      // Validate URL format
      try {
        new URL(normalizedUrl);
      } catch {
        throw new Error("Invalid URL format. Please enter a valid website URL.");
      }

      const apiUrl = `${PAGESPEED_API_URL}?url=${encodeURIComponent(normalizedUrl)}&strategy=${strategy}&category=performance`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data.lighthouseResult) {
        throw new Error("Invalid response from PageSpeed API");
      }
      
      const metrics = extractMetrics(data.lighthouseResult);
      const opportunities = extractOpportunities(data.lighthouseResult);
      const diagnostics = extractDiagnostics(data.lighthouseResult);
      
      setResult({
        url: normalizedUrl,
        metrics,
        opportunities,
        diagnostics,
        timestamp: new Date(),
        strategy
      });
      
      toast.success("Speed test completed!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to run speed test";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('PageSpeed test error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getMetricStatus = (value: number, thresholds: { good: number; needsImprovement: number }) => {
    if (value <= thresholds.good) return { status: "Good", color: "text-green-600" };
    if (value <= thresholds.needsImprovement) return { status: "Needs Improvement", color: "text-yellow-600" };
    return { status: "Poor", color: "text-red-600" };
  };

  const clearResults = () => {
    setResult(null);
    setUrl("");
    setError(null);
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Page Speed Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url-input">Website URL</Label>
            <Input
              id="url-input"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && url.trim() && !isLoading) {
                  runSpeedTest();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">Device Type</Label>
            <Select value={strategy} onValueChange={(value) => setStrategy(value as 'mobile' | 'desktop')}>
              <SelectTrigger id="strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile</span>
                  </div>
                </SelectItem>
                <SelectItem value="desktop">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span>Desktop</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Test your website performance on mobile or desktop devices
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={runSpeedTest} 
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Zap className="h-4 w-4" />
              {isLoading ? "Testing..." : "Run Speed Test"}
            </Button>
            <Button onClick={clearResults} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-red-800 dark:text-red-200 break-words">{error}</div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-xs sm:text-sm text-muted-foreground">Analyzing page speed with Google PageSpeed Insights...</span>
              </div>
              <Progress value={66} className="w-full" />
              <p className="text-xs text-muted-foreground">This may take 10-30 seconds depending on the page complexity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs sm:text-sm">Metrics</TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs sm:text-sm">Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-base sm:text-lg">
                  <span className="break-words">Overall Performance Score</span>
                  <Badge className={`${getScoreBadge(result.metrics.overall)} whitespace-nowrap`}>
                    {Math.round(result.metrics.overall)}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Gauge className={`h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 ${getScoreColor(result.metrics.overall)}`} />
                    <div>
                      <div className={`text-2xl sm:text-3xl font-bold ${getScoreColor(result.metrics.overall)}`}>
                        {Math.round(result.metrics.overall)}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Performance Score</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>Performance</span>
                      <span>{Math.round(result.metrics.overall)}%</span>
                    </div>
                    <Progress value={result.metrics.overall} className="w-full" />
                  </div>

                  <div className="text-xs sm:text-sm text-muted-foreground break-words">
                    Tested on {result.timestamp.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="break-words">First Contentful Paint</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xl sm:text-2xl font-bold break-all">
                      {Math.round(result.metrics.fcp)}ms
                    </div>
                    <div className={`text-xs sm:text-sm ${getMetricStatus(result.metrics.fcp, { good: 1800, needsImprovement: 3000 }).color}`}>
                      {getMetricStatus(result.metrics.fcp, { good: 1800, needsImprovement: 3000 }).status}
                    </div>
                    <div className="text-xs text-muted-foreground break-words">
                      Time until first text or image is painted
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="break-words">Largest Contentful Paint</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xl sm:text-2xl font-bold break-all">
                      {Math.round(result.metrics.lcp)}ms
                    </div>
                    <div className={`text-xs sm:text-sm ${getMetricStatus(result.metrics.lcp, { good: 2500, needsImprovement: 4000 }).color}`}>
                      {getMetricStatus(result.metrics.lcp, { good: 2500, needsImprovement: 4000 }).status}
                    </div>
                    <div className="text-xs text-muted-foreground break-words">
                      Time until largest content element is painted
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="break-words">First Input Delay</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xl sm:text-2xl font-bold break-all">
                      {Math.round(result.metrics.fid)}ms
                    </div>
                    <div className={`text-xs sm:text-sm ${getMetricStatus(result.metrics.fid, { good: 100, needsImprovement: 300 }).color}`}>
                      {getMetricStatus(result.metrics.fid, { good: 100, needsImprovement: 300 }).status}
                    </div>
                    <div className="text-xs text-muted-foreground break-words">
                      Time from first user interaction to browser response
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="break-words">Cumulative Layout Shift</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xl sm:text-2xl font-bold break-all">
                      {result.metrics.cls.toFixed(3)}
                    </div>
                    <div className={`text-xs sm:text-sm ${getMetricStatus(result.metrics.cls, { good: 0.1, needsImprovement: 0.25 }).color}`}>
                      {getMetricStatus(result.metrics.cls, { good: 0.1, needsImprovement: 0.25 }).status}
                    </div>
                    <div className="text-xs text-muted-foreground break-words">
                      Visual stability of page content
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {result.opportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Optimization Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.opportunities.map((opportunity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs sm:text-sm break-words mb-1">{opportunity.title}</div>
                          {opportunity.savings && (
                            <div className="text-xs text-green-600 font-medium mb-1">{opportunity.savings}</div>
                          )}
                          <div className="text-xs text-muted-foreground break-words">{opportunity.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.diagnostics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Diagnostics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.diagnostics.map((diagnostic, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs sm:text-sm break-words mb-1">{diagnostic.title}</div>
                          <div className="text-xs text-muted-foreground break-words">{diagnostic.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.opportunities.length === 0 && result.diagnostics.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium mb-1">Excellent Performance!</div>
                      <div className="text-xs text-muted-foreground">Your page is well optimized with no major issues detected.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Understanding Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">First Contentful Paint (FCP)</h4>
              <p>Measures how long it takes for the first text or image to appear. Good: &lt;1.8s, Needs Improvement: &lt;3s</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Largest Contentful Paint (LCP)</h4>
              <p>Measures when the largest content element becomes visible. Good: &lt;2.5s, Needs Improvement: &lt;4s</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Cumulative Layout Shift (CLS)</h4>
              <p>Measures visual stability - lower is better. Good: &lt;0.1, Needs Improvement: &lt;0.25</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Total Blocking Time (TBT)</h4>
              <p>Measures the time when the page is blocked from responding to user input. Good: &lt;200ms</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Page Speed Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>• Optimize and compress images (use WebP/AVIF formats)</li>
            <li>• Minimize and compress CSS, JavaScript, and HTML</li>
            <li>• Use a Content Delivery Network (CDN) for static assets</li>
            <li>• Enable browser caching and gzip/brotli compression</li>
            <li>• Remove unused CSS and JavaScript (tree shaking)</li>
            <li>• Lazy load images and videos below the fold</li>
            <li>• Use modern image formats and responsive images</li>
            <li>• Minimize render-blocking resources</li>
            <li>• Optimize server response time (TTFB)</li>
            <li>• Implement code splitting for large JavaScript bundles</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">About This Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <p>• This tool uses the official Google PageSpeed Insights API to analyze your website's performance</p>
            <p>• Results are based on real-world Chrome User Experience data and lab tests using Lighthouse</p>
            <p>• The API is rate-limited, so please wait between tests if testing multiple URLs</p>
            <p>• Performance scores can vary between tests due to network conditions and server load</p>
            <p>• For best results, test your production website rather than development environments</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

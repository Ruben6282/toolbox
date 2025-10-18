import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge, Clock, Zap, AlertTriangle, CheckCircle, ExternalLink, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface SpeedMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  overall: number; // Overall score
}

interface SpeedTestResult {
  url: string;
  metrics: SpeedMetrics;
  recommendations: string[];
  timestamp: Date;
}

export const PageSpeedTest = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SpeedTestResult | null>(null);

  // Simulate page speed test (in real implementation, this would call PageSpeed Insights API)
  const runSpeedTest = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL!");
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock results based on URL
      const mockMetrics: SpeedMetrics = {
        fcp: Math.random() * 3000 + 500, // 500-3500ms
        lcp: Math.random() * 4000 + 1000, // 1000-5000ms
        fid: Math.random() * 200 + 10, // 10-210ms
        cls: Math.random() * 0.3, // 0-0.3
        ttfb: Math.random() * 1000 + 200, // 200-1200ms
        overall: Math.random() * 100 // 0-100
      };

      const recommendations = generateRecommendations(mockMetrics);
      
      setResult({
        url: url.trim(),
        metrics: mockMetrics,
        recommendations,
        timestamp: new Date()
      });
      
      toast.success("Speed test completed!");
    } catch (error) {
      toast.error("Failed to run speed test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecommendations = (metrics: SpeedMetrics): string[] => {
    const recommendations: string[] = [];
    
    if (metrics.fcp > 1800) {
      recommendations.push("Optimize First Contentful Paint by reducing render-blocking resources");
    }
    if (metrics.lcp > 2500) {
      recommendations.push("Improve Largest Contentful Paint by optimizing images and critical resources");
    }
    if (metrics.fid > 100) {
      recommendations.push("Reduce First Input Delay by minimizing JavaScript execution time");
    }
    if (metrics.cls > 0.1) {
      recommendations.push("Minimize Cumulative Layout Shift by setting size attributes on images");
    }
    if (metrics.ttfb > 600) {
      recommendations.push("Improve Time to First Byte by optimizing server response time");
    }
    if (metrics.overall < 50) {
      recommendations.push("Consider using a CDN to improve global loading performance");
    }
    if (recommendations.length === 0) {
      recommendations.push("Great job! Your page speed is well optimized.");
    }
    
    return recommendations;
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
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Page Speed Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url-input">Website URL</Label>
            <Input
              id="url-input"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={runSpeedTest} 
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {isLoading ? "Testing..." : "Run Speed Test"}
            </Button>
            <Button onClick={clearResults} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Analyzing page speed...</span>
              </div>
              <Progress value={66} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Core Web Vitals</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Overall Performance Score</span>
                  <Badge className={getScoreBadge(result.metrics.overall)}>
                    {Math.round(result.metrics.overall)}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Gauge className={`h-12 w-12 ${getScoreColor(result.metrics.overall)}`} />
                    <div>
                      <div className={`text-3xl font-bold ${getScoreColor(result.metrics.overall)}`}>
                        {Math.round(result.metrics.overall)}
                      </div>
                      <div className="text-sm text-muted-foreground">Performance Score</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Performance</span>
                      <span>{Math.round(result.metrics.overall)}%</span>
                    </div>
                    <Progress value={result.metrics.overall} className="w-full" />
                  </div>

                  <div className="text-sm text-muted-foreground">
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
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    First Contentful Paint
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {Math.round(result.metrics.fcp)}ms
                    </div>
                    <div className={`text-sm ${getMetricStatus(result.metrics.fcp, { good: 1800, needsImprovement: 3000 }).color}`}>
                      {getMetricStatus(result.metrics.fcp, { good: 1800, needsImprovement: 3000 }).status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Time until first text or image is painted
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Largest Contentful Paint
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {Math.round(result.metrics.lcp)}ms
                    </div>
                    <div className={`text-sm ${getMetricStatus(result.metrics.lcp, { good: 2500, needsImprovement: 4000 }).color}`}>
                      {getMetricStatus(result.metrics.lcp, { good: 2500, needsImprovement: 4000 }).status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Time until largest content element is painted
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    First Input Delay
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {Math.round(result.metrics.fid)}ms
                    </div>
                    <div className={`text-sm ${getMetricStatus(result.metrics.fid, { good: 100, needsImprovement: 300 }).color}`}>
                      {getMetricStatus(result.metrics.fid, { good: 100, needsImprovement: 300 }).status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Time from first user interaction to browser response
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Cumulative Layout Shift
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {result.metrics.cls.toFixed(3)}
                    </div>
                    <div className={`text-sm ${getMetricStatus(result.metrics.cls, { good: 0.1, needsImprovement: 0.25 }).color}`}>
                      {getMetricStatus(result.metrics.cls, { good: 0.1, needsImprovement: 0.25 }).status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Visual stability of page content
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Page Speed Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Optimize images (WebP format, proper sizing, lazy loading)</li>
            <li>• Minimize and compress CSS, JavaScript, and HTML</li>
            <li>• Use a Content Delivery Network (CDN)</li>
            <li>• Enable browser caching and compression</li>
            <li>• Remove unused CSS and JavaScript</li>
            <li>• Optimize server response time and database queries</li>
            <li>• Use modern image formats and responsive images</li>
            <li>• Implement critical CSS inlining</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

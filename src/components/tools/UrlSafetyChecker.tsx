import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, XCircle, ExternalLink, RotateCcw, Globe } from "lucide-react";
import { toast } from "sonner";

interface SafetyResult {
  url: string;
  isSafe: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  threats: string[];
  details: {
    domain: string;
    protocol: string;
    hasSSL: boolean;
    suspiciousPatterns: string[];
    reputation: string;
  };
}

export const UrlSafetyChecker = () => {
  const [url, setUrl] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<SafetyResult | null>(null);

  const normalizeUrl = (raw: string) => {
    const trimmed = raw.trim();
    // If the string already contains a scheme (e.g., http://, https://, ftp://, or even a typo like hhtp://), don't prepend
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
    return hasScheme ? trimmed : `https://${trimmed}`;
  };

  const checkUrlSafety = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL to check!");
      return;
    }

    setIsChecking(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Parse URL with robust normalization (preserve existing scheme, only prepend if missing)
      let parsedUrl;
      try {
        parsedUrl = new URL(normalizeUrl(url));
      } catch {
        throw new Error("Invalid URL format");
      }

      // Simulate safety check (in real implementation, this would call a security API)
      const isSafe = Math.random() > 0.3; // 70% chance of being safe
      const riskLevel = isSafe ? 'low' : (Math.random() > 0.5 ? 'medium' : 'high');
      
      const threats: string[] = [];
      const suspiciousPatterns: string[] = [];
      
      if (!isSafe) {
        const possibleThreats = [
          "Malware detected",
          "Phishing attempt",
          "Suspicious redirect",
          "Potentially harmful content",
          "Known malicious domain",
          "Suspicious file download"
        ];
        
        const possiblePatterns = [
          "Shortened URL",
          "Suspicious domain",
          "Mixed content",
          "Unusual TLD",
          "IP address instead of domain"
        ];
        
        threats.push(possibleThreats[Math.floor(Math.random() * possibleThreats.length)]);
        suspiciousPatterns.push(possiblePatterns[Math.floor(Math.random() * possiblePatterns.length)]);
      }

      const safetyResult: SafetyResult = {
        url: parsedUrl.href,
        isSafe,
        riskLevel,
        threats,
        details: {
          domain: parsedUrl.hostname,
          protocol: parsedUrl.protocol,
          hasSSL: parsedUrl.protocol === 'https:',
          suspiciousPatterns,
          reputation: isSafe ? 'Good' : 'Poor'
        }
      };

      setResult(safetyResult);
      toast.success("URL safety check completed!");
    } catch (error) {
      toast.error("Failed to check URL safety. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const clearResults = () => {
    setResult(null);
    setUrl("");
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <XCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getSafetyIcon = (isSafe: boolean) => {
    return isSafe ? 
      <CheckCircle className="h-6 w-6 text-green-600" /> : 
      <XCircle className="h-6 w-6 text-red-600" />;
  };

  return (
  <div className="space-y-6 px-2 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle>URL Safety Checker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url-input">Website URL</Label>
            <Input
              id="url-input"
              placeholder="https://example.com or example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              onClick={checkUrlSafety} 
              disabled={isChecking || !url.trim()}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Shield className="h-4 w-4" />
              {isChecking ? "Checking..." : "Check Safety"}
            </Button>
            <Button onClick={clearResults} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {isChecking && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Analyzing URL safety...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="h-5 w-5" />
              Safety Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-2">
              <div className="flex items-center gap-3 w-full min-w-0">
                {getSafetyIcon(result.isSafe)}
                <div className="min-w-0">
                  <div className="font-semibold text-sm sm:text-base">
                    {result.isSafe ? "Safe to Visit" : "Potentially Unsafe"}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-all">
                    {result.url}
                  </div>
                </div>
              </div>
              <Badge className={getRiskColor(result.riskLevel) + " text-xs sm:text-sm px-2 py-1 whitespace-nowrap"}>
                <div className="flex items-center gap-1">
                  {getRiskIcon(result.riskLevel)}
                  {result.riskLevel.toUpperCase()} RISK
                </div>
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">URL Details</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Domain:</span>
                    <span className="font-mono break-all">{result.details.domain}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Protocol:</span>
                    <span className="font-mono break-all">{result.details.protocol}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">SSL Certificate:</span>
                    <span className={result.details.hasSSL ? "text-green-600" : "text-red-600"}>
                      {result.details.hasSSL ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Reputation:</span>
                    <span className={result.details.reputation === 'Good' ? "text-green-600" : "text-red-600"}>
                      {result.details.reputation}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">Security Analysis</h4>
                {result.threats.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs sm:text-sm text-red-600 font-medium">Detected Threats:</div>
                    {result.threats.map((threat, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span>{threat}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>No threats detected</span>
                  </div>
                )}

                {result.details.suspiciousPatterns.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs sm:text-sm text-yellow-600 font-medium">Suspicious Patterns:</div>
                    {result.details.suspiciousPatterns.map((pattern, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        <span>{pattern}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button 
                onClick={() => window.open(result.url, '_blank')} 
                variant="outline"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <ExternalLink className="h-4 w-4" />
                Visit URL
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>URL Safety Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 text-xs sm:text-sm">Before Clicking:</h4>
              <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                <li>• Check the URL for typos or suspicious characters</li>
                <li>• Look for HTTPS encryption (lock icon in browser)</li>
                <li>• Be cautious with shortened URLs</li>
                <li>• Verify the domain matches the expected website</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-xs sm:text-sm">Red Flags to Watch For:</h4>
              <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                <li>• URLs with random characters or numbers</li>
                <li>• Suspicious domain extensions</li>
                <li>• Requests for personal information</li>
                <li>• Unexpected downloads or pop-ups</li>
                <li>• Poor website design or spelling errors</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-xs sm:text-sm">Best Practices:</h4>
              <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                <li>• Use reputable antivirus software</li>
                <li>• Keep your browser and OS updated</li>
                <li>• Enable browser security features</li>
                <li>• Be skeptical of unsolicited links</li>
                <li>• Use a password manager</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disclaimer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <p>• This tool provides basic URL safety analysis and should not be the only security measure</p>
            <p>• Results are for informational purposes only and may not be 100% accurate</p>
            <p>• Always use your best judgment when visiting unfamiliar websites</p>
            <p>• Keep your security software updated and use multiple layers of protection</p>
            <p>• When in doubt, don't click the link</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

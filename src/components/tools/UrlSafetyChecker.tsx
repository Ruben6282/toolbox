import { useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, ExternalLink, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface SafetyResult {
  url: string;
  isSafe: boolean;
  riskLevel: "low" | "medium" | "high";
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
      await new Promise((r) => setTimeout(r, 1000)); // small delay for UX

      let parsedUrl;
      try {
        parsedUrl = new URL(normalizeUrl(url));
      } catch {
        throw new Error("Invalid URL format");
      }

      const suspiciousPatterns: string[] = [];
      const threats: string[] = [];

      const domain = parsedUrl.hostname;
      const protocol = parsedUrl.protocol;
      const hasSSL = protocol === "https:";
      const tld = domain.split(".").pop()?.toLowerCase() || "";

      // Heuristic checks
      if (!hasSSL) suspiciousPatterns.push("Missing HTTPS / SSL");
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain))
        suspiciousPatterns.push("IP address used instead of domain");
      if (domain.split(".").length > 3)
        suspiciousPatterns.push("Unusually long subdomain chain");
      if (parsedUrl.href.length > 150)
        suspiciousPatterns.push("Excessive URL length");
      if (/[0-9]{5,}/.test(domain))
        suspiciousPatterns.push("Domain contains long numeric strings");

      const badTlds = ["xyz", "top", "click", "club", "info", "gq", "cf", "ml"];
      if (badTlds.includes(tld))
        suspiciousPatterns.push(`Suspicious TLD (.${tld})`);

      const phishingKeywords = [
        "login",
        "secure",
        "update",
        "verify",
        "account",
        "banking",
        "payment",
      ];
      if (phishingKeywords.some((word) => parsedUrl.href.toLowerCase().includes(word)))
        suspiciousPatterns.push("Phishing-related keyword in URL");

      // Risk evaluation
      const riskScore = suspiciousPatterns.length;
      let riskLevel: "low" | "medium" | "high" = "low";
      if (riskScore >= 3) riskLevel = "high";
      else if (riskScore >= 1) riskLevel = "medium";

      if (riskLevel === "high")
        threats.push("Potential phishing or scam domain");
      if (riskLevel === "medium")
        threats.push("Suspicious characteristics detected");

      const safetyResult: SafetyResult = {
        url: parsedUrl.href,
        isSafe: riskLevel === "low",
        riskLevel,
        threats,
        details: {
          domain,
          protocol,
          hasSSL,
          suspiciousPatterns,
          reputation:
            riskLevel === "low" ? "Good" : riskLevel === "medium" ? "Questionable" : "Poor",
        },
      };

      setResult(safetyResult);
      toast.success("URL analysis complete!");
    } catch (error) {
      toast.error("Invalid or malformed URL.");
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
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return <CheckCircle className="h-4 w-4" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4" />;
      case "high":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getSafetyIcon = (isSafe: boolean) =>
    isSafe ? (
      <CheckCircle className="h-6 w-6 text-green-600" />
    ) : (
      <XCircle className="h-6 w-6 text-red-600" />
    );

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle>URL Safety Checker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="url-input">Website URL</Label>
          <Input
            id="url-input"
            placeholder="https://example.com or example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

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
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Analyzing URL...</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 mt-0.5">
                  {getSafetyIcon(result.isSafe)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm sm:text-base">
                    {result.isSafe ? "Safe to Visit" : "Potentially Unsafe"}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-words overflow-wrap-anywhere">
                    {result.url}
                  </div>
                </div>
              </div>
              <Badge
                className={`${getRiskColor(result.riskLevel)} text-xs sm:text-sm px-2 py-1 flex-shrink-0 self-start sm:self-center`}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  {getRiskIcon(result.riskLevel)}
                  {result.riskLevel.toUpperCase()} RISK
                </div>
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm sm:text-base mb-2">URL Details</h4>
                <div className="text-xs sm:text-sm space-y-1">
                  <p className="break-words">
                    <span className="font-medium">Domain:</span>{" "}
                    <span className="text-muted-foreground">{result.details.domain}</span>
                  </p>
                  <p className="break-words">
                    <span className="font-medium">Protocol:</span>{" "}
                    <span className="text-muted-foreground">{result.details.protocol}</span>
                  </p>
                  <p>
                    <span className="font-medium">SSL:</span>{" "}
                    <span className={result.details.hasSSL ? "text-green-600" : "text-red-600"}>
                      {result.details.hasSSL ? "Yes" : "No"}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Reputation:</span>{" "}
                    <span
                      className={
                        result.details.reputation === "Good" ? "text-green-600" : "text-yellow-600"
                      }
                    >
                      {result.details.reputation}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm sm:text-base mb-2">Security Analysis</h4>
                {result.threats.map((threat, i) => (
                  <p key={i} className="flex items-start gap-2 text-xs sm:text-sm text-red-600 mb-1">
                    <XCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{threat}</span>
                  </p>
                ))}
                {result.details.suspiciousPatterns.length > 0 && (
                  <>
                    <div className="text-yellow-600 mt-2 text-xs sm:text-sm font-medium">
                      Suspicious Patterns:
                    </div>
                    {result.details.suspiciousPatterns.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs sm:text-sm mb-1">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{p}</span>
                      </div>
                    ))}
                  </>
                )}
                {result.isSafe && (
                  <p className="flex items-start gap-2 text-xs sm:text-sm text-green-600">
                    <CheckCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>No suspicious signs detected</span>
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={() => window.open(result.url, "_blank")}
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4" />
              Visit URL
            </Button>
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
          <div className="text-xs sm:text-sm text-muted-foreground space-y-2">
            <p>
              ⚠️ This tool uses local heuristic checks to detect potentially unsafe or
              suspicious URLs. It does not connect to any external databases or services.
            </p>
            <p>
              🔍 Results are <b>not definitive</b> — a URL flagged as safe may still be
              dangerous, and a warning does not always mean a site is harmful.
            </p>
            <p>
              🧠 Always use up-to-date antivirus software, browser protection, and your
              own judgment when visiting unfamiliar websites.
            </p>
            <p>💡 This tool is for educational and informational use only.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

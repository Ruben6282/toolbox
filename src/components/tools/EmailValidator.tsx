import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";

export const EmailValidator = () => {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{
    valid: boolean;
    message: string;
    details: string[];
  } | null>(null);

  const validateEmail = () => {
    const details: string[] = [];
    
    // Check if empty
    if (!email.trim()) {
      setResult({
        valid: false,
        message: "Email address is required",
        details: ["No email provided"]
      });
      return;
    }

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);

    // Check for common issues
    if (email.includes(" ")) details.push("Contains spaces");
    if (email.includes("..")) details.push("Contains consecutive dots");
    if (!email.includes("@")) details.push("Missing @ symbol");
    if (email.split("@").length > 2) details.push("Multiple @ symbols");
    if (!email.split("@")[1]?.includes(".")) details.push("Missing domain extension");
    
    // Check local part
    const localPart = email.split("@")[0];
    if (localPart && localPart.length > 64) details.push("Local part too long (max 64 chars)");
    
    // Check domain
    const domain = email.split("@")[1];
    if (domain && domain.length > 255) details.push("Domain too long (max 255 chars)");

    if (isValidFormat && details.length === 0) {
      details.push("Valid email format");
      details.push(`Local part: ${localPart}`);
      details.push(`Domain: ${domain}`);
    }

    setResult({
      valid: isValidFormat && details.length === 0,
      message: isValidFormat && details.length === 0 
        ? "Valid email address" 
        : "Invalid email address",
      details: details.length > 0 ? details : ["Valid email format"]
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Email Validator</CardTitle>
        <CardDescription>Verify if an email address is valid and well-formatted</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Button onClick={validateEmail} className="w-full">
          Validate Email
        </Button>

        {result && (
          <div className={`rounded-lg border-2 p-6 ${
            result.valid 
              ? "border-green-500 bg-green-500/10" 
              : "border-red-500 bg-red-500/10"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {result.valid ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
              <div className={`text-xl font-semibold ${
                result.valid ? "text-green-500" : "text-red-500"
              }`}>
                {result.message}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Details:</h4>
              <ul className="space-y-1">
                {result.details.map((detail, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-current" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
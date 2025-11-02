import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    const trimmed = email.trim();

    if (!trimmed) {
      setResult({
        valid: false,
        message: "Email address is required",
        details: ["Please enter an email address."],
      });
      return;
    }

    // ✅ Production-level regex for standard signup validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    const isFormatValid = emailRegex.test(trimmed);

    const [localPart = "", domain = ""] = trimmed.split("@");
    const tld = domain.split(".").pop();

    // Base structure checks
    if (trimmed.includes(" ")) details.push("Contains spaces.");
    if (trimmed.includes("..")) details.push("Contains consecutive dots.");
    if (!trimmed.includes("@")) details.push("Missing '@' symbol.");
    if (trimmed.split("@").length > 2)
      details.push("Multiple '@' symbols detected.");
    if (!localPart) details.push("Missing local part before '@'.");
    if (!domain) details.push("Missing domain after '@'.");

    // Domain structure checks
    if (!domain.includes("."))
      details.push("Domain should contain a dot (e.g., gmail.com).");
    else if (tld) {
      if (tld.length < 2)
        details.push("Top-level domain should be at least 2 characters long.");
      if (!/^[A-Za-z]+$/.test(tld))
        details.push(
          "Top-level domain (after the last '.') should contain only letters."
        );
    }

    const isValid = isFormatValid && details.length === 0;

    if (isValid) {
      details.push(`✔ Local part: ${localPart}`);
      details.push(`✔ Domain: ${domain}`);
      details.push("✔ Well-formatted email address.");
    }

    setResult({
      valid: isValid,
      message: isValid
        ? "✅ Valid email address"
        : "❌ Invalid email format",
      details: details.length
        ? details
        : ["Invalid format — please check the domain and TLD."],
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Email Validator</CardTitle>
        <CardDescription>
          Checks if an email address is correctly formatted (like in signup forms)
        </CardDescription>
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
            onKeyDown={(e) => e.key === "Enter" && validateEmail()}
          />
        </div>

        <Button onClick={validateEmail} className="w-full">
          Validate Email
        </Button>

        {result && (
          <div
            className={`rounded-lg border-2 p-4 sm:p-6 transition-all duration-300 ${
              result.valid
                ? "border-green-500 bg-green-500/10"
                : "border-red-500 bg-red-500/10"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
              {result.valid ? (
                <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8 text-green-500" />
              ) : (
                <XCircle className="h-7 w-7 sm:h-8 sm:w-8 text-red-500" />
              )}
              <div
                className={`text-lg sm:text-xl font-semibold break-words ${
                  result.valid ? "text-green-600" : "text-red-600"
                }`}
              >
                {result.message}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground">
                Validation details:
              </h4>
              <ul className="space-y-1">
                {result.details.map((detail, index) => (
                  <li key={index} className="text-xs sm:text-sm flex items-center gap-2 break-words">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        result.valid ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
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

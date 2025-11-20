import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";

// Max JWT length (header + payload + signature base64url)
const MAX_JWT_LENGTH = 8192;

// Allow only base64url chars + dots
const sanitizeJwt = (val: string) => val.replace(/[^A-Za-z0-9._-]/g, "");

// Convert base64url → base64
const base64UrlToBase64 = (input: string) => {
  let output = input.replace(/-/g, "+").replace(/_/g, "/");
  const paddingNeeded = output.length % 4;
  if (paddingNeeded === 2) output += "==";
  else if (paddingNeeded === 3) output += "=";
  else if (paddingNeeded !== 0) throw new Error("Invalid base64url string");
  return output;
};

export const JwtDecoder = () => {
  const [input, setInput] = useState("");
  const [header, setHeader] = useState("");
  const [payload, setPayload] = useState("");

  const decode = () => {
    setHeader("");
    setPayload("");

    try {
      const parts = input.split(".");
      if (parts.length !== 3) {
        notify.error("Invalid JWT format!");
        return;
      }

      const [rawHeader, rawPayload] = parts;

      // Convert to valid base64
      const headerBase64 = base64UrlToBase64(rawHeader);
      const payloadBase64 = base64UrlToBase64(rawPayload);

      // Decode safely
      const decodedHeader = JSON.parse(atob(headerBase64));
      const decodedPayload = JSON.parse(atob(payloadBase64));

      setHeader(JSON.stringify(decodedHeader, null, 2));
      setPayload(JSON.stringify(decodedPayload, null, 2));

      notify.success("JWT decoded successfully!");
    } catch {
      notify.error("Failed to decode JWT! (Invalid Base64URL or malformed JSON)");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>JWT Token</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste JWT token here..."
            value={input}
            onChange={(e) =>
              setInput(sanitizeJwt(e.target.value).substring(0, MAX_JWT_LENGTH))
            }
            maxLength={MAX_JWT_LENGTH}
            className="min-h-[100px] font-mono text-xs"
          />
        </CardContent>
      </Card>

      <Button onClick={decode} className="w-full">
        Decode JWT
      </Button>

      {header && (
        <Card>
          <CardHeader>
            <CardTitle>Header</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs whitespace-pre-wrap">
              {header}
            </pre>
          </CardContent>
        </Card>
      )}

      {payload && (
        <Card>
          <CardHeader>
            <CardTitle>Payload</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs whitespace-pre-wrap">
              {payload}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

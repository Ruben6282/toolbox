import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";

// Max JWT length (header + payload + signature base64-encoded)
const MAX_JWT_LENGTH = 8192;

// Sanitize JWT: only allow base64url chars (A-Za-z0-9_-) and dots
const sanitizeJwt = (val: string) => val.replace(/[^A-Za-z0-9._-]/g, "");

export const JwtDecoder = () => {
  const [input, setInput] = useState("");
  const [header, setHeader] = useState("");
  const [payload, setPayload] = useState("");

  const decode = () => {
    try {
      const parts = input.split(".");
      if (parts.length !== 3) {
  notify.error("Invalid JWT format!");
        return;
      }

      const decodedHeader = JSON.parse(atob(parts[0]));
      const decodedPayload = JSON.parse(atob(parts[1]));

      setHeader(JSON.stringify(decodedHeader, null, 2));
      setPayload(JSON.stringify(decodedPayload, null, 2));
  notify.success("JWT decoded successfully!");
    } catch (e) {
  notify.error("Failed to decode JWT!");
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
            onChange={(e) => {
              const val = sanitizeJwt(e.target.value).substring(0, MAX_JWT_LENGTH);
              setInput(val);
            }}
            maxLength={MAX_JWT_LENGTH}
            className="min-h-[100px] font-mono text-xs"
          />
        </CardContent>
      </Card>

      <Button onClick={decode} className="w-full">Decode JWT</Button>

      {header && (
        <Card>
          <CardHeader>
            <CardTitle>Header</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">{header}</pre>
          </CardContent>
        </Card>
      )}

      {payload && (
        <Card>
          <CardHeader>
            <CardTitle>Payload</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">{payload}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

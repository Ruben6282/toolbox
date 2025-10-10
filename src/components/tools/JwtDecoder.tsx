import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const JwtDecoder = () => {
  const [input, setInput] = useState("");
  const [header, setHeader] = useState("");
  const [payload, setPayload] = useState("");

  const decode = () => {
    try {
      const parts = input.split(".");
      if (parts.length !== 3) {
        toast.error("Invalid JWT format!");
        return;
      }

      const decodedHeader = JSON.parse(atob(parts[0]));
      const decodedPayload = JSON.parse(atob(parts[1]));

      setHeader(JSON.stringify(decodedHeader, null, 2));
      setPayload(JSON.stringify(decodedPayload, null, 2));
      toast.success("JWT decoded successfully!");
    } catch (e) {
      toast.error("Failed to decode JWT!");
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
            onChange={(e) => setInput(e.target.value)}
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

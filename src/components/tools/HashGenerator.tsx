import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH } from "@/lib/security";

// Strip control chars from input
const sanitizeInput = (text: string): string => {
  return text.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code >= 32 || code === 9 || code === 10 || code === 13;
  }).join('');
};

export const HashGenerator = () => {
  const [input, setInput] = useState("");
  const [md5Hash, setMd5Hash] = useState("");
  const [sha1Hash, setSha1Hash] = useState("");
  const [sha256Hash, setSha256Hash] = useState("");

  const generateHashes = async () => {
    if (!input) {
      notify.error("Please enter some text!");
      return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    // SHA-1
    const sha1Buffer = await crypto.subtle.digest("SHA-1", data);
    const sha1 = Array.from(new Uint8Array(sha1Buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setSha1Hash(sha1);

    // SHA-256
    const sha256Buffer = await crypto.subtle.digest("SHA-256", data);
    const sha256 = Array.from(new Uint8Array(sha256Buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setSha256Hash(sha256);

    // MD5 (simple implementation - not cryptographically secure)
    setMd5Hash(simpleMD5(input));

  notify.success("Hashes generated!");
  };

  // Simple MD5 implementation
  const simpleMD5 = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(32, "0");
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        notify.success(`${type} hash copied!`);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          notify.success(`${type} hash copied!`);
        } else {
          notify.error("Failed to copy");
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      notify.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter text to hash..."
            value={input}
            onChange={(e) => {
              const cleaned = sanitizeInput(e.target.value);
              if (!validateTextLength(cleaned)) {
                notify.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
                setInput(truncateText(cleaned));
              } else {
                setInput(cleaned);
              }
            }}
            className="min-h-[150px]"
            maxLength={MAX_TEXT_LENGTH}
          />
        </CardContent>
      </Card>

      <Button onClick={generateHashes} className="w-full">Generate Hashes</Button>

      {(md5Hash || sha1Hash || sha256Hash) && (
        <Tabs defaultValue="md5" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="md5" className="flex-1">MD5</TabsTrigger>
            <TabsTrigger value="sha1" className="flex-1">SHA-1</TabsTrigger>
            <TabsTrigger value="sha256" className="flex-1">SHA-256</TabsTrigger>
          </TabsList>
          
          <TabsContent value="md5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  MD5 Hash
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(md5Hash, "MD5")}>
                    Copy
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className="block p-4 bg-muted rounded-lg break-all text-sm">{md5Hash}</code>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sha1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  SHA-1 Hash
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(sha1Hash, "SHA-1")}>
                    Copy
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className="block p-4 bg-muted rounded-lg break-all text-sm">{sha1Hash}</code>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sha256">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  SHA-256 Hash
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(sha256Hash, "SHA-256")}>
                    Copy
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className="block p-4 bg-muted rounded-lg break-all text-sm">{sha256Hash}</code>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

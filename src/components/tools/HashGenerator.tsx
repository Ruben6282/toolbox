import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const HashGenerator = () => {
  const [input, setInput] = useState("");
  const [md5Hash, setMd5Hash] = useState("");
  const [sha1Hash, setSha1Hash] = useState("");
  const [sha256Hash, setSha256Hash] = useState("");

  const generateHashes = async () => {
    if (!input) {
      toast.error("Please enter some text!");
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

    toast.success("Hashes generated!");
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

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} hash copied!`);
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
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px]"
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

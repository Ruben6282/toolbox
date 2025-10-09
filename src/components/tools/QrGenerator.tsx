import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const QrGenerator = () => {
  const [text, setText] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  const generate = () => {
    if (!text) {
      toast.error("Please enter text!");
      return;
    }
    const encodedText = encodeURIComponent(text);
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedText}`);
    toast.success("QR code generated!");
  };

  const download = () => {
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = "qrcode.png";
    link.click();
    toast.success("QR code downloaded!");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate QR Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Text or URL</Label>
            <Input
              placeholder="Enter text or URL..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <Button onClick={generate} className="w-full">Generate QR Code</Button>
        </CardContent>
      </Card>

      {qrUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Generated QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <img src={qrUrl} alt="QR Code" className="rounded-lg border" />
            </div>
            <Button onClick={download} className="w-full" variant="secondary">
              Download QR Code
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

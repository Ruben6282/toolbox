import { useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const QrGenerator = () => {
  const [text, setText] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  const generate = async () => {
    if (!text) {
      toast.error("Please enter text!");
      return;
    }

    try {
      const dataUrl = await QRCode.toDataURL(text, { width: 300 });
      setQrUrl(dataUrl);
      toast.success("QR code generated!");
    } catch (err) {
      toast.error("Failed to generate QR code.");
    }
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

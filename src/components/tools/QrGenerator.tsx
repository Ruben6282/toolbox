import { useState, useRef } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";

/* ---------------------------------------
   CONSTANTS & SANITIZATION
---------------------------------------- */

const MAX_QR_LENGTH = 2048; // Hard upper bound
const SAFE_DISPLAY_LIMIT = 512; // Warn user if text is too long

// Strip control chars except tab/newline/CR
const sanitizeInput = (val: string) =>
  val
    .split("")
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10 || code === 13;
    })
    .join("")
    .substring(0, MAX_QR_LENGTH);

/* ---------------------------------------
   COMPONENT
---------------------------------------- */

export const QrGenerator = () => {
  const [text, setText] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const previousBlobRef = useRef<string | null>(null);

  /* Cleanup old QR blob URLs to avoid memory leaks */
  const cleanupOldQr = () => {
    if (previousBlobRef.current) {
      URL.revokeObjectURL(previousBlobRef.current);
      previousBlobRef.current = null;
    }
  };

  const generate = async () => {
    const cleaned = sanitizeInput(text);

    if (!cleaned.trim()) {
      notify.error("Please enter text!");
      return;
    }

    if (cleaned.length > SAFE_DISPLAY_LIMIT) {
      notify.error("Your text is very long — QR code may not be scannable.");
    }

    setIsGenerating(true);
    cleanupOldQr();

    try {
      const dataUrl = await QRCode.toDataURL(cleaned, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "M",
      });

      setQrUrl(dataUrl);
      previousBlobRef.current = dataUrl;
      notify.success("QR code generated!");
    } catch (err) {
      console.error("QR generation error:", err);
      notify.error("Failed to generate QR code.");
      setQrUrl("");
    } finally {
      setIsGenerating(false);
    }
  };

  const download = () => {
    if (!qrUrl) {
      notify.error("No QR code to download!");
      return;
    }

    try {
      const link = document.createElement("a");
      link.href = qrUrl;
      link.download = "qrcode.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notify.success("QR code downloaded!");
    } catch (err) {
      console.error("QR download error:", err);
      notify.error("Failed to download QR code.");
    }
  };

  return (
    <div className="space-y-4">
      {/* INPUT CARD */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Generator</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-text">Text or URL</Label>
            <Input
              id="qr-text"
              placeholder="Enter text or URL..."
              value={text}
              onChange={(e) => setText(sanitizeInput(e.target.value))}
              maxLength={MAX_QR_LENGTH}
              aria-label="QR code text input"
            />
          </div>

          <Button 
            onClick={generate} 
            disabled={isGenerating} 
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Generate QR Code"}
          </Button>
        </CardContent>
      </Card>

      {/* OUTPUT CARD */}
      {qrUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Your QR Code</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <img
                src={qrUrl}
                alt="Generated QR Code"
                width={300}
                height={300}
                className="rounded-lg border shadow-sm"
                loading="lazy"
              />
            </div>

            <Button 
              onClick={download} 
              className="w-full" 
              variant="secondary"
            >
              Download QR Code
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

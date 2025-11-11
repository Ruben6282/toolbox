/**
 * ImageToBase64 - Enterprise-grade image to Base64 encoder
 * 
 * Security Features:
 * - File Size Limit: 10MB MAX_FILE_SIZE_MB prevents memory exhaustion
 * - Magic Byte Validation: sniffMime() verifies PNG/JPEG/WEBP signatures
 * - Dimension Guardrails: MAX_IMAGE_DIMENSION (4096px) with validation warning
 * - Clipboard Security: Enhanced error handling with explicit logging
 * - Accessibility: aria-live announcements for screen readers
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ALLOWED_IMAGE_TYPES, validateImageFile, MAX_IMAGE_DIMENSION } from "@/lib/security";
import { ShieldCheck } from "lucide-react";

const MAX_FILE_SIZE_MB = 10;

/**
 * Detect image format via magic bytes (file signature)
 * Prevents MIME spoofing attacks
 */
async function sniffMime(file: File): Promise<string | null> {
  const buffer = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return "image/png";
  }
  
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return "image/jpeg";
  }
  
  // WebP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return "image/webp";
  }
  
  // GIF: GIF87a or GIF89a
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  
  // BMP: BM
  if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
    return "image/bmp";
  }
  
  return null;
}

export const ImageToBase64 = () => {
  const [base64, setBase64] = useState("");
  const [preview, setPreview] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size check
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      notify.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      return;
    }

    // MIME type allowlist check
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notify.error("Invalid file type. Only PNG, JPEG, WebP, GIF, and BMP are allowed.");
      return;
    }

    // Magic bytes verification
    const sniffed = await sniffMime(file);
    if (!sniffed || !ALLOWED_IMAGE_TYPES.includes(sniffed)) {
      notify.error("File signature mismatch. File may be corrupted or spoofed.");
      return;
    }

    // Dimension guardrail check via Image element
    const checkDimensions = new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
          notify.warning(
            `Image dimensions (${img.width}×${img.height}px) exceed recommended limit (${MAX_IMAGE_DIMENSION}px). Base64 encoding may be slow.`
          );
        }
        resolve(true);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        notify.error("Failed to load image. File may be corrupted.");
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });

    const dimensionCheckPassed = await checkDimensions;
    if (!dimensionCheckPassed) return;

    // Read file as Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string; // guaranteed image/* data URL by validation
      setBase64(result);
      setPreview(result);
      notify.success("Image converted to Base64!");
    };
    reader.onerror = (err) => {
      notify.error("Failed to read image file");
      console.error("FileReader error:", err);
    };
    reader.readAsDataURL(file);
  };

    const copyToClipboard = () => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(base64)
          .then(() => {
            notify.success("Base64 string copied!");
            console.log("Clipboard write successful via Clipboard API");
          })
          .catch((err) => {
            console.error("Clipboard API failed:", err);
            fallbackCopy();
          });
      } else {
        console.warn("Clipboard API not available, using fallback method");
        fallbackCopy();
      }
    };

    // Fallback for mobile browsers
    const fallbackCopy = () => {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = base64;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        
        if (success) {
          notify.success("Base64 string copied!");
          console.log("Clipboard write successful via fallback method");
        } else {
          notify.error("Copy failed. Please copy manually.");
          console.error("execCommand('copy') returned false");
        }
      } catch (err) {
        notify.error("Copy failed. Please copy manually.");
        console.error("Fallback copy method failed:", err);
      }
    };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Select Image</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleFileChange}
          />
        </CardContent>
      </Card>

      {preview && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                aria-live="polite" 
                aria-atomic="true"
                className="rounded-lg"
              >
                <img
                  src={preview}
                  alt="Base64 encoded image preview"
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Base64 String
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  Copy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div aria-live="polite" aria-atomic="true">
                <Textarea
                  value={base64}
                  readOnly
                  className="min-h-[150px] font-mono text-xs"
                  aria-label="Base64 encoded image string"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Length: {base64.length.toLocaleString()} characters
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

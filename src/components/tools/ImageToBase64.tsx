import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/notify";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ALLOWED_IMAGE_TYPES, validateImageFile } from "@/lib/security";

export const ImageToBase64 = () => {
  const [base64, setBase64] = useState("");
  const [preview, setPreview] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      notify.error(error);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string; // guaranteed image/* data URL by validation
      setBase64(result);
      setPreview(result);
      notify.success("Image converted to Base64!");
    };
    reader.onerror = () => notify.error("Failed to read image file");
    reader.readAsDataURL(file);
  };

    const copyToClipboard = () => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(base64)
          .then(() => notify.success("Base64 string copied!"))
          .catch(() => fallbackCopy());
      } else {
        fallbackCopy();
      }
    };

    // Fallback for mobile browsers
    const fallbackCopy = () => {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = base64;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        notify.success("Base64 string copied!");
      } catch {
        notify.error("Copy failed. Please copy manually.");
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
              <img
                src={preview}
                alt="Preview"
                className="max-w-full h-auto rounded-lg"
              />
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
              <Textarea
                value={base64}
                readOnly
                className="min-h-[150px] font-mono text-xs"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

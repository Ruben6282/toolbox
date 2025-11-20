import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, RotateCcw } from "lucide-react";
import { notify } from "@/lib/notify";
import {
  encodeMetaTag,
  validateTextLength,
  truncateText,
} from "@/lib/security";

/* -------------------------------------------------------------------------- */
/*                               HARD GUARDRAILS                               */
/* -------------------------------------------------------------------------- */

const MAX_FIELD_LEN = 200;

// Only safe CSS identifier chars
const sanitizeIdentifier = (s: string, max: number = MAX_FIELD_LEN) =>
  s
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);

// Encode attributes like HTML-safe
const safeAttr = (s: string, max: number = MAX_FIELD_LEN) =>
  encodeMetaTag(s.slice(0, max));

const coerceType = (t: string) =>
  [
    "primary",
    "secondary",
    "success",
    "danger",
    "warning",
    "info",
    "light",
    "dark",
    "link",
  ].includes(t)
    ? t
    : "primary";

const coerceSize = (s: string) => (["sm", "md", "lg"].includes(s) ? s : "md");

/* -------------------------------------------------------------------------- */

export const BootstrapButtonGenerator = () => {
  const [buttonText, setButtonText] = useState("Click me");
  const [buttonType, setButtonType] = useState("primary");
  const [buttonSize, setButtonSize] = useState("md");
  const [buttonOutline, setButtonOutline] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [buttonBlock, setButtonBlock] = useState(false);
  const [buttonActive, setButtonActive] = useState(false);
  const [buttonId, setButtonId] = useState("");
  const [buttonClass, setButtonClass] = useState("");

  /* -------------------------------------------------------------------------- */
  /*                               GENERATE CLASSES                             */
  /* -------------------------------------------------------------------------- */

  const generateBootstrapClasses = () => {
    const safeType = coerceType(buttonType);
    const safeSize = coerceSize(buttonSize);
    const safeCustomClass = sanitizeIdentifier(buttonClass);

    let classes = "btn";

    classes += buttonOutline ? ` btn-outline-${safeType}` : ` btn-${safeType}`;
    if (safeSize !== "md") classes += ` btn-${safeSize}`;
    if (buttonBlock) classes += " w-100"; // Bootstrap 5 replacement
    if (buttonActive) classes += " active";
    if (buttonDisabled) classes += " disabled";
    if (safeCustomClass) classes += ` ${safeCustomClass}`;

    return classes;
  };

  /* -------------------------------------------------------------------------- */
  /*                               GENERATE HTML                                */
  /* -------------------------------------------------------------------------- */

  const generateHTML = () => {
    const classes = safeAttr(generateBootstrapClasses());
    const safeId = sanitizeIdentifier(buttonId);
    const idAttr = safeId ? ` id="${safeAttr(safeId)}"` : "";
    const disabledAttr = buttonDisabled ? " disabled" : "";
    const ariaPressed = buttonActive ? ` aria-pressed="true"` : "";
    const safeText = safeAttr(buttonText);

    return `<button class="${classes}"${idAttr}${disabledAttr}${ariaPressed}>${safeText}</button>`;
  };

  /* -------------------------------------------------------------------------- */
  /*                                CUSTOM CSS                                  */
  /* -------------------------------------------------------------------------- */

  const generateCSS = () => {
    const safeClass = sanitizeIdentifier(buttonClass);
    return `/* Bootstrap button styles come from Bootstrap */
/* Add custom styles below */
${safeClass ? `.${safeClass} { /* custom styles */ }` : ""}`;
  };

  /* -------------------------------------------------------------------------- */
  /*                                CLIPBOARD                                   */
  /* -------------------------------------------------------------------------- */

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        notify.success("Copied!");
        return;
      }

      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-999999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);

      notify[ok ? "success" : "error"](ok ? "Copied!" : "Copy failed");
    } catch (err) {
      console.error(err);
      notify.error("Copy failed");
    }
  };

  /* -------------------------------------------------------------------------- */

  const clearAll = () => {
    setButtonText("Click me");
    setButtonType("primary");
    setButtonSize("md");
    setButtonOutline(false);
    setButtonDisabled(false);
    setButtonBlock(false);
    setButtonActive(false);
    setButtonId("");
    setButtonClass("");
    notify.success("Reset!");
  };

  /* -------------------------------------------------------------------------- */
  /*                                 PREVIEW UI                                 */
  /* -------------------------------------------------------------------------- */

  const getPreviewButtonClass = () => {
    const base =
      "inline-flex items-center justify-center border text-sm font-medium rounded-md transition-colors px-4 py-2";

    const disabled = buttonDisabled ? "opacity-50 cursor-not-allowed" : "";
    const block = buttonBlock ? "w-full" : "";

    const size =
      buttonSize === "sm"
        ? "px-3 py-1.5 text-xs"
        : buttonSize === "lg"
        ? "px-6 py-3 text-base"
        : "px-4 py-2 text-sm";

    let color = "";

    if (buttonOutline) {
      const outlineMap: Record<string, string> = {
        primary: "border-blue-500 text-blue-500 hover:bg-blue-50",
        secondary: "border-gray-500 text-gray-600 hover:bg-gray-50",
        success: "border-green-500 text-green-600 hover:bg-green-50",
        danger: "border-red-500 text-red-600 hover:bg-red-50",
        warning: "border-yellow-500 text-yellow-600 hover:bg-yellow-50",
        info: "border-cyan-500 text-cyan-600 hover:bg-cyan-50",
        light: "border-gray-300 text-gray-700 hover:bg-gray-100",
        dark: "border-gray-800 text-gray-800 hover:bg-gray-200",
        link: "text-blue-500 hover:underline border-transparent",
      };
      color = outlineMap[buttonType] ?? outlineMap.primary;
    } else {
      const filledMap: Record<string, string> = {
        primary: "bg-blue-500 text-white hover:bg-blue-600",
        secondary: "bg-gray-500 text-white hover:bg-gray-600",
        success: "bg-green-500 text-white hover:bg-green-600",
        danger: "bg-red-500 text-white hover:bg-red-600",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600",
        info: "bg-cyan-500 text-white hover:bg-cyan-600",
        light: "bg-gray-200 text-gray-800 hover:bg-gray-300",
        dark: "bg-gray-800 text-white hover:bg-gray-900",
        link: "bg-transparent text-blue-500 hover:underline",
      };
      color = filledMap[buttonType] ?? filledMap.primary;
    }

    return `${base} ${size} ${color} ${disabled} ${block}`;
  };

  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bootstrap Button Generator</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* TEXT */}
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input
              value={buttonText}
              onChange={(e) => {
                const v = e.target.value;
                if (!validateTextLength(v, MAX_FIELD_LEN)) {
                  setButtonText(truncateText(v, MAX_FIELD_LEN));
                } else setButtonText(v);
              }}
            />
          </div>

          {/* TYPE + SIZE */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Button Type</Label>
              <Select value={buttonType} onValueChange={setButtonType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "primary",
                    "secondary",
                    "success",
                    "danger",
                    "warning",
                    "info",
                    "light",
                    "dark",
                    "link",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t[0].toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={buttonSize} onValueChange={setButtonSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* OPTIONS */}
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="grid grid-cols-2 gap-4">
                {/* typed tuple so label/val/setter have correct types */}
                {(
                  ([
                    ["Outline Style", buttonOutline, setButtonOutline],
                    ["Disabled", buttonDisabled, setButtonDisabled],
                    ["Full Width", buttonBlock, setButtonBlock],
                    ["Active State", buttonActive, setButtonActive],
                  ] as Array<[string, boolean, Dispatch<SetStateAction<boolean>>]>)
                ).map(([label, val, setter], idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Checkbox checked={val} onCheckedChange={(v) => setter(Boolean(v))} />
                    <Label className="text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

          {/* ID + CLASS */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Button ID</Label>
              <Input
                value={buttonId}
                onChange={(e) => setButtonId(sanitizeIdentifier(e.target.value))}
                placeholder="my-button"
              />
            </div>

            <div className="space-y-2">
              <Label>Additional CSS Class</Label>
              <Input
                value={buttonClass}
                onChange={(e) =>
                  setButtonClass(sanitizeIdentifier(e.target.value))
                }
                placeholder="custom-class"
              />
            </div>
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* PREVIEW */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-6 bg-gray-100 rounded-lg">
            <button className={getPreviewButtonClass()} disabled={buttonDisabled}>
              {buttonText}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* CODE OUTPUT */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Code</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* CLASSES */}
          <div className="space-y-2">
            <Label>Bootstrap Classes</Label>
            <div className="flex gap-2">
              <Input
                value={generateBootstrapClasses()}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(generateBootstrapClasses())}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* HTML */}
          <div className="space-y-2">
            <Label>HTML</Label>
            <div className="flex gap-2">
              <Input
                value={generateHTML()}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(generateHTML())}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* CSS */}
          <div className="space-y-2">
            <Label>CSS (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={generateCSS()}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(generateCSS())}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

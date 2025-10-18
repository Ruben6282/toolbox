import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, RotateCcw, Square } from "lucide-react";

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

  const buttonTypes = [
    { label: "Primary", value: "primary", color: "bg-blue-500" },
    { label: "Secondary", value: "secondary", color: "bg-gray-500" },
    { label: "Success", value: "success", color: "bg-green-500" },
    { label: "Danger", value: "danger", color: "bg-red-500" },
    { label: "Warning", value: "warning", color: "bg-yellow-500" },
    { label: "Info", value: "info", color: "bg-cyan-500" },
    { label: "Light", value: "light", color: "bg-gray-200" },
    { label: "Dark", value: "dark", color: "bg-gray-800" },
    { label: "Link", value: "link", color: "bg-transparent" }
  ];

  const buttonSizes = [
    { label: "Small", value: "sm" },
    { label: "Medium", value: "md" },
    { label: "Large", value: "lg" }
  ];

  const generateBootstrapClasses = () => {
    let classes = "btn";
    
    if (buttonOutline) {
      classes += ` btn-outline-${buttonType}`;
    } else {
      classes += ` btn-${buttonType}`;
    }
    
    if (buttonSize !== "md") {
      classes += ` btn-${buttonSize}`;
    }
    
    if (buttonBlock) {
      classes += " btn-block";
    }
    
    if (buttonActive) {
      classes += " active";
    }
    
    if (buttonDisabled) {
      classes += " disabled";
    }
    
    if (buttonClass) {
      classes += ` ${buttonClass}`;
    }
    
    return classes;
  };

  const generateHTML = () => {
    const classes = generateBootstrapClasses();
    const idAttr = buttonId ? ` id="${buttonId}"` : "";
    const disabledAttr = buttonDisabled ? " disabled" : "";
    const ariaPressed = buttonActive ? ' aria-pressed="true"' : "";
    
    return `<button class="${classes}"${idAttr}${disabledAttr}${ariaPressed}>${buttonText}</button>`;
  };

  const generateCSS = () => {
    return `/* Bootstrap button styles are included in Bootstrap CSS */
/* Custom styles can be added here */
${buttonClass ? `.${buttonClass} { /* Your custom styles */ }` : ''}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

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
  };

  const getPreviewButtonClass = () => {
    const baseClass = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
    
    let colorClass = "";
    if (buttonOutline) {
      switch (buttonType) {
        case "primary": colorClass = "border-blue-500 text-blue-500 hover:bg-blue-50"; break;
        case "secondary": colorClass = "border-gray-500 text-gray-500 hover:bg-gray-50"; break;
        case "success": colorClass = "border-green-500 text-green-500 hover:bg-green-50"; break;
        case "danger": colorClass = "border-red-500 text-red-500 hover:bg-red-50"; break;
        case "warning": colorClass = "border-yellow-500 text-yellow-500 hover:bg-yellow-50"; break;
        case "info": colorClass = "border-cyan-500 text-cyan-500 hover:bg-cyan-50"; break;
        case "light": colorClass = "border-gray-200 text-gray-500 hover:bg-gray-50"; break;
        case "dark": colorClass = "border-gray-800 text-gray-800 hover:bg-gray-50"; break;
        case "link": colorClass = "border-transparent text-blue-500 hover:underline"; break;
      }
    } else {
      switch (buttonType) {
        case "primary": colorClass = "bg-blue-500 text-white hover:bg-blue-600"; break;
        case "secondary": colorClass = "bg-gray-500 text-white hover:bg-gray-600"; break;
        case "success": colorClass = "bg-green-500 text-white hover:bg-green-600"; break;
        case "danger": colorClass = "bg-red-500 text-white hover:bg-red-600"; break;
        case "warning": colorClass = "bg-yellow-500 text-white hover:bg-yellow-600"; break;
        case "info": colorClass = "bg-cyan-500 text-white hover:bg-cyan-600"; break;
        case "light": colorClass = "bg-gray-200 text-gray-800 hover:bg-gray-300"; break;
        case "dark": colorClass = "bg-gray-800 text-white hover:bg-gray-900"; break;
        case "link": colorClass = "bg-transparent text-blue-500 hover:underline"; break;
      }
    }
    
    let sizeClass = "";
    switch (buttonSize) {
      case "sm": sizeClass = "px-3 py-1.5 text-xs"; break;
      case "md": sizeClass = "px-4 py-2 text-sm"; break;
      case "lg": sizeClass = "px-6 py-3 text-base"; break;
    }
    
    const disabledClass = buttonDisabled ? "opacity-50 cursor-not-allowed" : "";
    const blockClass = buttonBlock ? "w-full" : "";
    
    return `${baseClass} ${colorClass} ${sizeClass} ${disabledClass} ${blockClass}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bootstrap Button Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="button-text">Button Text</Label>
            <Input
              id="button-text"
              placeholder="Click me"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="button-type">Button Type</Label>
              <Select value={buttonType} onValueChange={setButtonType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select button type" />
                </SelectTrigger>
                <SelectContent>
                  {buttonTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="button-size">Button Size</Label>
              <Select value={buttonSize} onValueChange={setButtonSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select button size" />
                </SelectTrigger>
                <SelectContent>
                  {buttonSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Button Options</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="button-outline"
                  checked={buttonOutline}
                  onCheckedChange={(checked) => setButtonOutline(checked as boolean)}
                />
                <Label htmlFor="button-outline" className="text-sm">Outline Style</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="button-disabled"
                  checked={buttonDisabled}
                  onCheckedChange={(checked) => setButtonDisabled(checked as boolean)}
                />
                <Label htmlFor="button-disabled" className="text-sm">Disabled</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="button-block"
                  checked={buttonBlock}
                  onCheckedChange={(checked) => setButtonBlock(checked as boolean)}
                />
                <Label htmlFor="button-block" className="text-sm">Full Width</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="button-active"
                  checked={buttonActive}
                  onCheckedChange={(checked) => setButtonActive(checked as boolean)}
                />
                <Label htmlFor="button-active" className="text-sm">Active State</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="button-id">Button ID</Label>
              <Input
                id="button-id"
                placeholder="my-button"
                value={buttonId}
                onChange={(e) => setButtonId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="button-class">Additional CSS Classes</Label>
              <Input
                id="button-class"
                placeholder="my-custom-class"
                value={buttonClass}
                onChange={(e) => setButtonClass(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Button Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-8 bg-gray-100 rounded-lg">
            <button
              className={getPreviewButtonClass()}
              disabled={buttonDisabled}
            >
              {buttonText}
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bootstrap Classes</Label>
            <div className="flex gap-2">
              <Input
                value={generateBootstrapClasses()}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(generateBootstrapClasses())}
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>HTML Code</Label>
            <div className="flex gap-2">
              <Input
                value={generateHTML()}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(generateHTML())}
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>CSS (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={generateCSS()}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(generateCSS())}
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bootstrap Button Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <strong>Button Types:</strong> Primary, Secondary, Success, Danger, Warning, Info, Light, Dark, Link
            </div>
            <div>
              <strong>Button Sizes:</strong> Small (sm), Medium (md), Large (lg)
            </div>
            <div>
              <strong>Outline Style:</strong> Creates outlined buttons instead of filled ones
            </div>
            <div>
              <strong>Disabled:</strong> Makes the button non-interactive
            </div>
            <div>
              <strong>Full Width:</strong> Makes the button span the full width of its container
            </div>
            <div>
              <strong>Active State:</strong> Shows the button as currently pressed/active
            </div>
            <div>
              <strong>Custom Classes:</strong> Add your own CSS classes for additional styling
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

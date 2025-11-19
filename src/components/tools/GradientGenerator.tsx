import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";
import {
  buildGradientCss,
  clampAngle,
  GradientType,
  normalizeHexColor,
  RadialPosition,
  RadialShape,
} from "@/lib/gradient";

import { LinearAngleSelector } from "@/components/ui/LinearAngleSelector";

export const GradientGenerator = () => {
  const [type, setType] = useState<GradientType>("linear");

  const [color1, setColor1] = useState("#3b82f6");
  const [color2, setColor2] = useState("#8b5cf6");
  const [color3, setColor3] = useState("");

  const [angle, setAngle] = useState<number>(90);

  const [radialShape, setRadialShape] = useState<RadialShape>("circle");
  const [radialPosition, setRadialPosition] =
    useState<RadialPosition>("center");

  const colorConfigs = [
    { label: "Color 1", value: color1, setValue: setColor1, fallback: "#3b82f6" },
    { label: "Color 2", value: color2, setValue: setColor2, fallback: "#8b5cf6" },
    { label: "Color 3 (optional)", value: color3, setValue: setColor3, fallback: "#000000" },
  ] as const;

  // Build the CSS gradient string
  const cssCode = useMemo(() => {
    const c1 = normalizeHexColor(color1) || "#3b82f6";
    const c2 = normalizeHexColor(color2) || "#8b5cf6";
    const c3 = normalizeHexColor(color3) || "";
    const colors = [c1, c2, c3].filter(Boolean);

    if (type === "linear") {
      return buildGradientCss({
        type: "linear",
        angle,
        colors,
      });
    }

    return buildGradientCss({
      type: "radial",
      shape: radialShape,
      position: radialPosition,
      colors,
    });
  }, [type, color1, color2, color3, angle, radialShape, radialPosition]);

  const copyToClipboard = async () => {
    if (!cssCode.trim()) {
      notify.error("Nothing to copy yet.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(cssCode);
        notify.success("CSS copied!");
      } else {
        const ta = document.createElement("textarea");
        ta.value = cssCode;
        ta.style.position = "fixed";
        ta.style.left = "-999999px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        notify[ok ? "success" : "error"](ok ? "CSS copied!" : "Copy failed");
      }
    } catch (err) {
      console.error("Copy failed:", err);
      notify.error("Failed to copy to clipboard");
    }
  };

  // Live preview box
  const previewStyle = useMemo(() => {
    const c1 = normalizeHexColor(color1) || "#3b82f6";
    const c2 = normalizeHexColor(color2) || "#8b5cf6";
    const c3 = normalizeHexColor(color3) || "";
    const colors = [c1, c2, c3].filter(Boolean);

    if (colors.length < 2) return { background: "#e5e7eb" };

    if (type === "linear") {
      const a = clampAngle(angle);
      return {
        background: `linear-gradient(${a}deg, ${colors.join(", ")})`,
      };
    }

    const radialConfig = `${radialShape} at ${radialPosition}`;
    return {
      background: `radial-gradient(${radialConfig}, ${colors.join(", ")})`,
    };
  }, [type, color1, color2, color3, angle, radialShape, radialPosition]);

  return (
    <div className="space-y-6">
      {/* Config Card */}
      <Card>
        <CardHeader>
          <CardTitle>Gradient Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type toggle */}
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="inline-flex rounded-lg border bg-muted p-0.5">
                <button
                  type="button"
                  onClick={() => setType("linear")}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    type === "linear"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Linear
                </button>
                <button
                  type="button"
                  onClick={() => setType("radial")}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    type === "radial"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Radial
                </button>
              </div>
            </div>

            {/* Angle / Radial Controls */}
            {type === "linear" && (
              <div className="space-y-1 flex flex-col items-center">
                <Label>Angle</Label>
                <LinearAngleSelector value={angle} onChange={setAngle} />
              </div>
            )}
            {type === "radial" && (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="space-y-1">
                  <Label>Shape</Label>
                  <select
                    value={radialShape}
                    onChange={(e) => setRadialShape(e.target.value as RadialShape)}
                    className="border rounded-md px-2 py-1 text-sm bg-background"
                  >
                    <option value="circle">Circle</option>
                    <option value="ellipse">Ellipse</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label>Position</Label>
                  <select
                    value={radialPosition}
                    onChange={(e) =>
                      setRadialPosition(e.target.value as RadialPosition)
                    }
                    className="border rounded-md px-2 py-1 text-sm bg-background"
                  >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="top left">Top Left</option>
                    <option value="top right">Top Right</option>
                    <option value="bottom left">Bottom Left</option>
                    <option value="bottom right">Bottom Right</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* COLORS */}
          <div className="grid md:grid-cols-3 gap-4">
            {colorConfigs.map(({ label, value, setValue, fallback }) => {
              const normalized = normalizeHexColor(value) || fallback;
              return (
                <div key={label}>
                  <Label>{label}</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={normalized}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => setValue(normalizeHexColor(e.target.value))}
                      maxLength={7}
                      placeholder={fallback}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* PREVIEW */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={previewStyle} className="w-full h-48 rounded-lg" />
        </CardContent>
      </Card>

      {/* CSS OUTPUT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            CSS Code
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              Copy
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
            {cssCode || "/* Configure a gradient to generate CSS */"}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

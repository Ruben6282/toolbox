"use client";

import { useState, useMemo, useCallback } from "react";
import figlet from "figlet";

// ✅ Import browser-safe fonts
import Standard from "figlet/importable-fonts/Standard.js";
import Slant from "figlet/importable-fonts/Slant.js";
import Big from "figlet/importable-fonts/Big.js";
import Block from "figlet/importable-fonts/Block.js";
import Doom from "figlet/importable-fonts/Doom.js";
import Ghost from "figlet/importable-fonts/Ghost.js";
import Banner from "figlet/importable-fonts/Banner.js";
import Lean from "figlet/importable-fonts/Lean.js";
import Mini from "figlet/importable-fonts/Mini.js";
import Script from "figlet/importable-fonts/Script.js";
import Roman from "figlet/importable-fonts/Roman.js";
import Larry3D from "figlet/importable-fonts/Larry 3D.js";
import StarWars from "figlet/importable-fonts/Star Wars.js";
import ShadedBlocky from "figlet/importable-fonts/Shaded Blocky.js";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Download, RotateCcw, Shuffle, Image } from "lucide-react";
import { toast } from "sonner";

// ✅ Register fonts once
const REGISTERED_FONTS = {
  Standard,
  Slant,
  Big,
  Block,
  Doom,
  Ghost,
  Banner,
  Lean,
  Mini,
  Script,
  Roman,
  "Larry 3D": Larry3D,
  "Star Wars": StarWars,
  ShadedBlocky,
};

Object.entries(REGISTERED_FONTS).forEach(([name, def]) => {
  figlet.parseFont(name, def);
});

const FONT_NAMES = Object.keys(REGISTERED_FONTS);

export const AsciiArtGenerator = () => {
  const [inputText, setInputText] = useState("");
  const [font, setFont] = useState("Standard");

  const asciiArt = useMemo(() => {
    if (!inputText.trim()) return "";
    try {
      return figlet.textSync(inputText, { font });
    } catch {
      return "";
    }
  }, [inputText, font]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(asciiArt);
      toast?.success("Copied to clipboard!");
    } catch {
      toast?.error("Failed to copy");
    }
  }, [asciiArt]);

  const downloadAsciiArt = useCallback(() => {
    const blob = new Blob([asciiArt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ascii-art.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast?.success("Downloaded as ascii-art.txt");
  }, [asciiArt]);

  const saveAsImage = useCallback(() => {
    if (!asciiArt.trim()) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const fontSize = 16;
    const lineHeight = fontSize * 1.2;
    const lines = asciiArt.split("\n");

    // Temporarily set font for measuring text
    context.font = `${fontSize}px monospace`;
    canvas.width = Math.max(...lines.map((line) => context.measureText(line).width)) || 500;
    canvas.height = lines.length * lineHeight;

    // Draw background
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ASCII art text
    context.fillStyle = "#000";
    context.font = `${fontSize}px monospace`;
    context.textBaseline = "top";
    lines.forEach((line, i) => context.fillText(line, 0, i * lineHeight));

    // Download image
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "ascii-art.png";
    a.click();
  }, [asciiArt]);

  const clearAll = useCallback(() => setInputText(""), []);
  const randomFont = useCallback(() => {
    const others = FONT_NAMES.filter((f) => f !== font);
    const random = others[Math.floor(Math.random() * others.length)];
    setFont(random);
    toast?.message(`Switched to font: ${random}`);
  }, [font]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ASCII Art Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-input">Enter Text</Label>
            <Textarea
              id="text-input"
              placeholder="Type text to instantly generate ASCII art..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-select">Font Style ({FONT_NAMES.length})</Label>
            <Select value={font} onValueChange={setFont}>
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-auto">
                {FONT_NAMES.map((fontName) => (
                  <SelectItem key={fontName} value={fontName}>
                    {fontName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={clearAll}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button variant="outline" onClick={randomFont}>
              <Shuffle className="h-4 w-4 mr-2" />
              Random Font
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg overflow-auto min-h-[150px]">
            {inputText.trim() ? (
              <pre className="whitespace-pre font-mono text-sm leading-tight">{asciiArt}</pre>
            ) : (
              <div className="text-muted-foreground italic">
                Start typing to see ASCII art preview...
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={copyToClipboard} variant="outline" disabled={!asciiArt.trim()}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button onClick={downloadAsciiArt} variant="outline" disabled={!asciiArt.trim()}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={saveAsImage} variant="outline" disabled={!asciiArt.trim()}>
              <Image className="h-4 w-4 mr-2" />
              Save as Image
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, RotateCcw } from "lucide-react";

const ASCII_FONTS = [
  { name: "Standard", value: "standard" },
  { name: "Block", value: "block" },
  { name: "Bubble", value: "bubble" },
  { name: "Lean", value: "lean" },
  { name: "Mini", value: "mini" },
  { name: "Script", value: "script" },
  { name: "Slant", value: "slant" },
  { name: "3D", value: "3d" },
];

const ASCII_ART_SAMPLES = {
  standard: {
    A: `    A    
   A A   
  AAAAA  
 A     A 
A       A`,
    B: `BBBBB  
B     B 
BBBBB   
B     B 
BBBBB   `,
    C: `  CCC   
 C   C  
C       
C       
 C   C  
  CCC   `
  },
  block: {
    A: ` ▄▄▄▄▄ 
█   █ 
█   █ 
█████ 
█   █ 
█   █ `,
    B: `████▄  
█   ██ 
████▄  
█   ██ 
████▀  `,
    C: ` ▄████ 
█     █ 
█       
█       
█     █ 
 ▀████ `
  },
  bubble: {
    A: `  ○○○  
 ○   ○ 
○○○○○ 
○   ○ 
○   ○ `,
    B: `○○○○○  
○   ○  
○○○○○  
○   ○  
○○○○○  `,
    C: `  ○○○  
 ○   ○ 
○       
○       
 ○   ○  
  ○○○   `
  }
};

export const AsciiArtGenerator = () => {
  const [inputText, setInputText] = useState("");
  const [asciiArt, setAsciiArt] = useState("");
  const [font, setFont] = useState("standard");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAsciiArt = () => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate processing time
    setTimeout(() => {
      let result = "";
      const text = inputText.toUpperCase();
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') {
          result += "\n\n\n\n\n\n\n"; // Add space between characters
        } else if (ASCII_ART_SAMPLES[font as keyof typeof ASCII_ART_SAMPLES]?.[char as keyof typeof ASCII_ART_SAMPLES.standard]) {
          result += ASCII_ART_SAMPLES[font as keyof typeof ASCII_ART_SAMPLES][char as keyof typeof ASCII_ART_SAMPLES.standard] + "\n";
        } else {
          // Fallback for unsupported characters
          result += `  ${char}  \n  ${char}  \n  ${char}  \n  ${char}  \n  ${char}  \n`;
        }
      }
      
      setAsciiArt(result);
      setIsGenerating(false);
    }, 500);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(asciiArt);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadAsciiArt = () => {
    const blob = new Blob([asciiArt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ascii-art.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setInputText("");
    setAsciiArt("");
  };

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
              placeholder="Enter text to convert to ASCII art..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="font-select">Font Style</Label>
            <Select value={font} onValueChange={setFont}>
              <SelectTrigger>
                <SelectValue placeholder="Select font style" />
              </SelectTrigger>
              <SelectContent>
                {ASCII_FONTS.map((fontOption) => (
                  <SelectItem key={fontOption.value} value={fontOption.value}>
                    {fontOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateAsciiArt} disabled={!inputText.trim() || isGenerating}>
              {isGenerating ? "Generating..." : "Generate ASCII Art"}
            </Button>
            <Button variant="outline" onClick={clearAll}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {asciiArt && (
        <Card>
          <CardHeader>
            <CardTitle>Generated ASCII Art</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm">{asciiArt}</pre>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button onClick={downloadAsciiArt} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download as TXT
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, RotateCcw, Shield, Code, Eye, EyeOff } from "lucide-react";
import { notify } from "@/lib/notify";

export const JavaScriptObfuscator = () => {
  const [originalCode, setOriginalCode] = useState("");
  const [obfuscatedCode, setObfuscatedCode] = useState("");
  const [options, setOptions] = useState({
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: false,
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayCallsTransform: false,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.75,
    transformObjectKeys: false,
    unicodeEscapeSequence: false
  });

  const [obfuscationLevel, setObfuscationLevel] = useState(50);

  const updateOption = (key: string, value: unknown) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const obfuscateCode = () => {
    if (!originalCode.trim()) {
  notify.error("Please enter JavaScript code to obfuscate!");
      return;
    }

    try {
      // Simple obfuscation implementation
      let obfuscated = originalCode;

      // Apply obfuscation based on options
      if (options.compact) {
        obfuscated = obfuscated.replace(/\s+/g, ' ').trim();
      }

      if (options.stringArray) {
        // Extract strings and replace with array references
        const strings = obfuscated.match(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g) || [];
        const stringArray = strings.map((str, index) => `_0x${index.toString(16)}`);
        
        strings.forEach((str, index) => {
          obfuscated = obfuscated.replace(str, `_0x${index.toString(16)}`);
        });

        // Add string array at the beginning
        const arrayDeclaration = `var _0x${Array.from({length: strings.length}, (_, i) => i.toString(16)).join('=')}=[${strings.join(',')}];`;
        obfuscated = arrayDeclaration + obfuscated;
      }

      if (options.renameGlobals) {
        // Simple variable renaming (basic implementation)
        const variables = obfuscated.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
        const uniqueVars = [...new Set(variables)].filter(v => 
          !['var', 'let', 'const', 'function', 'if', 'else', 'for', 'while', 'return', 'true', 'false', 'null', 'undefined'].includes(v)
        );
        
        uniqueVars.forEach((variable, index) => {
          const newName = `_0x${index.toString(16)}`;
          obfuscated = obfuscated.replace(new RegExp(`\\b${variable}\\b`, 'g'), newName);
        });
      }

      if (options.unicodeEscapeSequence) {
        // Convert strings to unicode escape sequences
        obfuscated = obfuscated.replace(/"([^"\\]|\\.)*"/g, (match) => {
          return match.replace(/./g, (char) => {
            if (char === '"') return char;
            return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
          });
        });
      }

      if (options.numbersToExpressions) {
        // Convert numbers to expressions
        obfuscated = obfuscated.replace(/\b\d+\b/g, (num) => {
          const n = parseInt(num);
          if (n === 0) return '0';
          if (n === 1) return '1';
          return `(${Math.floor(Math.random() * n)}+${n - Math.floor(Math.random() * n)})`;
        });
      }

      if (options.selfDefending) {
        // Add self-defending code
        obfuscated = `(function(){var _0x${Math.random().toString(36).substring(7)}=function(){return true;};if(!_0x${Math.random().toString(36).substring(7)}()){throw new Error('Debugger detected');}${obfuscated}})();`;
      }

      if (options.disableConsoleOutput) {
        // Disable console methods
        obfuscated = `(function(){var _0x${Math.random().toString(36).substring(7)}=console;console.log=function(){};console.warn=function(){};console.error=function(){};${obfuscated}})();`;
      }

      setObfuscatedCode(obfuscated);
  notify.success("Code obfuscated successfully!");
    } catch (error) {
  notify.error("Failed to obfuscate code. Please check your JavaScript syntax.");
    }
  };

  const copyObfuscatedCode = async () => {
    try {
      await navigator.clipboard.writeText(obfuscatedCode);
  notify.success("Obfuscated code copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadObfuscatedCode = () => {
    const blob = new Blob([obfuscatedCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'obfuscated-code.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  notify.success("Obfuscated code downloaded!");
  };

  const clearAll = () => {
    setOriginalCode("");
    setObfuscatedCode("");
  };

  const applyPreset = (preset: 'light' | 'medium' | 'heavy') => {
    const presets = {
      light: {
        compact: true,
        stringArray: true,
        stringArrayThreshold: 0.5,
        simplify: true
      },
      medium: {
        compact: true,
        stringArray: true,
        stringArrayThreshold: 0.75,
        stringArrayEncoding: ['base64'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        simplify: true,
        numbersToExpressions: true
      },
      heavy: {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        debugProtection: true,
        debugProtectionInterval: 4000,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        numbersToExpressions: true,
        renameGlobals: true,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ['base64'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 4,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 1,
        transformObjectKeys: true,
        unicodeEscapeSequence: true
      }
    };

    setOptions(prev => ({ ...prev, ...presets[preset] }));
  notify.success(`${preset.charAt(0).toUpperCase() + preset.slice(1)} preset applied!`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>JavaScript Obfuscator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="original-code">Original JavaScript Code</Label>
            <Textarea
              id="original-code"
              placeholder="Enter your JavaScript code here..."
              value={originalCode}
              onChange={(e) => setOriginalCode(e.target.value)}
              rows={8}
            />
          </div>

          <div className="space-y-2">
            <Label>Obfuscation Level: {obfuscationLevel}%</Label>
            <Slider
              value={[obfuscationLevel]}
              onValueChange={(value) => setObfuscationLevel(value[0])}
              min={0}
              max={100}
              step={10}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={obfuscateCode} className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Obfuscate Code
            </Button>
            <Button onClick={clearAll} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Obfuscation Options</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="presets">Presets</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compact"
                      checked={options.compact}
                      onCheckedChange={(checked) => updateOption('compact', checked)}
                    />
                    <Label htmlFor="compact">Compact Code</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stringArray"
                      checked={options.stringArray}
                      onCheckedChange={(checked) => updateOption('stringArray', checked)}
                    />
                    <Label htmlFor="stringArray">String Array</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="simplify"
                      checked={options.simplify}
                      onCheckedChange={(checked) => updateOption('simplify', checked)}
                    />
                    <Label htmlFor="simplify">Simplify Code</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="renameGlobals"
                      checked={options.renameGlobals}
                      onCheckedChange={(checked) => updateOption('renameGlobals', checked)}
                    />
                    <Label htmlFor="renameGlobals">Rename Variables</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="numbersToExpressions"
                      checked={options.numbersToExpressions}
                      onCheckedChange={(checked) => updateOption('numbersToExpressions', checked)}
                    />
                    <Label htmlFor="numbersToExpressions">Numbers to Expressions</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unicodeEscapeSequence"
                      checked={options.unicodeEscapeSequence}
                      onCheckedChange={(checked) => updateOption('unicodeEscapeSequence', checked)}
                    />
                    <Label htmlFor="unicodeEscapeSequence">Unicode Escape</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selfDefending"
                      checked={options.selfDefending}
                      onCheckedChange={(checked) => updateOption('selfDefending', checked)}
                    />
                    <Label htmlFor="selfDefending">Self Defending</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="disableConsoleOutput"
                      checked={options.disableConsoleOutput}
                      onCheckedChange={(checked) => updateOption('disableConsoleOutput', checked)}
                    />
                    <Label htmlFor="disableConsoleOutput">Disable Console</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="controlFlowFlattening"
                      checked={options.controlFlowFlattening}
                      onCheckedChange={(checked) => updateOption('controlFlowFlattening', checked)}
                    />
                    <Label htmlFor="controlFlowFlattening">Control Flow Flattening</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="deadCodeInjection"
                      checked={options.deadCodeInjection}
                      onCheckedChange={(checked) => updateOption('deadCodeInjection', checked)}
                    />
                    <Label htmlFor="deadCodeInjection">Dead Code Injection</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="debugProtection"
                      checked={options.debugProtection}
                      onCheckedChange={(checked) => updateOption('debugProtection', checked)}
                    />
                    <Label htmlFor="debugProtection">Debug Protection</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="splitStrings"
                      checked={options.splitStrings}
                      onCheckedChange={(checked) => updateOption('splitStrings', checked)}
                    />
                    <Label htmlFor="splitStrings">Split Strings</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stringArrayCallsTransform"
                      checked={options.stringArrayCallsTransform}
                      onCheckedChange={(checked) => updateOption('stringArrayCallsTransform', checked)}
                    />
                    <Label htmlFor="stringArrayCallsTransform">String Array Calls Transform</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stringArrayIndexShift"
                      checked={options.stringArrayIndexShift}
                      onCheckedChange={(checked) => updateOption('stringArrayIndexShift', checked)}
                    />
                    <Label htmlFor="stringArrayIndexShift">String Array Index Shift</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stringArrayRotate"
                      checked={options.stringArrayRotate}
                      onCheckedChange={(checked) => updateOption('stringArrayRotate', checked)}
                    />
                    <Label htmlFor="stringArrayRotate">String Array Rotate</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stringArrayShuffle"
                      checked={options.stringArrayShuffle}
                      onCheckedChange={(checked) => updateOption('stringArrayShuffle', checked)}
                    />
                    <Label htmlFor="stringArrayShuffle">String Array Shuffle</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="presets" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => applyPreset('light')} variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Eye className="h-6 w-6 mb-2" />
                  <span>Light</span>
                  <span className="text-xs text-muted-foreground">Basic protection</span>
                </Button>
                <Button onClick={() => applyPreset('medium')} variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Shield className="h-6 w-6 mb-2" />
                  <span>Medium</span>
                  <span className="text-xs text-muted-foreground">Balanced protection</span>
                </Button>
                <Button onClick={() => applyPreset('heavy')} variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <EyeOff className="h-6 w-6 mb-2" />
                  <span>Heavy</span>
                  <span className="text-xs text-muted-foreground">Maximum protection</span>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {obfuscatedCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Obfuscated Code
              <div className="flex gap-2">
                <Button onClick={copyObfuscatedCode} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={downloadObfuscatedCode} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
                {obfuscatedCode}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>JavaScript Obfuscation Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Always test obfuscated code to ensure it still works correctly</li>
            <li>• Keep a backup of your original code before obfuscation</li>
            <li>• Heavy obfuscation may impact performance - use with caution</li>
            <li>• Some obfuscation techniques may break certain JavaScript features</li>
            <li>• Consider using minification for production instead of heavy obfuscation</li>
            <li>• Obfuscation is not a substitute for proper security practices</li>
            <li>• Be aware that determined attackers can still reverse engineer obfuscated code</li>
            <li>• Use obfuscation as part of a broader code protection strategy</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

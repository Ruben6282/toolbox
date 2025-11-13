import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Copy, RotateCcw, Download } from "lucide-react";
import { notify } from "@/lib/notify";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH, sanitizeText } from "@/lib/security";

// Minimal typings for Web Speech API to avoid relying on lib.dom SpeechRecognition types
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface RecognitionAlternativeLike {
  transcript: string;
}

interface RecognitionResultLike {
  isFinal: boolean;
  [index: number]: RecognitionAlternativeLike;
}

interface RecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type WebkitWindow = Window & {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  SpeechRecognition?: SpeechRecognitionConstructor;
};

type LanguageCode = "en-US" | "en-GB" | "es-ES" | "es-MX" | "fr-FR" | "de-DE" | "it-IT" | "pt-BR" | "ru-RU" | "ja-JP" | "ko-KR" | "zh-CN";
const ALLOWED_LANGUAGES: LanguageCode[] = ["en-US", "en-GB", "es-ES", "es-MX", "fr-FR", "de-DE", "it-IT", "pt-BR", "ru-RU", "ja-JP", "ko-KR", "zh-CN"];
const coerceLanguage = (val: string): LanguageCode => (ALLOWED_LANGUAGES.includes(val as LanguageCode) ? (val as LanguageCode) : "en-US");

export const SpeechToText = () => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("en-US");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const languages = [
    { code: "en-US", name: "English (US)" },
    { code: "en-GB", name: "English (UK)" },
    { code: "es-ES", name: "Spanish (Spain)" },
    { code: "es-MX", name: "Spanish (Mexico)" },
    { code: "fr-FR", name: "French" },
    { code: "de-DE", name: "German" },
    { code: "it-IT", name: "Italian" },
    { code: "pt-BR", name: "Portuguese (Brazil)" },
    { code: "ru-RU", name: "Russian" },
    { code: "ja-JP", name: "Japanese" },
    { code: "ko-KR", name: "Korean" },
    { code: "zh-CN", name: "Chinese (Simplified)" },
  ];

  useEffect(() => {
    // Check if speech recognition is supported
    const W = window as WebkitWindow;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (SR) {
      setIsSupported(true);
      const recognition = new SR();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: RecognitionEventLike) => {
        let finalTranscript = "";
        let interimTxt = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const alt = result[0];
          const piece = alt?.transcript ?? "";
          if (result.isFinal) {
            finalTranscript += piece;
          } else {
            interimTxt += piece;
          }
        }

        if (finalTranscript) {
          const sanitized = sanitizeText(finalTranscript);
          setTranscript(prev => {
            const newText = prev + sanitized + " ";
            if (!validateTextLength(newText)) {
              notify.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
              return truncateText(newText);
            }
            return newText;
          });
        }
        setInterimTranscript(sanitizeText(interimTxt));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }
  }, [language]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      notify.success("Listening started!");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      notify.success("Listening stopped!");
    }
  };

  const copyToClipboard = async () => {
    try {
      // Modern approach - works on most browsers including mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(transcript);
        notify.success("Transcript copied to clipboard!");
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement("textarea");
        textArea.value = transcript;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            notify.success("Transcript copied to clipboard!");
          } else {
            notify.error("Failed to copy!");
          }
        } catch (err) {
          console.error('Fallback: Failed to copy', err);
          notify.error("Failed to copy to clipboard!");
        }
        
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      notify.error("Failed to copy to clipboard!");
    }
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("Transcript downloaded!");
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
    notify.success("Transcript cleared!");
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Speech to Text</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MicOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Speech Recognition Not Supported</p>
            <p className="text-muted-foreground">
              Your browser doesn't support speech recognition. Please use a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Speech to Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language-select">Language</Label>
            <Select value={language} onValueChange={(val) => setLanguage(coerceLanguage(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={startListening} 
              disabled={isListening}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Mic className="h-4 w-4" />
              Start Listening
            </Button>
            
            <Button 
              onClick={stopListening} 
              disabled={!isListening}
              variant="outline"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <MicOff className="h-4 w-4" />
              Stop Listening
            </Button>
          </div>

          {isListening && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Listening...</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Speak clearly into your microphone. The text will appear below.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transcript">Recognized Text</Label>
            <Textarea
              id="transcript"
              value={transcript + interimTranscript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={6}
              placeholder="Your speech will be converted to text here..."
            />
          </div>

          {interimTranscript && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Interim result:</p>
              <p className="text-sm italic">{interimTranscript}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={copyToClipboard} variant="outline" disabled={!transcript} className="w-full sm:w-auto">
              <Copy className="h-4 w-4 mr-2" />
              Copy Text
            </Button>
            
            <Button onClick={downloadTranscript} variant="outline" disabled={!transcript} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            <Button onClick={clearTranscript} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Speak clearly and at a moderate pace</li>
            <li>• Use a good quality microphone for better results</li>
            <li>• Avoid background noise when possible</li>
            <li>• The recognition works best with common words and phrases</li>
            <li>• You can edit the transcript manually after recognition</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

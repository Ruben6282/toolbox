import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Square, Volume2, RotateCcw } from "lucide-react";

export const TextToSpeech = () => {
  const [text, setText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voice, setVoice] = useState("default");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices
  const loadVoices = () => {
    const voices = speechSynthesis.getVoices();
    setAvailableVoices(voices);
  };

  useEffect(() => {
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const speak = () => {
    if (!text.trim()) return;

    stop(); // Ensure no overlapping speech

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    if (voice !== "default" && availableVoices.length > 0) {
      const selectedVoice = availableVoices.find(v => v.name === voice);
      if (selectedVoice) utterance.voice = selectedVoice;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (isPlaying && !isPaused) {
      speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const clearText = () => {
    setText("");
    stop();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Text to Speech</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-input">Enter Text</Label>
            <Textarea
              id="text-input"
              placeholder="Enter text to convert to speech..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="voice-select">Voice</Label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Voice</SelectItem>
                  {availableVoices.map((v, i) => (
                    <SelectItem key={i} value={v.name}>
                      {v.name} ({v.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Speech Rate: {rate.toFixed(1)}x</Label>
              <Slider
                value={[rate]}
                onValueChange={(v) => setRate(v[0])}
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Pitch: {pitch.toFixed(1)}</Label>
              <Slider
                value={[pitch]}
                onValueChange={(v) => setPitch(v[0])}
                min={0.1}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Volume: {Math.round(volume * 100)}%</Label>
              <Slider
                value={[volume]}
                onValueChange={(v) => setVolume(v[0])}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={speak} disabled={!text.trim() || isPlaying} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              {isPlaying ? "Speaking..." : "Speak"}
            </Button>
            <Button onClick={pause} disabled={!isPlaying && !isPaused} variant="outline" className="flex items-center gap-2">
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button onClick={stop} disabled={!isPlaying && !isPaused} variant="outline" className="flex items-center gap-2">
              <Square className="h-4 w-4" /> Stop
            </Button>
            <Button onClick={clearText} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Clear
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
            <li>• Use punctuation marks for natural pauses</li>
            <li>• Adjust the speech rate for better comprehension</li>
            <li>• Different voices may have different accents and languages</li>
            <li>• You can pause and resume speech at any time</li>
            <li>• The volume control affects the browser's speech synthesis volume</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState, useRef, useEffect, useMemo } from "react";
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
  const [voiceUri, setVoiceUri] = useState<string>("default");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  // Language selector: 'auto' (device), 'all', or specific language code prefix like 'en' or 'en-us'
  const [selectedLang, setSelectedLang] = useState<string>("auto");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const deviceLang = useMemo(() => (navigator.language || "en").toLowerCase().split("-")[0], []);

  // Load voices with retries (mobile browsers sometimes populate asynchronously)
  const loadVoices = () => {
    const voices = speechSynthesis.getVoices();
    // Deduplicate voices (mobile browsers can return duplicates)
    const seen = new Map<string, SpeechSynthesisVoice>();
    for (const v of voices) {
      const key = (v.voiceURI && v.voiceURI.trim()) || `${v.name}::${v.lang}`;
      if (!seen.has(key)) {
        seen.set(key, v);
      } else {
        // Prefer the entry marked as default/localService if duplicate appears
        const existing = seen.get(key)!;
        const preferNew = Boolean((v as SpeechSynthesisVoice & { default?: boolean; localService?: boolean }).default || (v as SpeechSynthesisVoice & { default?: boolean; localService?: boolean }).localService);
        const preferExisting = Boolean((existing as SpeechSynthesisVoice & { default?: boolean; localService?: boolean }).default || (existing as SpeechSynthesisVoice & { default?: boolean; localService?: boolean }).localService);
        if (preferNew && !preferExisting) {
          seen.set(key, v);
        }
      }
    }
    setAvailableVoices(Array.from(seen.values()));
  };

  useEffect(() => {
    // Initial load and retries if empty
    loadVoices();
    let tries = 0;
    const retry = setInterval(() => {
      tries += 1;
      if (availableVoices.length === 0) {
        loadVoices();
      }
      if (tries > 10 || availableVoices.length > 0) {
        clearInterval(retry);
      }
    }, 300);

    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      clearInterval(retry);
      // Stop any ongoing speech on unmount
      speechSynthesis.cancel();
    };
  }, [availableVoices.length]);

  // Persist voice selection, language, and audio settings
  useEffect(() => {
    const savedVoice = localStorage.getItem("tts.voiceUri");
    const savedLang = localStorage.getItem("tts.lang");
    const savedRate = localStorage.getItem("tts.rate");
    const savedPitch = localStorage.getItem("tts.pitch");
    const savedVolume = localStorage.getItem("tts.volume");
    if (savedVoice) setVoiceUri(savedVoice);
    if (savedLang) setSelectedLang(savedLang);
    if (savedRate) setRate(parseFloat(savedRate));
    if (savedPitch) setPitch(parseFloat(savedPitch));
    if (savedVolume) setVolume(parseFloat(savedVolume));
  }, []);
  useEffect(() => { localStorage.setItem("tts.voiceUri", voiceUri); }, [voiceUri]);
  useEffect(() => { localStorage.setItem("tts.lang", selectedLang); }, [selectedLang]);
  useEffect(() => { localStorage.setItem("tts.rate", String(rate)); }, [rate]);
  useEffect(() => { localStorage.setItem("tts.pitch", String(pitch)); }, [pitch]);
  useEffect(() => { localStorage.setItem("tts.volume", String(volume)); }, [volume]);

  const speak = () => {
    if (!text.trim()) return;

    stop(); // Ensure no overlapping speech

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    if (voiceUri !== "default" && availableVoices.length > 0) {
      const selectedVoice = availableVoices.find(v => v.voiceURI === voiceUri);
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

  // Derive unique language options from voices
  const languageOptions = useMemo(() => {
    // Build a compact list of base language codes from available voices
    const bases = new Set<string>();
    availableVoices.forEach(v => {
      const code = (v.lang || '').toLowerCase();
      if (!code) return;
      bases.add(code.split('-')[0]);
    });
    return Array.from(bases).sort().map(code => ({ code, label: code.toUpperCase() }));
  }, [availableVoices]);

  const filteredVoices = useMemo(() => {
    let list = availableVoices;
    const lowerSel = selectedLang.toLowerCase();
    if (lowerSel === 'auto') {
      list = list.filter(v => v.lang?.toLowerCase().startsWith(deviceLang));
    } else if (lowerSel === 'all') {
      // no-op
    } else {
      list = list.filter(v => v.lang?.toLowerCase().startsWith(lowerSel));
    }
    // Sort: preferred language first, then by lang, then by name
    return [...list].sort((a, b) => {
      const pref = lowerSel === 'auto' ? deviceLang : (lowerSel === 'all' ? '' : lowerSel);
      const aPref = pref && a.lang?.toLowerCase().startsWith(pref) ? 0 : 1;
      const bPref = pref && b.lang?.toLowerCase().startsWith(pref) ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;
      if (a.lang !== b.lang) return (a.lang || '').localeCompare(b.lang || '');
      return a.name.localeCompare(b.name);
    });
  }, [availableVoices, selectedLang, deviceLang]);

  // If current voice is not in the filtered list, reset to default so selection stays visible
  useEffect(() => {
    if (voiceUri !== 'default' && !filteredVoices.some(v => v.voiceURI === voiceUri)) {
      setVoiceUri('default');
    }
  }, [filteredVoices, voiceUri]);

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
              <Label htmlFor="lang-select">Language</Label>
              <Select value={selectedLang} onValueChange={setSelectedLang}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (device: {deviceLang.toUpperCase()})</SelectItem>
                  <SelectItem value="all">All languages</SelectItem>
                  {languageOptions.map(opt => (
                    <SelectItem key={opt.code} value={opt.code}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice-select">Voice</Label>
              <Select value={voiceUri} onValueChange={setVoiceUri}>
                <SelectTrigger>
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">System Default</SelectItem>
                  {filteredVoices.map((v) => (
                    <SelectItem key={v.voiceURI} value={v.voiceURI}>
                      {v.name} <span className="text-muted-foreground">({v.lang}{v.default ? ", default" : ""})</span>
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

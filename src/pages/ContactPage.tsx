import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ArrowLeft, Instagram, Lightbulb, Bug, Copy, Check } from "lucide-react";

const ContactPage = () => {
  const location = useLocation();
  const [copiedIdea, setCopiedIdea] = useState(false);
  const [copiedBug, setCopiedBug] = useState(false);

  const ideaTemplate = useMemo(() => `Subject: Tool Idea — <Short Title>

What problem it solves:
<1–3 sentences>

Key features:
- <feature 1>
- <feature 2>
- <feature 3>

Similar tools (optional):
- <link 1>
- <link 2>

Extra context (optional):
<screenshots/links/constraints>`, []);

  const bugTemplate = useMemo(() => `Subject: Bug Report — <Tool Name>

URL:
<https://toolcheetah.com/...>

What happened:
<clear description of the issue>

What you expected:
<what should have happened>

Steps to reproduce:
1) <step one>
2) <step two>
3) <step three>

Environment:
- Browser: <Chrome/Firefox/Safari + version>
- Device: <Desktop/Mobile + model>
- OS: <Windows/macOS/iOS/Android>

Attachments (optional):
<screenshots/screen recordings>`, []);

  const copyToClipboard = async (text: string, setFlag: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      setTimeout(() => setFlag(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
        setFlag(true);
        setTimeout(() => setFlag(false), 2000);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace(/^#/, "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

  <div className="container py-8 space-y-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        {/* Hero */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="ToolCheetah Logo" className="h-20 w-20 object-contain" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">Contact ToolCheetah</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            We’d love to hear from you! For feedback, feature requests, or questions, reach out via Instagram.
          </p>
        </div>

        {/* Contact Card */
        }
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              Get in Touch on Instagram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              The fastest way to reach us is via Instagram direct message. We aim to respond as quickly as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button asChild>
                <a href="https://www.instagram.com/toolcheetah" target="_blank" rel="noopener noreferrer">
                  Contact us
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Browse Tools</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit a Tool Idea */}
        <Card id="submit-tool" className="scroll-mt-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Submit a Tool Idea
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We love new ideas. While we can’t promise every suggestion will make it in, we review all submissions. 
              Building quality tools takes time (research, design, and testing), so timelines may vary.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">DM format (copy and fill in):</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(ideaTemplate, setCopiedIdea)}
                  className="shrink-0"
                  aria-label="Copy tool idea DM format"
                >
                  {copiedIdea ? (
                    <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" /> Copied</span>
                  ) : (
                    <span className="inline-flex items-center gap-2"><Copy className="h-4 w-4" /> Copy format</span>
                  )}
                </Button>
              </div>
              <div className="rounded-md bg-muted p-4 text-xs sm:text-sm font-mono whitespace-pre-wrap">
                {ideaTemplate}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report a Bug */}
        <Card id="report-bug" className="scroll-mt-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-500" />
              Report a Bug
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Spot something off? Send us a DM with the details below so we can reproduce and fix it quickly.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">DM format (copy and fill in):</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(bugTemplate, setCopiedBug)}
                  className="shrink-0"
                  aria-label="Copy bug report DM format"
                >
                  {copiedBug ? (
                    <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" /> Copied</span>
                  ) : (
                    <span className="inline-flex items-center gap-2"><Copy className="h-4 w-4" /> Copy format</span>
                  )}
                </Button>
              </div>
              <div className="rounded-md bg-muted p-4 text-xs sm:text-sm font-mono whitespace-pre-wrap">
                {bugTemplate}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactPage;

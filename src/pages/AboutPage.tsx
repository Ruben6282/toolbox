import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Zap, Shield, Heart, Globe, Code, Users } from "lucide-react";

const AboutPage = () => {
  // SEO Meta Tags
  useEffect(() => {
    const title = "About ToolCheetah - Free Online Tools & Utilities";
    const description = "Learn about ToolCheetah's mission to provide fast, free, and privacy-focused online tools. No registration required. All tools work directly in your browser.";
    
    document.title = title;
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', title);

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', description);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', 'https://toolcheetah.com/about');

    let ogType = document.querySelector('meta[property="og:type"]');
    if (!ogType) {
      ogType = document.createElement('meta');
      ogType.setAttribute('property', 'og:type');
      document.head.appendChild(ogType);
    }
    ogType.setAttribute('content', 'website');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://toolcheetah.com/about');
  }, []);

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

        {/* Hero Section */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="ToolCheetah Logo" className="h-20 w-20 object-contain" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">About ToolCheetah</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Your one-stop collection of free online tools and utilities, designed to make your digital life easier.
          </p>
        </div>

        {/* Mission Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              At ToolCheetah, we believe that everyone should have access to powerful, easy-to-use online tools without 
              barriers. Our mission is to provide a comprehensive collection of free utilities that help individuals and 
              businesses work more efficiently.
            </p>
            <p className="text-muted-foreground">
              Whether you're a developer, designer, marketer, student, or just someone who needs a quick conversion or 
              calculation, we've got you covered. All our tools are free to use, require no registration, and respect 
              your privacy.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Zap className="h-5 w-5 text-yellow-500" />
                Fast & Efficient
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All tools run directly in your browser for instant results. No waiting, no server delays - just fast, 
                efficient processing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="h-5 w-5 text-blue-500" />
                Privacy First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your data stays on your device. We don't store, collect, or transmit your information. What you process 
                remains completely private.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Globe className="h-5 w-5 text-green-500" />
                Always Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access our tools 24/7 from any device. No installation required - just open your browser and start working.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Code className="h-5 w-5 text-purple-500" />
                Developer Friendly
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built with modern web technologies, our tools are optimized for performance and compatibility across all 
                browsers and devices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-5 w-5 text-orange-500" />
                Community Driven
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We listen to our users and continuously add new tools and features based on community feedback and requests.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Heart className="h-5 w-5 text-pink-500" />
                100% Free
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No hidden fees, no premium tiers, no paywalls. All tools are completely free to use, forever.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What We Offer */}
        <Card>
          <CardHeader>
            <CardTitle>What We Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <h4 className="font-semibold text-sm">Text & Content Tools</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Fast helpers for writers and editors — analyze, transform, and generate content with ease.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Word & character counters, readability stats</li>
                  <li>• Case converters, slug generators, minifiers</li>
                  <li>• Generators: Lorem ipsum, titles, usernames</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Word Counter</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Case Converter</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Keyword Density</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm">Image Tools</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Quick, in-browser image editing and conversions without uploads.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Resize, crop, and convert between formats (JPG, PNG, WebP)</li>
                  <li>• Watermark, compress, and basic photo edits</li>
                  <li>• Extract colors and generate gradients</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Image Resizer</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Add Watermark</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Image Cropper</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm">Developer Tools</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Utilities for developers to inspect, transform, and optimize code and data.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• HTML/CSS/JS minifiers and formatters</li>
                  <li>• Encoders/decoders (Base64, HTML entities, JWT)</li>
                  <li>• JSON formatting and regex testing</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">HTML Minifier</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">JSON Formatter</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Regex Tester</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm">Calculators</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Practical calculators for finance, conversions, and everyday math.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Loan, mortgage, and ROI calculators</li>
                  <li>• Unit converters and currency tools</li>
                  <li>• Health & fitness calculators (BMI, calorie)</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Loan Calculator</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Unit Converter</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">BMI</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm">SEO Tools</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Tools to help you optimize pages, preview SERP snippets, and manage canonicalization.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Meta tag and Open Graph generators</li>
                  <li>• Canonical URL helpers and sitemap/XML tools</li>
                  <li>• Keyword analysis and SERP preview</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Meta Tag Generator</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Canonical URL</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Sitemap</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm">Media Tools</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Process audio and video assets directly in the browser — trim, convert, and extract media.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Audio trimming and format conversion</li>
                  <li>• Thumbnail extraction and image downloads</li>
                  <li>• Voice recording and basic editing</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Audio Cutter</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">MP3 → WAV</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">YouTube Thumbnails</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm">Number Tools</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Precise numeric utilities for conversions, checks, and format transformations.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Binary, hex, and decimal converters</li>
                  <li>• Prime checks, LCM/GCD, Roman numeral conversions</li>
                  <li>• Random number generation</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Binary Converter</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Prime Checker</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Random Number</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm">Random Generators</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Quickly generate random values for testing, naming, and decision making.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• UUIDs, passwords, and random names</li>
                  <li>• Dice rolls, coin flips, and yes/no pickers</li>
                  <li>• Business name and username ideas</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Password Generator</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">UUID</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Username Generator</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm">Social Media Tools</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Create and preview social posts with platform-specific guidance and previews.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Twitter character/preview tools</li>
                  <li>• Facebook post preview and hashtag analysis</li>
                  <li>• YouTube title & description helpers</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Twitter Counter</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Facebook Preview</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">YouTube Tools</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm">Date & Time Tools</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Tools to help with scheduling, time zone conversions, and date arithmetic.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Time zone converter and world clock</li>
                  <li>• Stopwatch, countdowns, and timestamp converters</li>
                  <li>• Age and date difference calculators</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Time Zone</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Stopwatch</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Countdown</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm">Security Tools</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Keep your data safe with tools for password generation, hashing, and URL safety checks.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Secure password & hash generators</li>
                  <li>• Email validation and URL safety checks</li>
                  <li>• Fake data generators for testing</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">Password Generator</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">MD5 Hash</span>
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs">URL Safety</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card>
          <CardHeader>
            <CardTitle>Built With Modern Technology</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              ToolCheetah is built using cutting-edge web technologies to ensure the best possible experience:
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium">React</span>
              <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium">TypeScript</span>
              <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium">Vite</span>
              <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium">Tailwind CSS</span>
              <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium">shadcn/ui</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Have a Tool Request?</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're always looking to add new tools to our collection. If you have a specific tool in mind that 
                you'd like to see on ToolCheetah, we'd love to hear from you!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button asChild>
                  <Link to="/">Browse Tools</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/contact#submit-tool">
                    Submit a Tool
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;

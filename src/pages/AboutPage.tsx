import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Text & Content Tools</h4>
                <p className="text-xs text-muted-foreground">
                  Word counters, case converters, text generators, and more utilities for working with text.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Image Tools</h4>
                <p className="text-xs text-muted-foreground">
                  Image converters, resizers, croppers, and editors for all your image processing needs.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Developer Tools</h4>
                <p className="text-xs text-muted-foreground">
                  Code formatters, minifiers, encoders, decoders, and other essential developer utilities.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Calculators</h4>
                <p className="text-xs text-muted-foreground">
                  Financial calculators, unit converters, math tools, and specialized calculators for various needs.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">SEO Tools</h4>
                <p className="text-xs text-muted-foreground">
                  Meta tag generators, URL analyzers, keyword tools, and other SEO optimization utilities.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Media Tools</h4>
                <p className="text-xs text-muted-foreground">
                  Audio and video tools for editing, converting, and processing multimedia files.
                </p>
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
    </div>
  );
};

export default AboutPage;

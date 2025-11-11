import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Shield, Eye, Lock, Server, Cookie, Mail } from "lucide-react";

const PrivacyPolicyPage = () => {
  // SEO Meta Tags
  useEffect(() => {
    const title = "Privacy Policy - ToolCheetah";
    const description = "ToolCheetah privacy policy. Learn how we protect your data, what information we collect, and how we use cookies. Your privacy is our priority.";
    
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
    ogUrl.setAttribute('content', 'https://toolcheetah.com/privacy-policy');

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
    canonical.setAttribute('href', 'https://toolcheetah.com/privacy-policy');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 space-y-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground">
            Last Updated: November 4, 2025
          </p>
          <p className="text-muted-foreground">
            At ToolCheetah, we take your privacy seriously. This Privacy Policy explains how we handle your 
            information when you use our website and tools.
          </p>
        </div>

        {/* TL;DR Section */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              TL;DR - The Short Version
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold">We don't collect, store, or transmit your personal data.</p>
            <p className="text-sm text-muted-foreground">
              All our tools run locally in your browser. Your files, text, images, and calculations never leave 
              your device. We don't have accounts, we don't track you, and we don't sell your data because we 
              simply don't have it.
            </p>
          </CardContent>
        </Card>

        {/* Information Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Personal Information</h4>
              <p className="text-sm text-muted-foreground">
                We do not collect any personal information such as names, email addresses, phone numbers, or any 
                other personally identifiable information. Our tools do not require registration or login.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Tool Usage Data</h4>
              <p className="text-sm text-muted-foreground">
                All tools operate entirely within your web browser using client-side JavaScript. Any files you 
                upload, text you input, or calculations you perform are processed locally on your device and are 
                never sent to our servers.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Analytics Data</h4>
              <p className="text-sm text-muted-foreground">
                We may use privacy-focused analytics services to understand how visitors use our website. This 
                may include information such as:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>Pages visited and time spent on pages</li>
                <li>Referring website or search engine</li>
                <li>Browser type and operating system</li>
                <li>General geographic location (country/city level only)</li>
                <li>Device type (desktop, mobile, tablet)</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                This data is collected in aggregate form only and cannot be used to identify individual users.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How Tools Work */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-500" />
              How Our Tools Protect Your Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Client-Side Processing</h4>
              <p className="text-sm text-muted-foreground">
                All data processing happens in your browser. When you use our image resizer, text converter, or 
                any other tool, the processing occurs entirely on your device. Your data never leaves your computer.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">No Server Storage</h4>
              <p className="text-sm text-muted-foreground">
                We do not store any files, images, text, or other content you process using our tools. Once you 
                close or refresh the page, all data is immediately cleared from memory.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">No Third-Party Data Sharing</h4>
              <p className="text-sm text-muted-foreground">
                Since we don't collect your data, we have nothing to share with third parties. Your work remains 
                private and secure on your own device.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-orange-500" />
              Cookies and Local Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              We may use cookies and browser local storage for the following purposes:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
              <li><strong>Theme Preference:</strong> To remember if you prefer light or dark mode</li>
              <li><strong>Tool Settings:</strong> To save your preferences within tools (like default units in converters)</li>
              <li><strong>Analytics:</strong> To help us understand site usage patterns</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              These cookies do not contain any personal information and are used solely to improve your experience 
              on our website. You can disable cookies in your browser settings, though some features may not work 
              as expected.
            </p>
          </CardContent>
        </Card>

        {/* Third-Party Services */}
        <Card>
          <CardHeader>
            <CardTitle>Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Our website may use the following third-party services:
            </p>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Analytics</h4>
              <p className="text-sm text-muted-foreground">
                We may use privacy-focused analytics services to understand how our website is used. These services 
                collect data in an anonymized, aggregate form that cannot be used to identify individual users.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">External APIs</h4>
              <p className="text-sm text-muted-foreground">
                Some tools may make requests to external APIs (such as currency conversion rates). When using 
                these tools, you understand that the specific data required for that tool will be sent to the 
                respective API service. We recommend reviewing the privacy policies of these services if you 
                have concerns.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle>Your Rights and Choices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Since we don't collect personal data, there's no personal data to access, modify, or delete. However, 
              you have complete control over:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
              <li>Clearing your browser's cookies and local storage at any time</li>
              <li>Using browser privacy modes or ad blockers</li>
              <li>Disabling JavaScript (though this will prevent tools from working)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our services are available to users of all ages. Since we don't collect personal information, we 
              don't knowingly collect information from children under 13. Parents and guardians can feel confident 
              that their children's privacy is protected when using our tools.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal 
              reasons. The "Last Updated" date at the top of this page indicates when the policy was last revised. 
              We encourage you to review this policy periodically.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-500" />
              Questions or Concerns?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              If you have any questions about this Privacy Policy or our practices, please feel free to reach out 
              to us through our social media channels.
            </p>
            <Button variant="outline" asChild>
              <a href="https://www.instagram.com/toolcheetah" target="_blank" rel="noopener noreferrer">
                Contact Us on Instagram
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Bottom CTA */}
        <div className="text-center pt-4">
          <Button asChild size="lg">
            <Link to="/">Start Using Our Tools</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;

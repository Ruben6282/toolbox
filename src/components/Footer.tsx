import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t bg-card py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="ToolCheetah Logo" className="h-6 w-6 object-contain" />
              <span className="font-bold">ToolCheetah</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your one-stop collection of free online tools and utilities.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/popular" className="text-muted-foreground hover:text-foreground transition-colors">
                  Popular Tools
                </Link>
              </li>
              <li>
                <Link to="/new" className="text-muted-foreground hover:text-foreground transition-colors">
                  New Tools
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-muted-foreground hover:text-foreground transition-colors">
                  Search
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact#submit-tool" className="text-muted-foreground hover:text-foreground transition-colors">
                  Submit Tool
                </Link>
              </li>
              <li>
                <Link to="/contact#report-bug" className="text-muted-foreground hover:text-foreground transition-colors">
                  Report a Bug
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ToolCheetah. All tools are free to use.
          </p>

          <div className="flex gap-4">
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://www.instagram.com/toolcheetah"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Icons.Instagram className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://www.linkedin.com/in/toolcheetah"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Icons.Linkedin className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://x.com/toolcheetah"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
              >
                <Icons.Twitter className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://buymeacoffee.com/toolcheetah"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Buy Me a Coffee"
              >
                <Icons.Coffee className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

import { Link } from "react-router-dom";
import { Wrench, Github, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-2">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ToolBox
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
            Home
          </Link>
          <Link to="#categories" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
            Categories
          </Link>
          <Link to="#popular" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
            Popular
          </Link>
          
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
            </a>
          </Button>
          
          <Button size="sm" className="gap-2">
            <Heart className="h-4 w-4" />
            Donate
          </Button>
        </nav>
      </div>
    </header>
  );
};

import { Link } from "react-router-dom";
import { Wrench, Heart, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SearchBar } from "@/components/SearchBar";

export const Header = () => {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-20 items-center gap-4 bg-tr">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="ToolCheetah Logo" className="h-10 w-10 object-contain" />
          <span className="text-xl font-bold text-black dark:text-white">
            ToolCheetah
          </span>
        </Link>


        {/* Desktop Search Bar - Right next to logo */}
        <div className="hidden lg:block flex-1 max-w-sm">
          <SearchBar />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 shrink-0 ml-auto">
          <Link to="/" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground whitespace-nowrap">
            Home
          </Link>
          <Link to="/categories" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground whitespace-nowrap">
            Categories
          </Link>
          <Link to="/popular" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground whitespace-nowrap">
            Popular
          </Link>
          <Link to="/new" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground whitespace-nowrap">
            New
          </Link>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          <Button asChild size="sm" className="gap-2">
            <a
              href="https://buymeacoffee.com/toolcheetah"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Heart className="h-4 w-4" />
              Donate
            </a>
          </Button>

        </nav>

        {/* Mobile/Tablet Actions */}
        <div className="flex lg:hidden items-center gap-2 ml-auto">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-4 mt-8">
                <div className="mb-4">
                  <SearchBar onToolSelect={() => setMobileMenuOpen(false)} />
                </div>
                
                <Link 
                  to="/" 
                  className="text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  to="/categories" 
                  className="text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link 
                  to="/popular" 
                  className="text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Popular
                </Link>
                <Link 
                  to="/new" 
                  className="text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  New
                </Link>
                
                <div className="border-t pt-4 mt-4">
                  <Button asChild className="w-full gap-2">
                    <a
                      href="https://buymeacoffee.com/toolcheetah"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Heart className="h-4 w-4" />
                      Donate
                    </a>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

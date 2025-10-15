import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { CategoryCard } from "@/components/CategoryCard";
import { ToolCard } from "@/components/ToolCard";
import { categories, tools, popularSearches } from "@/data/tools";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Github } from "lucide-react";
import * as Icons from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const popularTools = tools.filter((tool) => tool.isPopular);
  const newTools = tools.filter((tool) => tool.isNew);

  const handlePopularSearchClick = (search: string) => {
    navigate(`/search?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 sm:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-muted-foreground">Free online tools for everyone</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              All Your Essential
              <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-in slide-in-from-left duration-1000">
                Tools in One Place
              </span>
            </h1>
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              Discover a comprehensive collection of free, easy-to-use online tools.
              From calculators to converters, we've got everything you need.
            </p>
            <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <SearchBar />
            </div>

            {/* Popular Searches */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
              <span>Popular searches:</span>
              {popularSearches.map((search) => (
                <Badge 
                  key={search} 
                  variant="secondary" 
                  className="cursor-pointer transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                  onClick={() => handlePopularSearchClick(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="container py-20">
        <div className="mb-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Browse by Category</h2>
          <p className="text-lg text-muted-foreground">
            Find the perfect tool for your needs
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} {...category} />
          ))}
        </div>
      </section>

      {/* Popular Tools Section */}
      <section id="popular" className="bg-secondary/20 py-20">
        <div className="container">
          <div className="mb-12 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">Popular Tools</h2>
              <p className="text-muted-foreground">Most used tools by our community</p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {popularTools.map((tool) => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </div>
        </div>
      </section>

      {/* New Tools Section */}
      <section className="container py-20">
        <div className="mb-12 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Clock className="h-8 w-8 text-accent" />
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Recently Added</h2>
            <p className="text-muted-foreground">Check out our latest tools</p>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {newTools.map((tool) => (
            <ToolCard key={tool.id} {...tool} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-2">
                  <Icons.Wrench className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">ToolBox</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your one-stop collection of free online tools and utilities.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link></li>
                <li><Link to="/#categories" className="text-muted-foreground hover:text-foreground transition-colors">Categories</Link></li>
                <li><Link to="/#popular" className="text-muted-foreground hover:text-foreground transition-colors">Popular Tools</Link></li>
                <li><Link to="/search" className="text-muted-foreground hover:text-foreground transition-colors">Search</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Submit Tool</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 ToolBox. All tools are free to use.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <Github className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Icons.Twitter className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

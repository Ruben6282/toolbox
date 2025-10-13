import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { CategoryCard } from "@/components/CategoryCard";
import { ToolCard } from "@/components/ToolCard";
import { categories, tools, popularSearches } from "@/data/tools";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-background py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
              All Your <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Tools</span> in One Place
            </h1>
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
              A comprehensive collection of free online tools and utilities for developers, designers, and creators.
            </p>
            <SearchBar />

            {/* Popular Searches */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-muted-foreground">Popular:</span>
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
      <section id="categories" className="py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold">Browse by Category</h2>
            <p className="text-muted-foreground">Find the right tool for your needs</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tools Section */}
      <section id="popular" className="bg-secondary/30 py-16">
        <div className="container">
          <div className="mb-10 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-3xl font-bold">Popular Tools</h2>
              <p className="text-muted-foreground">Most used tools by our community</p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popularTools.map((tool) => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </div>
        </div>
      </section>

      {/* New Tools Section */}
      <section className="py-16">
        <div className="container">
          <div className="mb-10 flex items-center gap-3">
            <Clock className="h-8 w-8 text-accent" />
            <div>
              <h2 className="text-3xl font-bold">Recently Added</h2>
              <p className="text-muted-foreground">Check out our latest tools</p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {newTools.map((tool) => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2024 ToolBox. All tools are free to use.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">About</a>
              <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
              <a href="#" className="transition-colors hover:text-foreground">Terms</a>
              <a href="#" className="transition-colors hover:text-foreground">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

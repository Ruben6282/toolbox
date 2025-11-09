import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { CategoryCard } from "@/components/CategoryCard";
import { ToolCard } from "@/components/ToolCard";
import { categories, tools, popularSearches } from "@/data/tools";
import { Badge } from "@/components/ui/badge";
import * as Icons from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";

const Home = () => {
  const navigate = useNavigate();
  const popularTools = tools.filter((tool) => tool.isPopular);
  const newTools = tools.filter((tool) => tool.isNew);

  useEffect(() => {
    const title = "ToolCheetah - Free Online Tools & Utilities";
    const description = "Access 100+ free online tools for text editing, image processing, calculators, converters, and more. No sign-up required. Fast, secure, and privacy-focused.";
    
    document.title = title;
    
    // Meta description
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
    ogUrl.setAttribute('content', 'https://toolcheetah.com');

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
    canonical.setAttribute('href', 'https://toolcheetah.com');
  }, []);

  const handlePopularSearchClick = (search: string) => {
    navigate(`/search?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 via-background to-background py-20 sm:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] overflow-hidden"></div>
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
            <div className="mb-12 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
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
      <section id="categories" className="container py-12 sm:py-16">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">Categories</h2>
            <Link to="/categories" className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1 group whitespace-nowrap">
              View all
              <Icons.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} {...category} />
          ))}
        </div>
      </section>

      {/* Popular Tools Section */}
      <section id="popular" className="bg-secondary/20 py-12 sm:py-16">
        <div className="container">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">Popular Tools</h2>
              <Link to="/popular" className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1 group whitespace-nowrap">
                View all
                <Icons.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
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
      <section className="container py-12 sm:py-16">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">Recently Added</h2>
            <Link to="/new" className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1 group whitespace-nowrap">
              View all
              <Icons.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {newTools.map((tool) => (
            <ToolCard key={tool.id} {...tool} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;

import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { tools, categories } from "@/data/tools";
import { ToolCard } from "@/components/ToolCard";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  // SEO Meta Tags
  useEffect(() => {
    const query = searchQuery.trim();
    const title = query 
      ? `Search Results for "${query}" - ToolCheetah` 
      : "Search Tools - ToolCheetah";
    const description = query
      ? `Find the best online tools for "${query}". Browse and filter from our collection of free utilities, converters, generators, and calculators.`
      : "Search and discover the perfect online tool from ToolCheetah's comprehensive collection. Free tools for text, images, code, calculations, and more.";
    
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
    const url = query 
      ? `https://toolcheetah.com/search?q=${encodeURIComponent(query)}`
      : 'https://toolcheetah.com/search';
    ogUrl.setAttribute('content', url);

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
    canonical.setAttribute('href', url);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  let filteredTools = searchQuery.trim()
    ? tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tools;

  // Apply category filter
  if (selectedCategory !== "all") {
    filteredTools = filteredTools.filter((tool) => tool.category === selectedCategory);
  }

  // Apply sorting
  const sortedTools = [...filteredTools].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "popular":
        return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      case "new":
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      default:
        return 0; // relevance (keep original order)
    }
  });

  const clearFilters = () => {
    setSelectedCategory("all");
    setSortBy("relevance");
    setSearchQuery("");
    navigate("/search");
  };

  const hasActiveFilters = selectedCategory !== "all" || sortBy !== "relevance";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-4xl font-bold">Search Tools</h1>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? `Found ${sortedTools.length} ${sortedTools.length === 1 ? 'result' : 'results'}` : 'Browse all available tools'}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 pr-4 text-base shadow-md border-2"
              />
            </form>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          {/* Filters and Sort Bar */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Category Filter - Desktop */}
              <div className="hidden sm:block">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort - Desktop */}
              <div className="hidden sm:block">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="new">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mobile Filters Button */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="sm:hidden gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters & Sort
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                        !
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filters & Sort</SheetTitle>
                    <SheetDescription>
                      Refine your search results
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Sort By</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">Relevance</SelectItem>
                          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                          <SelectItem value="popular">Most Popular</SelectItem>
                          <SelectItem value="new">Newest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {hasActiveFilters && (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => {
                          clearFilters();
                          setFiltersOpen(false);
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="hidden sm:flex gap-2"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {sortedTools.length} of {tools.length} tools
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap gap-2">
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find(c => c.id === selectedCategory)?.name}
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {sortBy !== "relevance" && (
                <Badge variant="secondary" className="gap-1">
                  Sort: {sortBy === "name-asc" ? "A-Z" : sortBy === "name-desc" ? "Z-A" : sortBy === "popular" ? "Popular" : "Newest"}
                  <button
                    onClick={() => setSortBy("relevance")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Results Grid */}
          {sortedTools.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedTools.map((tool) => (
                <ToolCard key={tool.id} {...tool} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-bold mb-2">No tools found</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? `No results match "${searchQuery}". Try different keywords or clear filters.`
                  : "Try adjusting your filters to see more results."
                }
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
                <Button asChild>
                  <Link to="/">Browse All Tools</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default SearchPage;

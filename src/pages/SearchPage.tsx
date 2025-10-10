import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { tools } from "@/data/tools";
import { ToolCard } from "@/components/ToolCard";
import { Search } from "lucide-react";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const filteredTools = query.trim()
    ? tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query.toLowerCase()) ||
          tool.description.toLowerCase().includes(query.toLowerCase()) ||
          tool.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container">
          <div className="flex items-center gap-3 mb-6">
            <Search className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Search Results</h1>
              <p className="text-muted-foreground mt-1">
                Found {filteredTools.length} {filteredTools.length === 1 ? 'result' : 'results'} for "{query}"
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          {filteredTools.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} {...tool} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No tools found</h2>
              <p className="text-muted-foreground mb-6">
                Try searching with different keywords
              </p>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                Browse All Tools
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SearchPage;

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { tools } from "@/data/tools";
import { Card } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

export const SearchBar = () => {
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTools = search.trim()
    ? tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(search.toLowerCase()) ||
          tool.description.toLowerCase().includes(search.toLowerCase()) ||
          tool.category.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setShowResults(false);
      navigate(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  const handleToolClick = (toolId: string) => {
    setShowResults(false);
    setSearch("");
    navigate(`/tool/${toolId}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for tools..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => search && setShowResults(true)}
          className="h-14 pl-12 pr-4 text-base shadow-lg border-2 focus-visible:ring-primary"
        />
      </form>

      {showResults && filteredTools.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-2 shadow-xl">
          {filteredTools.map((tool) => {
            const IconComponent = (Icons[tool.icon as keyof typeof Icons] as LucideIcon) || Icons.Wrench;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{tool.name}</div>
                  <div className="text-xs text-muted-foreground">{tool.description}</div>
                </div>
              </button>
            );
          })}
          {search && (
            <button
              onClick={handleSearch}
              className="w-full mt-1 p-2 text-center text-sm text-primary hover:bg-accent rounded-lg transition-colors"
            >
              View all results for "{search}"
            </button>
          )}
        </Card>
      )}
    </div>
  );
};

import { useState, useEffect, useRef } from "react";
import { Search, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { tools } from "@/data/tools";
import { Card } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const SearchBar = () => {
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setShowResults(true);
      }

      // Arrow navigation in results
      if (showResults && filteredTools.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredTools.length);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % filteredTools.length);
        } else if (event.key === "Enter" && selectedIndex >= 0) {
          event.preventDefault();
          handleToolClick(filteredTools[selectedIndex].id);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showResults, selectedIndex, filteredTools]);

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
          ref={inputRef}
          type="text"
          placeholder="Search for tools..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowResults(true);
            setSelectedIndex(0);
          }}
          onFocus={() => search && setShowResults(true)}
          className="h-12 pl-12 pr-20 text-base shadow-md border-2 focus-visible:ring-primary rounded-2xl transition-all"
        />
        <Badge 
          variant="secondary" 
          className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex gap-1 text-xs"
        >
          <Command className="h-3 w-3" />
          <span>K</span>
        </Badge>
      </form>

      {showResults && filteredTools.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-2 shadow-xl max-h-96 overflow-y-auto rounded-2xl border-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {filteredTools.map((tool, index) => {
            const IconComponent = (Icons[tool.icon as keyof typeof Icons] as LucideIcon) || Icons.Wrench;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                  index === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
                }`}
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{tool.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{tool.description}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {tool.category}
                </Badge>
              </button>
            );
          })}
          {search && (
            <button
              onClick={handleSearch}
              className="w-full mt-1 p-2 text-center text-sm text-primary hover:bg-accent rounded-lg transition-colors font-medium"
            >
              View all results for "{search}"
            </button>
          )}
        </Card>
      )}
    </div>
  );
};

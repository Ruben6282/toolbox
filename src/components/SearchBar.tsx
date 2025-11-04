import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { tools } from "@/data/tools";
import { Card } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchBarProps {
  onToolSelect?: () => void;
}

export const SearchBar = ({ onToolSelect }: SearchBarProps = {}) => {
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1); // Start with no selection
  const [hasUsedKeyboard, setHasUsedKeyboard] = useState(false); // Track if keyboard navigation has been used
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTools = useMemo(() => {
    return search.trim()
      ? tools.filter(
          (tool) =>
            tool.name.toLowerCase().includes(search.toLowerCase()) ||
            tool.description.toLowerCase().includes(search.toLowerCase()) ||
            tool.category.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 5)
      : [];
  }, [search]);

  const handleToolClick = useCallback((toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (tool) {
      setShowResults(false);
      setSearch("");
      setSelectedIndex(-1);
      setHasUsedKeyboard(false);
      // Blur the input to dismiss mobile keyboard
      inputRef.current?.blur();
      // Call the callback to close mobile menu if provided
      onToolSelect?.();
      navigate(`/${tool.category}/${toolId}`);
    }
  }, [navigate, onToolSelect]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
        setHasUsedKeyboard(false);
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
          setHasUsedKeyboard(true);
          setSelectedIndex((prev) => {
            if (prev === -1) return 0; // First time using keyboard, select first item
            return (prev + 1) % filteredTools.length;
          });
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setHasUsedKeyboard(true);
          setSelectedIndex((prev) => {
            if (prev === -1) return filteredTools.length - 1; // First time using keyboard, select last item
            return (prev - 1 + filteredTools.length) % filteredTools.length;
          });
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
  }, [showResults, selectedIndex, filteredTools, hasUsedKeyboard, handleToolClick]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setShowResults(false);
      navigate(`/search?q=${encodeURIComponent(search)}`);
    }
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
            setSelectedIndex(-1); // Reset to no selection
            setHasUsedKeyboard(false); // Reset keyboard navigation state
          }}
          onFocus={() => search && setShowResults(true)}
          className="h-12 pl-12 pr-6 text-base shadow-lg border-2 focus-visible:ring-primary rounded-full transition-all duration-200 hover:shadow-xl focus:shadow-xl bg-background/95 backdrop-blur-sm"
        />
      </form>

      {showResults && filteredTools.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-1 shadow-2xl max-h-[400px] overflow-y-auto rounded-2xl border-2 border-border/50 bg-background animate-in fade-in slide-in-from-top-2 duration-300 ease-out overscroll-contain">
          {filteredTools.map((tool, index) => {
            const IconComponent = (Icons[tool.icon as keyof typeof Icons] as LucideIcon) || Icons.Wrench;
            const isSelected = hasUsedKeyboard && index === selectedIndex;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  isSelected 
                    ? "bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 shadow-md scale-[1.02] ring-2 ring-primary/20" 
                    : "hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:shadow-sm hover:scale-[1.01]"
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-all duration-200 ${
                  isSelected 
                    ? "bg-gradient-to-br from-primary/20 to-accent/20 shadow-sm" 
                    : "bg-primary/10 group-hover:bg-gradient-to-br group-hover:from-primary/15 group-hover:to-accent/15"
                }`}>
                  <IconComponent className={`h-4 w-4 transition-colors duration-200 ${
                    isSelected ? "text-primary" : "text-primary group-hover:text-primary"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm truncate transition-colors duration-200 ${
                    isSelected ? "text-foreground" : "text-foreground group-hover:text-foreground"
                  }`}>
                    {tool.name}
                  </div>
                  <div className={`text-xs truncate transition-colors duration-200 ${
                    isSelected ? "text-muted-foreground" : "text-muted-foreground group-hover:text-muted-foreground"
                  }`}>
                    {tool.description}
                  </div>
                </div>
                <Badge 
                  variant={isSelected ? "default" : "outline"} 
                  className={`text-xs transition-all duration-200 ${
                    isSelected 
                      ? "bg-primary/10 text-primary border-primary/20" 
                      : "group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/10"
                  }`}
                >
                  {tool.category}
                </Badge>
              </button>
            );
          })}
          {search && (
            <button
              onClick={handleSearch}
              className="w-full mt-2 p-3 text-center text-sm text-primary hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 rounded-xl transition-all duration-200 font-medium border-t border-border/50 hover:shadow-sm"
            >
              View all results for "{search}"
            </button>
          )}
        </Card>
      )}
    </div>
  );
};

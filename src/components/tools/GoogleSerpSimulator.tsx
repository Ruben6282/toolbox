import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, RotateCcw, Star, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

interface SerpResult {
  title: string;
  url: string;
  description: string;
  type: 'organic' | 'ad' | 'featured' | 'local' | 'image' | 'video';
  position: number;
  rating?: number;
  reviews?: number;
  price?: string;
  image?: string;
}

export const GoogleSerpSimulator = () => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [device, setDevice] = useState("desktop");
  const [results, setResults] = useState<SerpResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateSerpResults = async () => {
    if (!query.trim()) {
      toast.error("Please enter a search query!");
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock SERP results
      const mockResults: SerpResult[] = [
        {
          title: `${query} - Official Website`,
          url: `https://example.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
          description: `Find everything you need to know about ${query}. Comprehensive guide, tips, and resources for ${query.toLowerCase()}.`,
          type: 'organic',
          position: 1
        },
        {
          title: `Best ${query} Services | Top Rated`,
          url: `https://services.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
          description: `Professional ${query} services with 5-star ratings. Get quotes from verified providers in your area.`,
          type: 'ad',
          position: 2,
          rating: 4.8,
          reviews: 1247
        },
        {
          title: `${query} Guide 2024 - Complete Tutorial`,
          url: `https://guide.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
          description: `Step-by-step ${query} tutorial for beginners. Learn the basics and advanced techniques.`,
          type: 'featured',
          position: 3
        },
        {
          title: `${query} Near Me - Local Results`,
          url: `https://local.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
          description: `${query} services in ${location || 'your area'}. Open now, reviews, and contact information.`,
          type: 'local',
          position: 4,
          rating: 4.5,
          reviews: 89
        },
        {
          title: `${query} Images - Visual Results`,
          url: `https://images.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
          description: `Browse thousands of ${query} images. High-quality photos and illustrations.`,
          type: 'image',
          position: 5,
          image: `https://picsum.photos/200/150?random=${Math.floor(Math.random() * 1000)}`
        },
        {
          title: `${query} Video Tutorial - YouTube`,
          url: `https://youtube.com/watch?v=${Math.random().toString(36).substring(7)}`,
          description: `Watch this comprehensive ${query} video tutorial. Perfect for visual learners.`,
          type: 'video',
          position: 6,
          rating: 4.7,
          reviews: 2341
        },
        {
          title: `${query} FAQ - Common Questions`,
          url: `https://faq.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
          description: `Frequently asked questions about ${query}. Get answers to the most common queries.`,
          type: 'organic',
          position: 7
        },
        {
          title: `${query} Tools & Resources`,
          url: `https://tools.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
          description: `Free ${query} tools and resources. Calculators, generators, and helpful utilities.`,
          type: 'organic',
          position: 8
        }
      ];

      setResults(mockResults);
      toast.success("SERP results generated!");
    } catch (error) {
      toast.error("Failed to generate SERP results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setQuery("");
    setLocation("");
  };

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'ad': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'featured': return 'bg-green-100 text-green-800 border-green-200';
      case 'local': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'image': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'video': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResultTypeIcon = (type: string) => {
    switch (type) {
      case 'ad': return '🔵';
      case 'featured': return '⭐';
      case 'local': return '📍';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      default: return '🔍';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google SERP Simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-query">Search Query</Label>
            <Input
              id="search-query"
              placeholder="Enter your search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                placeholder="City, State or Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="device">Device Type</Label>
              <Select value={device} onValueChange={setDevice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generateSerpResults} 
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {isLoading ? "Simulating..." : "Simulate SERP"}
            </Button>
            <Button onClick={clearResults} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Generating SERP results...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Results for "{query}"
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">#{result.position}</span>
                        <Badge className={getResultTypeColor(result.type)}>
                          {getResultTypeIcon(result.type)} {result.type.toUpperCase()}
                        </Badge>
                        {result.rating && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{result.rating}</span>
                            <span className="text-muted-foreground">({result.reviews} reviews)</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-medium text-blue-600 hover:underline cursor-pointer mb-2">
                        {result.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {result.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-mono">{result.url}</span>
                        {result.type === 'local' && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>Local Business</span>
                          </div>
                        )}
                        {result.type === 'video' && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>5:32</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {result.image && (
                      <div className="flex-shrink-0">
                        <img
                          src={result.image}
                          alt={result.title}
                          className="w-32 h-24 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>SERP Features Explained</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">🔵 AD</Badge>
                <span>Paid advertisements</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 border-green-200">⭐ FEATURED</Badge>
                <span>Featured snippets</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">📍 LOCAL</Badge>
                <span>Local business results</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">🖼️ IMAGE</Badge>
                <span>Image search results</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-800 border-red-200">🎥 VIDEO</Badge>
                <span>Video search results</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-800 border-gray-200">🔍 ORGANIC</Badge>
                <span>Regular search results</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SERP Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Optimize title tags to be compelling and under 60 characters</li>
            <li>• Write meta descriptions that encourage clicks (150-160 characters)</li>
            <li>• Use structured data to appear in rich snippets</li>
            <li>• Optimize for featured snippets with clear, concise answers</li>
            <li>• Build local citations for local business visibility</li>
            <li>• Create high-quality, engaging content that answers user queries</li>
            <li>• Use relevant keywords naturally throughout your content</li>
            <li>• Optimize page loading speed for better rankings</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

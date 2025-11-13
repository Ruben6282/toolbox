import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, RotateCcw, Star, MapPin, Clock } from "lucide-react";
import { notify } from "@/lib/notify";
import { sanitizeText, truncateText } from "@/lib/security";

const MAX_QUERY_LENGTH = 200;
const MAX_LOCATION_LENGTH = 100;
const ALLOWED_DEVICES = ["desktop", "mobile", "tablet"] as const;
type Device = typeof ALLOWED_DEVICES[number];

const coerceDevice = (value: string): Device => {
  return ALLOWED_DEVICES.includes(value as Device) ? (value as Device) : "desktop";
};

// Sanitize text inputs
const sanitizeInput = (text: string, maxLen: number): string => {
  const cleaned = text.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code >= 32 || code === 9 || code === 10 || code === 13;
  }).join('');
  return cleaned.slice(0, maxLen);
};

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
  const [device, setDevice] = useState<Device>("desktop");
  const [results, setResults] = useState<SerpResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateSerpResults = async () => {
    if (!query.trim()) {
      notify.error("Please enter a search query!");
      return;
    }

    // Sanitize and truncate user inputs, then cap to 100 chars
    const safeQuery = sanitizeText(truncateText(query)).slice(0, 100);
    const safeLocation = location ? sanitizeText(truncateText(location)).slice(0, 100) : 'your area';
    const urlSlug = safeQuery.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock SERP results
      const mockResults: SerpResult[] = [
        {
          title: `${safeQuery} - Official Website`,
          url: `https://example.com/${urlSlug}`,
          description: `Find everything you need to know about ${safeQuery}. Comprehensive guide, tips, and resources for ${safeQuery.toLowerCase()}.`,
          type: 'organic',
          position: 1
        },
        {
          title: `Best ${safeQuery} Services | Top Rated`,
          url: `https://services.com/${urlSlug}`,
          description: `Professional ${safeQuery} services with 5-star ratings. Get quotes from verified providers in your area.`,
          type: 'ad',
          position: 2,
          rating: 4.8,
          reviews: 1247
        },
        {
          title: `${safeQuery} Guide 2024 - Complete Tutorial`,
          url: `https://guide.com/${urlSlug}`,
          description: `Step-by-step ${safeQuery} tutorial for beginners. Learn the basics and advanced techniques.`,
          type: 'featured',
          position: 3
        },
        {
          title: `${safeQuery} Near Me - Local Results`,
          url: `https://local.com/${urlSlug}`,
          description: `${safeQuery} services in ${safeLocation}. Open now, reviews, and contact information.`,
          type: 'local',
          position: 4,
          rating: 4.5,
          reviews: 89
        },
        {
          title: `${safeQuery} Images - Visual Results`,
          url: `https://images.com/${urlSlug}`,
          description: `Browse thousands of ${safeQuery} images. High-quality photos and illustrations.`,
          type: 'image',
          position: 5,
          image: `https://picsum.photos/200/150?random=${Math.floor(Math.random() * 1000)}`
        },
        {
          title: `${safeQuery} Video Tutorial - YouTube`,
          url: `https://youtube.com/watch?v=${Math.random().toString(36).substring(7)}`,
          description: `Watch this comprehensive ${safeQuery} video tutorial. Perfect for visual learners.`,
          type: 'video',
          position: 6,
          rating: 4.7,
          reviews: 2341
        },
        {
          title: `${safeQuery} FAQ - Common Questions`,
          url: `https://faq.com/${urlSlug}`,
          description: `Frequently asked questions about ${safeQuery}. Get answers to the most common queries.`,
          type: 'organic',
          position: 7
        },
        {
          title: `${safeQuery} Tools & Resources`,
          url: `https://tools.com/${urlSlug}`,
          description: `Free ${safeQuery} tools and resources. Calculators, generators, and helpful utilities.`,
          type: 'organic',
          position: 8
        }
      ];

      setResults(mockResults);
      notify.success("SERP results generated!");
    } catch (error) {
      console.error(error);
      notify.error("Failed to generate SERP results. Please try again.");
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
      case 'ad': return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'featured': return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'local': return 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'image': return 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'video': return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
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
    <div className="space-y-6 px-2 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle>Google SERP Simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-query" className="text-xs sm:text-sm">Search Query</Label>
            <Input
              id="search-query"
              placeholder="Enter your search query..."
              value={query}
              onChange={(e) => setQuery(sanitizeInput(e.target.value, MAX_QUERY_LENGTH))}
              maxLength={MAX_QUERY_LENGTH}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs sm:text-sm">Location (optional)</Label>
              <Input
                id="location"
                placeholder="City, State or Country"
                value={location}
                onChange={(e) => setLocation(sanitizeInput(e.target.value, MAX_LOCATION_LENGTH))}
                maxLength={MAX_LOCATION_LENGTH}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="device" className="text-xs sm:text-sm">Device Type</Label>
              <Select value={device} onValueChange={(value) => setDevice(coerceDevice(value))}>
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

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              onClick={generateSerpResults} 
              disabled={isLoading || !query.trim()}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Search className="h-4 w-4" />
              {isLoading ? "Simulating..." : "Simulate SERP"}
            </Button>
            <Button onClick={clearResults} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-xs sm:text-sm text-muted-foreground">Generating SERP results...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg break-words">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="break-words">Search Results for "{query}"</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-3">
                    <div className="flex-1 w-full min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs sm:text-sm text-muted-foreground">#{result.position}</span>
                        <Badge className={getResultTypeColor(result.type) + " text-xs sm:text-sm px-2 py-1"}>
                          {getResultTypeIcon(result.type)} {result.type.toUpperCase()}
                        </Badge>
                        {result.rating && (
                          <div className="flex items-center gap-1 text-xs sm:text-sm">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{result.rating}</span>
                            <span className="text-muted-foreground">({result.reviews} reviews)</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mb-2 break-words">
                        {result.title}
                      </h3>
                      
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">
                        {result.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                        <span className="font-mono break-all">{result.url}</span>
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
                      <div className="flex-shrink-0 w-full lg:w-auto">
                        <img
                          src={result.image}
                          alt={result.title}
                          className="w-full lg:w-32 h-24 object-cover rounded border"
                          loading="lazy"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs px-2 py-1">🔵 AD</Badge>
                <span>Paid advertisements</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800 text-xs px-2 py-1">⭐ FEATURED</Badge>
                <span>Featured snippets</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-xs px-2 py-1">📍 LOCAL</Badge>
                <span>Local business results</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800 text-xs px-2 py-1">🖼️ IMAGE</Badge>
                <span>Image search results</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 text-xs px-2 py-1">🎥 VIDEO</Badge>
                <span>Video search results</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700 text-xs px-2 py-1">🔍 ORGANIC</Badge>
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
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
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

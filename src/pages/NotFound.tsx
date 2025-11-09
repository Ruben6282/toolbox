import { Link } from "react-router-dom"
import { useEffect } from "react"
import { Home, Search, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"

const NotFound = () => {
  useEffect(() => {
    const title = "404 - Page Not Found | ToolCheetah";
    const description = "The page you're looking for doesn't exist. Browse our collection of free online tools or search for what you need.";
    
    document.title = title;
    
    // Meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Robots meta - tell search engines not to index 404 pages
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'noindex, follow');
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="relative">
            <h1 className="text-9xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              404
            </h1>
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/20 to-accent/20 -z-10" />
          </div>

          <h2 className="text-3xl font-bold">Page Not Found</h2>
          <p className="text-lg text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild size="lg">
              <Link to="/" className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/search" className="gap-2">
                <Search className="h-4 w-4" />
                Search Tools
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="gap-2 mt-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFound

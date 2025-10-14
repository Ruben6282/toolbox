import { Link } from "react-router-dom";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
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
  );
};

export default NotFound;

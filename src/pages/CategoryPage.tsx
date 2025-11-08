import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { ToolCard } from "@/components/ToolCard";
import { categories, tools } from "@/data/tools";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const CategoryPage = () => {
  const { categoryId } = useParams();
  const category = categories.find((c) => c.id === categoryId);
  const categoryTools = tools.filter((tool) => tool.category === categoryId);

  // SEO Meta Tags
  useEffect(() => {
    if (category) {
      const title = `${category.name} - ToolCheetah`;
      const description = `${category.description} Browse ${categoryTools.length} free ${category.name.toLowerCase()} including ${categoryTools.slice(0, 3).map(t => t.name).join(', ')}${categoryTools.length > 3 ? ', and more' : ''}.`;
      
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
      ogUrl.setAttribute('content', `https://toolcheetah.com/category/${categoryId}`);

      // Canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', `https://toolcheetah.com/category/${categoryId}`);
    }
  }, [category, categoryId, categoryTools]);

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="mb-4 text-4xl font-bold">Category Not Found</h1>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = (Icons[category.icon as keyof typeof Icons] as LucideIcon) || Icons.Wrench;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-to-br from-primary/5 via-accent/5 to-background py-16">
        <div className="container">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  {category.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4">
              <IconComponent className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="mb-2 text-4xl font-bold">{category.name}</h1>
              <p className="text-lg text-muted-foreground">{category.description}</p>
              <p className="mt-2 text-sm font-medium text-primary">{categoryTools.length} tools available</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          {categoryTools.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {categoryTools.map((tool) => (
                <ToolCard key={tool.id} {...tool} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4">
                <IconComponent className="h-16 w-16 text-primary opacity-50" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No tools yet</h2>
              <p className="text-muted-foreground mb-6">
                This category is empty. Check back soon for new tools!
              </p>
              <Button asChild>
                <Link to="/">Explore Other Categories</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;

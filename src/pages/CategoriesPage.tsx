import { Header } from "@/components/Header";
import { CategoryCard } from "@/components/CategoryCard";
import { AdSense } from "@/components/AdSense";
import { categories } from "@/data/tools";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const CategoriesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Categories</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">All Categories</h1>
          <p className="text-muted-foreground text-lg">
            Browse our collection of tools organized by category
          </p>
        </div>

        {/* AdSense - Before Categories */}
        <AdSense slot="4455667788" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} {...category} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default CategoriesPage;

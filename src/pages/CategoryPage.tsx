import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { ToolCard } from "@/components/ToolCard";
import { categories, tools } from "@/data/tools";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

const CategoryPage = () => {
  const { categoryId } = useParams();
  const category = categories.find((c) => c.id === categoryId);
  const categoryTools = tools.filter((tool) => tool.category === categoryId);

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
          <Link to="/">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>

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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categoryTools.map((tool) => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;

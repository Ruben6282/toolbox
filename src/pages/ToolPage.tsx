import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { tools, categories } from "@/data/tools";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ToolPage = () => {
  const { toolId } = useParams();
  const tool = tools.find((t) => t.id === toolId);
  const category = tool ? categories.find((c) => c.id === tool.category) : null;

  if (!tool || !category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="mb-4 text-4xl font-bold">Tool Not Found</h1>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = (Icons[tool.icon as keyof typeof Icons] as LucideIcon) || Icons.Wrench;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-to-br from-primary/5 via-accent/5 to-background py-12">
        <div className="container">
          <Link to={`/category/${category.id}`}>
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {category.name}
            </Button>
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-4">
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4">
                  <IconComponent className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <h1 className="text-4xl font-bold">{tool.name}</h1>
                    {tool.isNew && <Badge className="bg-accent text-accent-foreground">New</Badge>}
                    {tool.isPopular && <Badge variant="secondary">Popular</Badge>}
                  </div>
                  <p className="text-lg text-muted-foreground">{tool.description}</p>
                </div>
              </div>
            </div>

            <Button className="gap-2" size="lg">
              <Star className="h-4 w-4" />
              Add to Favorites
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Tool Interface</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 p-12">
                <div className="text-center">
                  <IconComponent className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Tool functionality will be implemented here
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This is a placeholder for the {tool.name} interface
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                    <span>Enter or paste your content in the input area</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                    <span>Configure any available options or settings</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                    <span>Click the process or convert button</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">4</span>
                    <span>Copy or download your results</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Free to use, no registration required
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Fast and efficient processing
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Works completely in your browser
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Your data never leaves your device
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Mobile-friendly interface
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ToolPage;

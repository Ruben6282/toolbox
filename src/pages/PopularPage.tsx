import { Header } from "@/components/Header";
import { ToolCard } from "@/components/ToolCard";
import { AdSense } from "@/components/AdSense";
import { tools } from "@/data/tools";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const PopularPage = () => {
  const popularTools = tools.filter((tool) => tool.isPopular);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Popular Tools</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Popular Tools</h1>
          <p className="text-muted-foreground text-lg">
            Most used and highly rated tools by our community
          </p>
        </div>

        {/* AdSense - Before Popular Tools */}
        <AdSense slot="4540396335" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} {...tool} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default PopularPage;

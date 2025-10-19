import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  isNew?: boolean;
  isPopular?: boolean;
}

export const ToolCard = ({ id, name, description, category, icon, isNew, isPopular }: ToolCardProps) => {
  const IconComponent = (Icons[icon as keyof typeof Icons] as LucideIcon) || Icons.Wrench;

  return (
    <Link to={`/${category}/${id}`} className="block group">
      <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border hover:border-primary/30 hover:-translate-y-1">
        <CardContent className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="inline-flex rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-2.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/20 group-hover:from-primary/20 group-hover:to-accent/20">
              <IconComponent className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-6" />
            </div>
            <div className="flex gap-1">
              {isNew && <Badge variant="secondary" className="text-xs bg-accent text-accent-foreground animate-pulse">New</Badge>}
              {isPopular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
            </div>
          </div>
          <h3 className="mb-2 font-semibold group-hover:text-primary transition-colors">{name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

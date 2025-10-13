import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  toolCount: number;
}

export const CategoryCard = ({ id, name, description, icon, toolCount }: CategoryCardProps) => {
  const IconComponent = (Icons[icon as keyof typeof Icons] as LucideIcon) || Icons.Wrench;

  return (
    <Link to={`/category/${id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/5 border hover:border-primary/30">
        <CardContent className="p-6">
          <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/20">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold group-hover:text-primary transition-colors">{name}</h3>
          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{description}</p>
          <p className="text-xs font-medium text-primary">{toolCount} tools</p>
        </CardContent>
      </Card>
    </Link>
  );
};

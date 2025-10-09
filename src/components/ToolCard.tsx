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
    <Link to={`/tool/${id}`}>
      <Card className="group h-full cursor-pointer transition-all hover:shadow-[var(--shadow-hover)] border hover:border-primary/50">
        <CardContent className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="inline-flex rounded-lg bg-secondary p-2.5 transition-transform group-hover:scale-110">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div className="flex gap-1">
              {isNew && <Badge variant="secondary" className="text-xs bg-accent text-accent-foreground">New</Badge>}
              {isPopular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
            </div>
          </div>
          <h3 className="mb-2 font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

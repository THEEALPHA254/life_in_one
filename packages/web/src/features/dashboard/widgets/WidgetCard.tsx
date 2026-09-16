import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  to: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}

export function WidgetCard({ to, title, icon: Icon, children }: Props) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition-colors group-hover:border-primary/50">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Icon className="h-4 w-4 text-primary" aria-hidden />
            <span>{title}</span>
            <ArrowUpRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
          </div>
          <div className="flex-1 space-y-2">{children}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function WidgetEmpty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

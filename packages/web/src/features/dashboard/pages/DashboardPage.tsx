import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { navItems } from "@/components/layout/nav-items";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const widgets = navItems.filter((n) => !["/dashboard", "/settings"].includes(n.to));
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Everything in one place. Widgets fill in as each module ships.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {widgets.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="group">
            <Card className="transition-colors group-hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <CardTitle>{label}</CardTitle>
                </div>
                <CardDescription>Open module</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Coming soon.</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

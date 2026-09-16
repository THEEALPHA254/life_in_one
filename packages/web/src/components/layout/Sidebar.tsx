import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { UserMenu } from "@/features/auth/components/UserMenu";

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-card">
      <div className="flex h-16 items-center px-6 text-lg font-semibold tracking-tight">
        Life<span className="text-primary">·</span>OS
      </div>
      <nav className="flex-1 space-y-1 px-3 pb-4" aria-label="Main navigation">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )
            }
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3">
        <UserMenu />
      </div>
    </aside>
  );
}

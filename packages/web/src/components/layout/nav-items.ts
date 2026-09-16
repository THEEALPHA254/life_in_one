import { LayoutDashboard, CheckSquare, Calendar, BookOpen, Wallet, Target, Heart, BookMarked, Settings } from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/budget", label: "Budget", icon: Wallet },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/health", label: "Health", icon: Heart },
  { to: "/bible", label: "Bible", icon: BookMarked },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const primaryMobileNav = navItems.filter((i) =>
  ["/dashboard", "/tasks", "/calendar", "/journal", "/settings"].includes(i.to),
);

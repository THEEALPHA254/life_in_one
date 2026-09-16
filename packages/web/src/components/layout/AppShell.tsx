import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { UserMenu } from "@/features/auth/components/UserMenu";

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b bg-card/60 px-4 py-3 md:hidden">
          <span className="text-lg font-semibold tracking-tight">
            Life<span className="text-primary">·</span>OS
          </span>
          <UserMenu compact />
        </header>
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

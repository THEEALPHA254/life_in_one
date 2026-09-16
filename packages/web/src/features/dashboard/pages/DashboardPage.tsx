import { useMemo } from "react";
import { format } from "date-fns";
import { useAuth } from "@/providers/AuthProvider";
import { TodayTasksWidget } from "../widgets/TodayTasksWidget";
import { NextEventWidget } from "../widgets/NextEventWidget";
import { TodayJournalWidget } from "../widgets/TodayJournalWidget";
import { BudgetWidget } from "../widgets/BudgetWidget";
import { GoalsWidget } from "../widgets/GoalsWidget";
import { HealthWidget } from "../widgets/HealthWidget";
import { BibleWidget } from "../widgets/BibleWidget";

function greetingFor(hour: number) {
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Late night";
}

export function DashboardPage() {
  const { user } = useAuth();
  const now = new Date();
  const name = useMemo(() => {
    const display = user?.user_metadata?.display_name as string | undefined;
    return display || user?.email?.split("@")[0] || "there";
  }, [user]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {greetingFor(now.getHours())}, {name}
        </h1>
        <p className="text-sm text-muted-foreground">{format(now, "EEEE, d MMMM yyyy")}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TodayTasksWidget />
        <NextEventWidget />
        <TodayJournalWidget />
        <BudgetWidget />
        <GoalsWidget />
        <HealthWidget />
        <BibleWidget />
      </div>
    </div>
  );
}

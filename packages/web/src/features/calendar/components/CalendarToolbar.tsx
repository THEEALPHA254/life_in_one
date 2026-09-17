import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarView = "month" | "week" | "day";

interface Props {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNew: () => void;
  onSync?: () => void;
  syncing?: boolean;
  syncEnabled?: boolean;
}

const views: { value: CalendarView; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

export function CalendarToolbar({ view, onViewChange, title, onPrev, onNext, onToday, onNew, onSync, syncing, syncEnabled }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={onPrev} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>Today</Button>
        <Button variant="outline" size="icon" onClick={onNext} aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
      <div role="tablist" className="ml-auto flex items-center rounded-lg bg-muted p-1 text-sm">
        {views.map((v) => {
          const active = view === v.value;
          return (
            <button
              key={v.value}
              role="tab"
              aria-selected={active}
              onClick={() => onViewChange(v.value)}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v.label}
            </button>
          );
        })}
      </div>
      {syncEnabled && onSync ? (
        <Button
          variant="outline"
          size="icon"
          onClick={onSync}
          disabled={syncing}
          aria-label={syncing ? "Syncing Google Calendar" : "Sync Google Calendar"}
          title={syncing ? "Syncing…" : "Sync Google Calendar"}
        >
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
        </Button>
      ) : null}
      <Button onClick={onNew}>
        <Plus className="h-4 w-4" /> New event
      </Button>
    </div>
  );
}

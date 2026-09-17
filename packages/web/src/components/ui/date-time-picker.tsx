import { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { AnalogClockPicker } from "@/components/ui/analog-clock-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null;
  onChange: (iso: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({ value, onChange, placeholder = "Pick a date & time", disabled, id }: Props) {
  const [tab, setTab] = useState<Tab>("date");
  const date = value ? new Date(value) : undefined;
  const hour = date ? date.getHours() : 9;
  const minute = date ? date.getMinutes() : 0;

  const emit = (nextDate: Date | undefined, h: number, m: number) => {
    if (!nextDate) {
      onChange(null);
      return;
    }
    const d = new Date(nextDate);
    d.setHours(h, m, 0, 0);
    onChange(d.toISOString());
  };

  const label = date ? format(date, "EEE, d MMM · HH:mm") : placeholder;

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) setTab("date");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("h-10 w-full justify-between font-normal", !date && "text-muted-foreground")}
        >
          <span className="inline-flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4" aria-hidden />
            {label}
          </span>
          {date ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date"
              className="ml-2 rounded p-0.5 opacity-70 hover:bg-accent hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                }
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div role="tablist" className="flex border-b">
          {(["date", "time"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium capitalize transition-colors",
                tab === t
                  ? "border-b-2 border-primary text-primary"
                  : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "date" ? (
          <div className="p-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                emit(d, hour, minute);
                if (d) setTab("time");
              }}
              defaultMonth={date}
            />
          </div>
        ) : (
          <div className="space-y-2 p-3">
            <AnalogClockPicker
              hour={hour}
              minute={minute}
              onChange={({ hour: h, minute: m }) => emit(date ?? new Date(), h, m)}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  emit(now, now.getHours(), now.getMinutes());
                }}
              >
                Now
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

import { useMemo } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null;
  onChange: (iso: string | null) => void;
  placeholder?: string;
  minuteStep?: number;
  disabled?: boolean;
  id?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date & time",
  minuteStep = 5,
  disabled,
  id,
}: Props) {
  const date = value ? new Date(value) : undefined;
  const hour = date ? date.getHours() : 9;
  const minute = date ? date.getMinutes() : 0;

  const minuteOptions = useMemo(() => {
    const opts: number[] = [];
    for (let m = 0; m < 60; m += minuteStep) opts.push(m);
    return opts;
  }, [minuteStep]);

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
    <Popover>
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
        <div className="p-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => emit(d, hour, minute)}
            defaultMonth={date}
          />
        </div>
        <div className="flex items-center gap-2 border-t p-3">
          <span className="text-xs text-muted-foreground">Time</span>
          <select
            aria-label="Hour"
            value={hour}
            onChange={(e) => emit(date ?? new Date(), Number(e.target.value), minute)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {pad(h)}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground">:</span>
          <select
            aria-label="Minute"
            value={minute}
            onChange={(e) => emit(date ?? new Date(), hour, Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {minuteOptions.map((m) => (
              <option key={m} value={m}>
                {pad(m)}
              </option>
            ))}
          </select>
          <div className="ml-auto flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const now = new Date();
                const rounded = Math.round(now.getMinutes() / minuteStep) * minuteStep;
                emit(now, now.getHours(), rounded % 60);
              }}
            >
              Now
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

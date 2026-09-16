import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  id?: string;
  align?: "start" | "center" | "end";
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", id, align }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn("h-10 justify-start gap-2 font-normal", !value && "text-muted-foreground")}
        >
          <CalendarIcon className="h-4 w-4" aria-hidden />
          {value ? format(value, "EEE, d MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-3">
        <Calendar mode="single" selected={value ?? undefined} onSelect={(d) => onChange(d ?? null)} defaultMonth={value ?? undefined} />
      </PopoverContent>
    </Popover>
  );
}

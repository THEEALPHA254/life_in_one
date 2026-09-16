import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps;

export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      className={cn("rdp-lio", className)}
      classNames={{
        today: "font-semibold text-primary",
        selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:bg-primary/90",
        chevron: "fill-current text-foreground",
        day_button: "rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        ...classNames,
      }}
      {...props}
    />
  );
}

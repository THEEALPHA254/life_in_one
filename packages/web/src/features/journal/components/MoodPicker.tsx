import { cn } from "@/lib/utils";

interface Props {
  value: 1 | 2 | 3 | 4 | 5 | null;
  onChange: (mood: 1 | 2 | 3 | 4 | 5 | null) => void;
}

const moods: { value: 1 | 2 | 3 | 4 | 5; label: string; emoji: string }[] = [
  { value: 1, label: "Awful", emoji: "😞" },
  { value: 2, label: "Meh", emoji: "😐" },
  { value: 3, label: "Okay", emoji: "🙂" },
  { value: 4, label: "Good", emoji: "😊" },
  { value: 5, label: "Great", emoji: "🤩" },
];

export function MoodPicker({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Mood" className="flex items-center gap-1">
      {moods.map((m) => {
        const active = value === m.value;
        return (
          <button
            key={m.value}
            role="radio"
            aria-checked={active}
            aria-label={m.label}
            onClick={() => onChange(active ? null : m.value)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-lg transition-transform",
              active ? "scale-110 bg-primary/15 ring-2 ring-primary" : "hover:bg-accent",
            )}
            type="button"
          >
            <span aria-hidden>{m.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}

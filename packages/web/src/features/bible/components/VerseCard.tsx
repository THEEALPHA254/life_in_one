import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BibleVerseRow } from "../hooks/useBible";

interface Props {
  verse: BibleVerseRow;
  onRemove: (verse: BibleVerseRow) => void;
}

function refLabel(v: BibleVerseRow) {
  const range = v.verse_end && v.verse_end !== v.verse_start ? `${v.verse_start}-${v.verse_end}` : `${v.verse_start}`;
  return `${v.book} ${v.chapter}:${range}`;
}

export function VerseCard({ verse, onRemove }: Props) {
  return (
    <div className="group relative rounded-lg border bg-card p-3">
      <div className="mb-1 flex items-baseline gap-2">
        <p className="text-sm font-semibold">{refLabel(verse)}</p>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{verse.translation}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(verse)}
          aria-label="Remove verse"
          className="ml-auto -mr-2 -mt-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {verse.text ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{verse.text}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">No text (API unreachable when added)</p>
      )}
    </div>
  );
}

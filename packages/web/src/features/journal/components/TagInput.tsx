import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JournalTagRow } from "../hooks/useJournal";

interface Props {
  tags: JournalTagRow[];
  suggestions: JournalTagRow[];
  onAdd: (name: string) => void | Promise<void>;
  onRemove: (tagId: string) => void | Promise<void>;
  disabled?: boolean;
}

export function TagInput({ tags, suggestions, onAdd, onRemove, disabled }: Props) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = draft.trim().toLowerCase();
  const existingIds = useMemo(() => new Set(tags.map((t) => t.id)), [tags]);
  const currentNames = useMemo(() => new Set(tags.map((t) => t.name.toLowerCase())), [tags]);

  const filteredSuggestions = useMemo(() => {
    return suggestions
      .filter((s) => !existingIds.has(s.id))
      .filter((s) => (trimmed ? s.name.toLowerCase().includes(trimmed) : true))
      .slice(0, 6);
  }, [suggestions, existingIds, trimmed]);

  const canCreateNew =
    trimmed.length > 0 &&
    !currentNames.has(trimmed) &&
    !suggestions.some((s) => s.name.toLowerCase() === trimmed);

  const commit = (raw: string) => {
    const name = raw.trim().toLowerCase();
    if (!name) return;
    setDraft("");
    if (currentNames.has(name)) {
      // already on this entry — silent skip
      return;
    }
    void onAdd(name);
    // keep focus so user can add another
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Escape") {
      setDraft("");
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      const last = tags[tags.length - 1];
      if (last) onRemove(last.id);
    }
  };

  const showDropdown = focused && (filteredSuggestions.length > 0 || canCreateNew);

  return (
    <div className="relative">
      <div
        className={cn(
          "flex flex-wrap items-center gap-1 rounded-md border border-input bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring",
          disabled && "opacity-60",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
          >
            {t.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(t.id);
              }}
              aria-label={`Remove ${t.name}`}
              disabled={disabled}
              className="rounded p-0.5 hover:bg-primary/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="flex-1 min-w-[8rem] bg-transparent px-1.5 text-sm outline-none placeholder:text-muted-foreground"
          placeholder={tags.length === 0 ? "Add tags — press Enter to create" : "Add tag…"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          disabled={disabled}
        />
      </div>

      {showDropdown ? (
        <ul className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-auto rounded-md border bg-card p-1 text-sm shadow-lg">
          {filteredSuggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(s.name);
                }}
                className="flex w-full items-center rounded px-2 py-1.5 text-left hover:bg-accent"
              >
                {s.name}
              </button>
            </li>
          ))}
          {canCreateNew ? (
            <li>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(draft);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-primary hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" />
                Create tag <span className="font-medium">"{trimmed}"</span>
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

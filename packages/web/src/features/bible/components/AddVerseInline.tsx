import { useState, type KeyboardEvent } from "react";
import { BookOpenText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onAdd: (reference: string) => void | Promise<void>;
  pending?: boolean;
}

export function AddVerseInline({ onAdd, pending }: Props) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const ref = draft.trim();
    if (!ref) return;
    void onAdd(ref);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <BookOpenText className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder='Add verse — e.g. "John 3:16" or "1 Corinthians 13:4-8"'
          className="pl-8"
          disabled={pending}
        />
      </div>
      <Button onClick={submit} disabled={pending || !draft.trim()}>
        {pending ? "Adding…" : "Add"}
      </Button>
    </div>
  );
}

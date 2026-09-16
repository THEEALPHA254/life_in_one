import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteTag, useTags, type JournalTagRow } from "../hooks/useJournal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageTagsDialog({ open, onOpenChange }: Props) {
  const tagsQ = useTags();
  const del = useDeleteTag();
  const [confirming, setConfirming] = useState<JournalTagRow | null>(null);

  const tags = tagsQ.data ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage tags</DialogTitle>
            <DialogDescription>Deleting a tag removes it from every entry it's on. Cannot be undone.</DialogDescription>
          </DialogHeader>
          {tagsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : tags.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              You don't have any tags yet.
            </p>
          ) : (
            <ul className="max-h-80 divide-y overflow-auto rounded-md border">
              {tags.map((t) => (
                <li key={t.id} className="flex items-center gap-2 px-3 py-2">
                  <span className="text-sm">{t.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => setConfirming(t)}
                    aria-label={`Delete tag ${t.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirming}
        onOpenChange={(o) => !o && setConfirming(null)}
        title={confirming ? `Delete "${confirming.name}"?` : "Delete tag?"}
        description="Removes this tag from every entry that has it. This cannot be undone."
        confirmLabel="Delete"
        destructive
        pending={del.isPending}
        onConfirm={async () => {
          if (!confirming) return;
          await del.mutateAsync(confirming.id);
          setConfirming(null);
        }}
      />
    </>
  );
}

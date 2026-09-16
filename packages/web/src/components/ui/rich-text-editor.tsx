import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Strikethrough } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  initialContent: unknown | null;
  onUpdate: (contentJson: unknown, contentText: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

// The editor owns its content once mounted. To load a different entry,
// remount with a different React `key` — do NOT try to sync via prop
// changes, or autosave-triggered refetches will overwrite in-flight typing.
export function RichTextEditor({ initialContent, onUpdate, placeholder, autoFocus }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
    ],
    content: (initialContent as object | null) ?? "",
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[240px] focus:outline-none [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:pointer-events-none [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:h-0 [&_.is-editor-empty]:before:text-muted-foreground",
      },
    },
    onUpdate: ({ editor }) => onUpdate(editor.getJSON(), editor.getText()),
  });

  if (!editor) return null;

  return (
    <div className="space-y-2">
      <Toolbar editor={editor} />
      <div className="rounded-md border bg-card p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const buttons: Array<{ label: string; icon: React.ComponentType<{ className?: string }>; active: () => boolean; run: () => void }> = [
    { label: "Bold", icon: Bold, active: () => editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    { label: "Italic", icon: Italic, active: () => editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
    { label: "Strike", icon: Strikethrough, active: () => editor.isActive("strike"), run: () => editor.chain().focus().toggleStrike().run() },
    { label: "H1", icon: Heading1, active: () => editor.isActive("heading", { level: 1 }), run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: "H2", icon: Heading2, active: () => editor.isActive("heading", { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Bulleted list", icon: List, active: () => editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", icon: ListOrdered, active: () => editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "Quote", icon: Quote, active: () => editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run() },
  ];
  return (
    <div className="flex flex-wrap gap-1 rounded-md border bg-card p-1">
      {buttons.map(({ label, icon: Icon, active, run }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          aria-pressed={active()}
          onClick={run}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            active() && "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

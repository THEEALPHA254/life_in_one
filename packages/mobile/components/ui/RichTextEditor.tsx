import { forwardRef, useEffect, useImperativeHandle } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { RichText, Toolbar, useEditorBridge } from "@10play/tentap-editor";
import { useThemeColors } from "@/providers/ThemeProvider";

export interface RichTextEditorHandle {
  readContent: () => Promise<{ contentJson: unknown; contentText: string }>;
  focus: () => void;
}

interface Props {
  // Only read at mount — parent must remount via React `key` to load a
  // different entry. Never sync via reactive props: an autosave-triggered
  // refetch would overwrite in-flight keystrokes. (Rule 1 of 8.)
  initialContent: unknown | null;
  placeholder?: string;
  autoFocus?: boolean;
  onChange?: () => void;
  minHeight?: number;
}

// Tiptap JSON that represents an empty doc — used when initialContent is null.
const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(function RichTextEditor(
  { initialContent, placeholder = "What happened?", autoFocus = false, onChange, minHeight = 240 },
  ref,
) {
  const colors = useThemeColors();
  const editor = useEditorBridge({
    initialContent: (initialContent as object | undefined) ?? EMPTY_DOC,
    autofocus: autoFocus,
    avoidIosKeyboard: true,
  });

  useEffect(() => {
    // Content-only subscription — fires on actual edits, not selection moves.
    const unsub = editor._subscribeToContentUpdate(() => {
      onChange?.();
    });
    return () => {
      unsub();
    };
  }, [editor, onChange]);

  useImperativeHandle(
    ref,
    () => ({
      readContent: async () => {
        const [contentJson, contentText] = await Promise.all([editor.getJSON(), editor.getText()]);
        return { contentJson, contentText };
      },
      focus: () => editor.focus("end"),
    }),
    [editor],
  );

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : undefined}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
      <View style={{ flex: 1, minHeight, backgroundColor: colors.surface, borderRadius: 12, overflow: "hidden" }}>
        <RichText editor={editor} />
      </View>
    </View>
  );
});

import { Modal, Pressable, Text, View } from "react-native";

interface Props {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  pending,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable className="flex-1 items-center justify-center bg-black/60 p-6" onPress={onCancel}>
        <Pressable
          className="w-full max-w-sm gap-4 rounded-xl bg-background p-5"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="gap-1">
            <Text className="text-lg font-semibold text-foreground">{title}</Text>
            {description ? <Text className="text-sm text-muted-foreground">{description}</Text> : null}
          </View>
          <View className="flex-row justify-end gap-2">
            <Pressable onPress={onCancel} className="rounded-md px-3 py-2">
              <Text className="text-sm text-muted-foreground">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm()}
              disabled={pending}
              className="rounded-md px-3 py-2"
              style={{
                backgroundColor: destructive ? "#ef4444" : "#6366f1",
                opacity: pending ? 0.7 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>
                {pending ? "…" : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

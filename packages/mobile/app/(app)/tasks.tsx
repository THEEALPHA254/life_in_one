import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Plus } from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useCreateTask,
  useDeleteTask,
  useTaskCategories,
  useTasks,
  useToggleTaskComplete,
  useUpdateTask,
  type TaskRow,
} from "@/features/tasks/hooks/useTasks";
import { bucketFor, bucketOrder, type Bucket } from "@/features/tasks/lib/buckets";
import { TaskFilters, type StatusFilter } from "@/features/tasks/components/TaskFilters";
import { TaskItem } from "@/features/tasks/components/TaskItem";
import { TaskFormModal } from "@/features/tasks/components/TaskFormModal";
import { ConfirmDialog } from "@/features/tasks/components/ConfirmDialog";
import { useThemeColors } from "@/providers/ThemeProvider";

type Row =
  | { kind: "header"; title: string; count: number }
  | { kind: "task"; task: TaskRow };

// Colored dot per bucket. Neutrals are picked to read on both light and dark
// backgrounds; if you change them, verify contrast in both themes.
const bucketDot: Record<Bucket | "Done", string> = {
  Overdue: "#ef4444",
  Today: "#6366f1",
  Tomorrow: "#0ea5e9",
  "This week": "#10b981",
  Later: "#94a3b8",
  "No date": "#cbd5e1",
  Done: "#94a3b8",
};

export default function TasksScreen() {
  const colors = useThemeColors();
  const [status, setStatus] = useState<StatusFilter>("active");
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [deleting, setDeleting] = useState<TaskRow | null>(null);

  const tasksQ = useTasks();
  const categoriesQ = useTaskCategories();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const toggleTask = useToggleTaskComplete();
  const deleteTask = useDeleteTask();

  const tasks = tasksQ.data ?? [];
  const categories = categoriesQ.data ?? [];

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (status === "active" && t.completed_at) return false;
      if (status === "done" && !t.completed_at) return false;
      return true;
    });
  }, [tasks, status]);

  const rows: Row[] = useMemo(() => {
    if (status === "done") {
      const flat: Row[] = [];
      if (filtered.length > 0) flat.push({ kind: "header", title: "Done", count: filtered.length });
      filtered.forEach((t) => flat.push({ kind: "task", task: t }));
      return flat;
    }
    const buckets: Record<Bucket, TaskRow[]> = {
      Overdue: [], Today: [], Tomorrow: [], "This week": [], Later: [], "No date": [],
    };
    for (const t of filtered) buckets[bucketFor(t)].push(t);
    const flat: Row[] = [];
    for (const b of bucketOrder) {
      if (buckets[b].length === 0) continue;
      flat.push({ kind: "header", title: b, count: buckets[b].length });
      for (const t of buckets[b]) flat.push({ kind: "task", task: t });
    }
    return flat;
  }, [filtered, status]);

  const openCreate = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditing(null);
    setFormVisible(true);
  };
  const openEdit = (t: TaskRow) => {
    setEditing(t);
    setFormVisible(true);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScreenHeader title="Tasks" subtitle="Everything you need to do, in one list." />

      <View className="px-5 pb-2">
        <TaskFilters status={status} onStatusChange={setStatus} />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r, i) => (r.kind === "task" ? r.task.id : `h-${r.title}-${i}`)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
        initialNumToRender={12}
        removeClippedSubviews
        ItemSeparatorComponent={ItemGap}
        ListEmptyComponent={
          tasksQ.isLoading ? (
            <Text className="mt-8 text-center text-sm text-muted-foreground">Loading…</Text>
          ) : (
            <View className="mt-4">
              <EmptyState
                emoji="✅"
                title="Nothing here yet"
                subtitle="Capture the first thing on your mind — you can polish it later."
                ctaLabel="Add your first task"
                onCta={openCreate}
              />
            </View>
          )
        }
        renderItem={({ item }) =>
          item.kind === "header" ? (
            <View className="mt-4 mb-2 flex-row items-center gap-2 first:mt-0">
              <View
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: bucketDot[item.title as Bucket | "Done"] ?? colors.mutedForeground }}
              />
              <Text className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                {item.title}
              </Text>
              <Text className="text-[12px] font-medium text-muted-foreground">· {item.count}</Text>
            </View>
          ) : (
            <TaskItem
              task={item.task}
              categories={categories}
              onToggle={(id, completed) => toggleTask.mutate({ id, completed })}
              onEdit={openEdit}
              onDelete={(t) => setDeleting(t)}
            />
          )
        }
      />

      <Pressable
        onPress={openCreate}
        className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full"
        style={{
          backgroundColor: "#6366f1",
          shadowColor: "#6366f1",
          shadowOpacity: 0.45,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
        accessibilityLabel="New task"
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </Pressable>

      <TaskFormModal
        visible={formVisible}
        editing={editing}
        categories={categories}
        submitting={createTask.isPending || updateTask.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={async (values) => {
          if (editing) {
            await updateTask.mutateAsync({ id: editing.id, patch: values });
          } else {
            await createTask.mutateAsync(values);
          }
          setFormVisible(false);
        }}
      />

      <ConfirmDialog
        visible={!!deleting}
        title="Delete task?"
        description={deleting ? `"${deleting.title}" will be permanently removed.` : undefined}
        confirmLabel="Delete"
        destructive
        pending={deleteTask.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteTask.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </SafeAreaView>
  );
}

function ItemGap() {
  return <View style={{ height: 10 }} />;
}

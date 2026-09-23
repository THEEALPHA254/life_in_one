import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { differenceInCalendarDays, format } from "date-fns";
import * as Haptics from "expo-haptics";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Plus,
  Trash2,
  Undo2,
  XCircle,
} from "lucide-react-native";
import type { GoalStatus } from "@lio/core/types";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/features/tasks/components/ConfirmDialog";
import { GoalFormModal } from "@/features/goals/components/GoalFormModal";
import {
  useChangeGoalStatus,
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useUpdateGoal,
  type GoalRow,
} from "@/features/goals/hooks/useGoals";
import { useThemeColors } from "@/providers/ThemeProvider";

type Filter = "active" | "achieved" | "abandoned" | "all";

const STATUS_LABEL: Record<GoalStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  achieved: "Achieved",
  abandoned: "Abandoned",
};
const STATUS_COLOR: Record<GoalStatus, string> = {
  pending: "#94a3b8",
  in_progress: "#6366f1",
  achieved: "#10b981",
  abandoned: "#f59e0b",
};

export default function GoalsScreen() {
  const colors = useThemeColors();
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [filter, setFilter] = useState<Filter>("active");
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<GoalRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GoalRow | null>(null);

  const goalsQ = useGoals(year);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const changeStatus = useChangeGoalStatus();

  const goals = goalsQ.data ?? [];

  const counts = useMemo(() => {
    const c = { pending: 0, in_progress: 0, achieved: 0, abandoned: 0 };
    for (const g of goals) c[g.status]++;
    return c;
  }, [goals]);

  const filtered = useMemo(() => {
    if (filter === "active") return goals.filter((g) => g.status === "pending" || g.status === "in_progress");
    if (filter === "achieved") return goals.filter((g) => g.status === "achieved");
    if (filter === "abandoned") return goals.filter((g) => g.status === "abandoned");
    return goals;
  }, [goals, filter]);

  const achievedPct = goals.length === 0 ? 0 : Math.round((counts.achieved / goals.length) * 100);

  const openCreate = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditing(null);
    setFormVisible(true);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScreenHeader title="Goals" subtitle="Track what you want this year." />

      <View className="px-5 pb-2">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setYear(year - 1)}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
            style={{ borderWidth: 1, borderColor: colors.border }}
          >
            <ChevronLeft size={16} color={colors.foreground2} />
          </Pressable>
          <View className="flex-1 items-center">
            <Text className="text-[15px] font-semibold text-foreground">{year}</Text>
          </View>
          <Pressable
            onPress={() => setYear(year + 1)}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
            style={{ borderWidth: 1, borderColor: colors.border }}
          >
            <ChevronRight size={16} color={colors.foreground2} />
          </Pressable>
          <Pressable
            onPress={() => setYear(new Date().getFullYear())}
            className="h-10 items-center justify-center rounded-full px-4"
            style={{ backgroundColor: "#eef2ff" }}
          >
            <Text style={{ color: "#4338ca", fontSize: 13, fontWeight: "600" }}>This year</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 140, gap: 10 }}
        ListHeaderComponent={
          <View className="gap-3 pb-2">
            <View className="rounded-xl bg-surface p-4" style={{ borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
                {counts.achieved} of {goals.length} achieved
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{achievedPct}% for {year}</Text>
              <View className="mt-3 h-2 overflow-hidden rounded-full" style={{ backgroundColor: colors.border }}>
                <View style={{ width: `${achievedPct}%`, height: "100%", backgroundColor: "#10b981" }} />
              </View>
              <View className="mt-3 flex-row flex-wrap gap-4">
                <StatCell label="Pending" value={counts.pending} color={STATUS_COLOR.pending} />
                <StatCell label="In progress" value={counts.in_progress} color={STATUS_COLOR.in_progress} />
                <StatCell label="Achieved" value={counts.achieved} color={STATUS_COLOR.achieved} />
                <StatCell label="Abandoned" value={counts.abandoned} color={STATUS_COLOR.abandoned} />
              </View>
            </View>

            <View className="flex-row gap-2">
              {(["active", "achieved", "abandoned", "all"] as Filter[]).map((f) => {
                const active = filter === f;
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    className="flex-1 items-center rounded-full py-2"
                    style={{
                      backgroundColor: active ? "#6366f1" : colors.surface,
                      borderWidth: 1,
                      borderColor: active ? "#6366f1" : colors.border,
                    }}
                  >
                    <Text style={{ color: active ? colors.surface : colors.mutedForeground, fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>
                      {f}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          goalsQ.isLoading ? (
            <Text className="mt-4 text-center text-sm text-muted-foreground">Loading…</Text>
          ) : (
            <View className="mt-2">
              <EmptyState
                emoji="🎯"
                title="No goals yet"
                subtitle="Write one ambition — big or small — for this year."
                ctaLabel="Add a goal"
                onCta={openCreate}
              />
            </View>
          )
        }
        renderItem={({ item }) => (
          <GoalItem
            goal={item}
            onEdit={() => {
              setEditing(item);
              setFormVisible(true);
            }}
            onDelete={() => setConfirmDelete(item)}
            onChangeStatus={(s) => changeStatus.mutate({ id: item.id, status: s })}
          />
        )}
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
        accessibilityLabel="New goal"
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </Pressable>

      <GoalFormModal
        visible={formVisible}
        editing={editing}
        defaultYear={year}
        submitting={createGoal.isPending || updateGoal.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={async (values) => {
          if (editing) {
            await updateGoal.mutateAsync({ id: editing.id, patch: values });
          } else {
            await createGoal.mutateAsync(values);
          }
          setFormVisible(false);
        }}
      />

      <ConfirmDialog
        visible={!!confirmDelete}
        title="Delete goal?"
        description={confirmDelete ? `"${confirmDelete.title}" will be removed.` : undefined}
        confirmLabel="Delete"
        destructive
        pending={deleteGoal.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteGoal.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useThemeColors();
  return (
    <View className="gap-0.5">
      <Text style={{ color: colors.mutedForeground, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
      <Text style={{ color, fontSize: 16, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

function GoalItem({
  goal,
  onEdit,
  onDelete,
  onChangeStatus,
}: {
  goal: GoalRow;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (s: GoalStatus) => void;
}) {
  const colors = useThemeColors();
  const isAchieved = goal.status === "achieved";
  const targetBadge = useTargetBadge(goal);

  return (
    <Pressable
      onPress={onEdit}
      className="rounded-xl bg-surface p-4"
      style={{ borderWidth: 1, borderColor: colors.border }}
    >
      <View className="flex-row items-start gap-2">
        <View className="flex-1">
          <Text
            style={{
              color: isAchieved ? colors.mutedForeground : colors.foreground,
              fontSize: 15,
              fontWeight: "600",
              textDecorationLine: isAchieved ? "line-through" : "none",
            }}
          >
            {goal.title}
          </Text>
          {goal.description ? (
            <Text numberOfLines={2} style={{ marginTop: 4, color: colors.mutedForeground, fontSize: 12 }}>
              {goal.description}
            </Text>
          ) : null}
          <View className="mt-2 flex-row flex-wrap gap-2">
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: STATUS_COLOR[goal.status] + "22" }}
            >
              <Text style={{ color: STATUS_COLOR[goal.status], fontSize: 10, fontWeight: "600" }}>
                {STATUS_LABEL[goal.status]}
              </Text>
            </View>
            {targetBadge ? (
              <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: targetBadge.bg }}>
                <Text style={{ color: targetBadge.fg, fontSize: 10, fontWeight: "600" }}>
                  {targetBadge.label}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        {!isAchieved ? (
          <>
            {goal.status !== "in_progress" ? (
              <ActionButton icon={<CircleDot size={14} color="#6366f1" />} label="Start" onPress={() => onChangeStatus("in_progress")} />
            ) : null}
            <ActionButton icon={<Check size={14} color="#10b981" />} label="Achieved" onPress={() => onChangeStatus("achieved")} />
            {goal.status !== "abandoned" ? (
              <ActionButton icon={<XCircle size={14} color="#f59e0b" />} label="Abandon" onPress={() => onChangeStatus("abandoned")} />
            ) : null}
          </>
        ) : (
          <ActionButton icon={<Undo2 size={14} color="#6366f1" />} label="Undo" onPress={() => onChangeStatus("pending")} />
        )}
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={onDelete}
          hitSlop={6}
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.destructiveSoft }}
        >
          <Trash2 size={14} color="#ef4444" />
        </Pressable>
      </View>
    </Pressable>
  );
}

function ActionButton({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1 rounded-full px-2.5 py-1.5"
      style={{ backgroundColor: colors.muted }}
    >
      {icon}
      <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

function useTargetBadge(goal: GoalRow): { label: string; bg: string; fg: string } | null {
  const colors = useThemeColors();
  if (goal.status === "achieved" && goal.achieved_at) {
    return {
      label: `Done · ${format(new Date(goal.achieved_at), "d MMM")}`,
      bg: "#10b98122",
      fg: "#10b981",
    };
  }
  if (!goal.target_date) return null;
  const target = new Date(goal.target_date + "T00:00:00");
  const days = differenceInCalendarDays(target, new Date());
  if (days < 0) return { label: `Overdue by ${-days}d`, bg: colors.destructiveSoft, fg: "#ef4444" };
  if (days === 0) return { label: "Due today", bg: colors.destructiveSoft, fg: "#ef4444" };
  if (days <= 14) return { label: `In ${days}d`, bg: "#eef2ff", fg: "#4338ca" };
  return { label: format(target, "d MMM"), bg: colors.muted, fg: colors.mutedForeground };
}

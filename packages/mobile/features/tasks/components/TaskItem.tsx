import { memo } from "react";
import { format, isPast, isToday } from "date-fns";
import * as Haptics from "expo-haptics";
import { Calendar, Check, Pencil, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { PriorityBadge } from "./PriorityBadge";
import type { TaskCategoryRow, TaskRow } from "../hooks/useTasks";

interface Props {
  task: TaskRow;
  categories: TaskCategoryRow[];
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (task: TaskRow) => void;
  onDelete: (task: TaskRow) => void;
}

function _TaskItem({ task, categories, onToggle, onEdit, onDelete }: Props) {
  const done = !!task.completed_at;
  const category = task.category_id ? categories.find((c) => c.id === task.category_id) : undefined;

  const due = task.due_at ? new Date(task.due_at) : null;
  const dueLabel = due ? format(due, "EEE, d MMM · HH:mm") : null;
  const dueOverdue = !!due && !done && isPast(due) && !isToday(due);
  const dueToday = !!due && !done && isToday(due);

  const dueBg = dueOverdue ? "#fef2f2" : dueToday ? "#eef2ff" : "#f8fafc";
  const dueFg = dueOverdue ? "#b91c1c" : dueToday ? "#4338ca" : "#64748b";

  return (
    <Card className="flex-row items-start gap-3 p-4">
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle(task.id, !done);
        }}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        className="mt-0.5 h-7 w-7 items-center justify-center rounded-full"
        style={{
          backgroundColor: done ? "#6366f1" : "transparent",
          borderWidth: 2,
          borderColor: done ? "#6366f1" : "#cbd5e1",
        }}
      >
        {done ? <Check size={14} color="#ffffff" strokeWidth={3} /> : null}
      </Pressable>

      <View className="flex-1 gap-1.5">
        <Text
          className="text-[15px] font-semibold"
          style={done ? { textDecorationLine: "line-through", color: "#94a3b8" } : { color: "#0f172a" }}
        >
          {task.title}
        </Text>
        {task.description ? (
          <Text
            numberOfLines={2}
            className="text-[13px] leading-5 text-muted-foreground"
            style={done ? { textDecorationLine: "line-through" } : undefined}
          >
            {task.description}
          </Text>
        ) : null}
        <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          {dueLabel ? (
            <View
              className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
              style={{ backgroundColor: dueBg }}
            >
              <Calendar size={11} color={dueFg} />
              <Text style={{ color: dueFg, fontSize: 11, fontWeight: "500" }}>{dueLabel}</Text>
            </View>
          ) : null}
          {category ? (
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: (category.color ?? "#94a3b8") + "1a" }}
            >
              <Text style={{ color: category.color ?? "#475569", fontSize: 11, fontWeight: "500" }}>
                {category.name}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="gap-1.5">
        <Pressable onPress={() => onEdit(task)} hitSlop={6} className="h-8 w-8 items-center justify-center rounded-full bg-muted">
          <Pencil size={14} color="#64748b" />
        </Pressable>
        <Pressable onPress={() => onDelete(task)} hitSlop={6} className="h-8 w-8 items-center justify-center rounded-full bg-muted">
          <Trash2 size={14} color="#64748b" />
        </Pressable>
      </View>
    </Card>
  );
}

export const TaskItem = memo(_TaskItem);

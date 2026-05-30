export const todoStatuses = ["todo", "in_progress", "done"] as const;
export const todoPriorities = ["low", "medium", "high"] as const;

export type TodoStatus = (typeof todoStatuses)[number];
export type TodoPriority = (typeof todoPriorities)[number];

export const statusLabels: Record<TodoStatus, string> = {
  todo: "Todo",
  in_progress: "In progress",
  done: "Done",
};

export const priorityLabels: Record<TodoPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function isTodoStatus(value: FormDataEntryValue | null): value is TodoStatus {
  return typeof value === "string" && todoStatuses.includes(value as TodoStatus);
}

export function isTodoPriority(
  value: FormDataEntryValue | null,
): value is TodoPriority {
  return typeof value === "string" && todoPriorities.includes(value as TodoPriority);
}

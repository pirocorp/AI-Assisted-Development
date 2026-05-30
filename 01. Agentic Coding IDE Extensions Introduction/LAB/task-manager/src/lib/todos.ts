import { prisma } from "@/lib/prisma";
import {
  isTodoPriority,
  isTodoStatus,
  type TodoPriority,
  type TodoStatus,
} from "@/lib/todo-types";

export type TodoFilters = {
  status?: TodoStatus;
  priority?: TodoPriority;
  query?: string;
};

export async function listTodos(filters: TodoFilters) {
  const query = filters.query?.trim();

  return prisma.todo.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: [
      { status: "asc" },
      { priority: "desc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });
}

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseTodoFilters(
  searchParams: Record<string, string | string[] | undefined>,
): TodoFilters {
  const status = singleValue(searchParams.status) ?? "";
  const priority = singleValue(searchParams.priority) ?? "";
  const query = singleValue(searchParams.q)?.trim() ?? "";

  return {
    status: isTodoStatus(status) ? status : undefined,
    priority: isTodoPriority(priority) ? priority : undefined,
    query: query || undefined,
  };
}

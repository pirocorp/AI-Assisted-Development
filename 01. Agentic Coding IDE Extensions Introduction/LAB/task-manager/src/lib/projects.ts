import { prisma } from "@/lib/prisma";
import {
  isTodoPriority,
  isTodoStatus,
  type TodoPriority,
  type TodoStatus,
} from "@/lib/todo-types";

export type ProjectFilters = {
  status?: TodoStatus;
  priority?: TodoPriority;
  projectId?: string;
  query?: string;
};

export async function listProjects(filters: ProjectFilters = {}) {
  const query = filters.query?.trim();

  return prisma.project.findMany({
    where: {
      ...(filters.projectId ? { id: filters.projectId } : {}),
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
    include: {
      _count: {
        select: { todos: true },
      },
    },
    orderBy: [
      { status: "asc" },
      { sortOrder: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });
}

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseProjectFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ProjectFilters {
  const status = singleValue(searchParams.projectStatus) ?? "";
  const priority = singleValue(searchParams.projectPriority) ?? "";
  const projectId = singleValue(searchParams.focusProject) ?? "";
  const query = singleValue(searchParams.projectQ)?.trim() ?? "";

  return {
    status: isTodoStatus(status) ? status : undefined,
    priority: isTodoPriority(priority) ? priority : undefined,
    projectId: projectId || undefined,
    query: query || undefined,
  };
}

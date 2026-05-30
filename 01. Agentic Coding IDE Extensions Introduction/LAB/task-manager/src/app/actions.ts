"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/action-state";
import {
  isTodoPriority,
  isTodoStatus,
  type TodoPriority,
  type TodoStatus,
} from "@/lib/todo-types";

type TodoInput = {
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: Date | null;
};

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseDueDate(value: string): Date | null | "invalid" {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? "invalid" : parsed;
}

function readTodoInput(formData: FormData): ActionState | TodoInput {
  const title = readText(formData, "title");
  const description = readText(formData, "description");
  const statusValue = formData.get("status");
  const priorityValue = formData.get("priority");
  const dueDateValue = readText(formData, "dueDate");
  const dueDate = parseDueDate(dueDateValue);

  if (!title) {
    return {
      ok: false,
      message: "Add a title before saving.",
      fieldErrors: { title: "Title is required." },
    };
  }

  if (title.length > 140) {
    return {
      ok: false,
      message: "Keep the title under 140 characters.",
      fieldErrors: { title: "Title must be 140 characters or fewer." },
    };
  }

  if (dueDate === "invalid") {
    return {
      ok: false,
      message: "Use a valid due date.",
      fieldErrors: { dueDate: "Due date is not valid." },
    };
  }

  return {
    title,
    description: description || null,
    status: isTodoStatus(statusValue) ? statusValue : "todo",
    priority: isTodoPriority(priorityValue) ? priorityValue : "medium",
    dueDate,
  };
}

function success(message: string): ActionState {
  revalidatePath("/");
  return { ok: true, message };
}

export async function createTodo(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const input = readTodoInput(formData);

  if ("ok" in input) {
    return input;
  }

  await prisma.todo.create({ data: input });
  return success("Task created.");
}

export async function updateTodo(
  id: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const input = readTodoInput(formData);

  if ("ok" in input) {
    return input;
  }

  await prisma.todo.update({
    where: { id },
    data: input,
  });

  return success("Task updated.");
}

export async function toggleTodoStatus(formData: FormData) {
  const id = readText(formData, "id");
  const currentStatus = formData.get("currentStatus");

  if (!id || !isTodoStatus(currentStatus)) {
    return;
  }

  await prisma.todo.update({
    where: { id },
    data: {
      status: currentStatus === "done" ? "todo" : "done",
    },
  });

  revalidatePath("/");
}

export async function setTodoStatus(formData: FormData) {
  const id = readText(formData, "id");
  const status = formData.get("status");

  if (!id || !isTodoStatus(status)) {
    return;
  }

  await prisma.todo.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/");
}

export async function deleteTodo(formData: FormData) {
  const id = readText(formData, "id");

  if (!id) {
    return;
  }

  await prisma.todo.delete({ where: { id } });
  revalidatePath("/");
}

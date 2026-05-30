"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Circle, Clock3, Plus, Search, Trash2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Todo } from "@/generated/prisma/client";
import { deleteTodo, setTodoStatus, toggleTodoStatus } from "@/app/actions";
import { TaskForm } from "@/components/task-form";
import {
  priorityLabels,
  statusLabels,
  todoPriorities,
  todoStatuses,
  type TodoPriority,
  type TodoStatus,
} from "@/lib/todo-types";

type TaskWorkspaceProps = {
  todos: Todo[];
  totalCount: number;
  activeFilters: {
    status?: TodoStatus;
    priority?: TodoPriority;
    query?: string;
  };
};

const statusIcons = {
  todo: Circle,
  in_progress: Clock3,
  done: Check,
};

const priorityStyles: Record<TodoPriority, string> = {
  low: "border-sky-200 bg-sky-50 text-sky-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-rose-200 bg-rose-50 text-rose-800",
};

function formatDate(date: Date | string | null) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function TaskWorkspace({
  todos,
  totalCount,
  activeFilters,
}: TaskWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TodoStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const groupedTodos = useMemo(
    () =>
      todoStatuses.map((status) => ({
        status,
        todos: todos.filter((todo) => todo.status === status),
      })),
    [todos],
  );

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearFilters() {
    router.replace(pathname, { scroll: false });
  }

  function moveTodoToStatus(id: string, status: TodoStatus) {
    startTransition(() => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("status", status);
      void setTodoStatus(formData);
    });
  }

  const hasFilters =
    Boolean(activeFilters.status) ||
    Boolean(activeFilters.priority) ||
    Boolean(activeFilters.query);
  const editingTodo = todos.find((todo) => todo.id === editingId);

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-zinc-950">
      <div className="mx-auto grid w-full max-w-7xl items-start gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <aside className="grid gap-4 self-start lg:sticky lg:top-5">
          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-normal">Tasks</h1>
                <p className="mt-1 text-sm text-zinc-600">
                  {totalCount} total, {todos.length} shown
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen((value) => !value)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white transition hover:bg-zinc-800"
                aria-label="Create task"
                title="Create task"
              >
                {isCreateOpen ? <X size={18} /> : <Plus size={18} />}
              </button>
            </div>

            {isCreateOpen ? (
              <div className="mt-4 border-t border-zinc-200 pt-4">
                <TaskForm mode="create" />
              </div>
            ) : null}
          </section>

        </aside>

        <section className="grid gap-4 self-start">
          <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
              <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
                Search
                <span className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    size={16}
                  />
                  <input
                    defaultValue={activeFilters.query ?? ""}
                    onChange={(event) => setFilter("q", event.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
                    placeholder="Title or description"
                  />
                </span>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
                Status
                <select
                  value={activeFilters.status ?? ""}
                  onChange={(event) => setFilter("status", event.target.value)}
                  className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-950"
                >
                  <option value="">All statuses</option>
                  {todoStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
                Priority
                <select
                  value={activeFilters.priority ?? ""}
                  onChange={(event) => setFilter("priority", event.target.value)}
                  className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-950"
                >
                  <option value="">All priorities</option>
                  {todoPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priorityLabels[priority]}
                    </option>
                  ))}
                </select>
              </label>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {totalCount === 0 ? (
            <EmptyState title="No tasks yet" body="Create the first task to start shaping the day." />
          ) : todos.length === 0 ? (
            <EmptyState
              title="No matching tasks"
              body="Adjust search or filters to bring tasks back into view."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {groupedTodos.map(({ status, todos: statusTodos }) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  todos={statusTodos}
                  isActiveDropTarget={dragOverStatus === status}
                  isPending={isPending}
                  deletingId={deletingId}
                  onDragEnter={() => setDragOverStatus(status)}
                  onDragLeave={() => setDragOverStatus(null)}
                  onDrop={(todoId) => {
                    setDragOverStatus(null);
                    moveTodoToStatus(todoId, status);
                  }}
                  onEdit={(todoId) => setEditingId(todoId)}
                  onCancelDelete={() => setDeletingId(null)}
                  onDeleteIntent={(todoId) => setDeletingId(todoId)}
                  onToggle={(todo) =>
                    startTransition(() => {
                      const formData = new FormData();
                      formData.set("id", todo.id);
                      formData.set("currentStatus", todo.status);
                      void toggleTodoStatus(formData);
                    })
                  }
                  onDelete={(todoId) =>
                    startTransition(() => {
                      const formData = new FormData();
                      formData.set("id", todoId);
                      void deleteTodo(formData);
                      setDeletingId(null);
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {editingTodo ? (
        <TaskModal title="Edit task" onClose={() => setEditingId(null)}>
          <TaskForm
            mode="edit"
            todo={editingTodo}
            onSaved={() => setEditingId(null)}
          />
        </TaskModal>
      ) : null}
    </main>
  );
}

function KanbanColumn({
  status,
  todos,
  isActiveDropTarget,
  isPending,
  deletingId,
  onDragEnter,
  onDragLeave,
  onDrop,
  onEdit,
  onToggle,
  onDeleteIntent,
  onCancelDelete,
  onDelete,
}: {
  status: TodoStatus;
  todos: Todo[];
  isActiveDropTarget: boolean;
  isPending: boolean;
  deletingId: string | null;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (todoId: string) => void;
  onEdit: (todoId: string) => void;
  onToggle: (todo: Todo) => void;
  onDeleteIntent: (todoId: string) => void;
  onCancelDelete: () => void;
  onDelete: (todoId: string) => void;
}) {
  const Icon = statusIcons[status];

  return (
    <section
      className={`grid min-h-80 content-start gap-3 rounded-lg border p-3 transition ${
        isActiveDropTarget
          ? "border-zinc-950 bg-white shadow-sm"
          : "border-zinc-200 bg-zinc-50/70"
      }`}
      onDragEnter={onDragEnter}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onDragLeave();
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const todoId = event.dataTransfer.getData("text/plain");

        if (todoId) {
          onDrop(todoId);
        }
      }}
    >
      <div className="flex items-center gap-2 px-1">
        <Icon size={17} className="text-zinc-600" aria-hidden="true" />
        <h2 className="text-sm font-semibold uppercase text-zinc-600">
          {statusLabels[status]}
        </h2>
        <span className="text-sm text-zinc-500">{todos.length}</span>
      </div>

      {todos.length ? (
        <div className="grid gap-3">
          {todos.map((todo) => (
            <article
              key={todo.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", todo.id);
              }}
              className="cursor-grab rounded-lg border border-zinc-200 bg-white p-4 shadow-sm active:cursor-grabbing"
            >
              <TaskCard
                todo={todo}
                isPending={isPending}
                isDeleting={deletingId === todo.id}
                onEdit={() => onEdit(todo.id)}
                onCancelDelete={onCancelDelete}
                onDeleteIntent={() => onDeleteIntent(todo.id)}
                onToggle={() => onToggle(todo)}
                onDelete={() => onDelete(todo.id)}
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-32 place-items-center rounded-md border border-dashed border-zinc-300 bg-white/70 p-4 text-center text-sm text-zinc-500">
          Drop tasks here
        </div>
      )}
    </section>
  );
}

function TaskModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-xl sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
          <h2 id="task-modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white transition hover:bg-zinc-800"
            aria-label="Close"
            title="Close"
          >
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">{body}</p>
      </div>
    </div>
  );
}

function TaskCard({
  todo,
  isPending,
  isDeleting,
  onEdit,
  onToggle,
  onDeleteIntent,
  onCancelDelete,
  onDelete,
}: {
  todo: Todo;
  isPending: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDeleteIntent: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const priority = todo.priority as TodoPriority;
  const dueDate = formatDate(todo.dueDate);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        <div className="min-w-0">
          <div className="grid gap-2">
            <h3 className="min-w-0 break-words text-base font-semibold leading-6">
              {todo.title}
            </h3>
            <span
              className={`w-fit rounded-md border px-2 py-0.5 text-xs font-semibold ${
                priorityStyles[priority]
              }`}
            >
              {priorityLabels[priority]}
            </span>
          </div>
          {todo.description ? (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-600">
              {todo.description}
            </p>
          ) : null}
          {dueDate ? <p className="mt-2 text-sm text-zinc-500">Due {dueDate}</p> : null}
        </div>

        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <button
            type="button"
            onClick={onToggle}
            disabled={isPending}
            className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {todo.status === "done" ? "Reopen" : "Complete"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDeleteIntent}
            className="inline-flex size-9 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 transition hover:bg-red-50 hover:text-red-700"
            aria-label="Delete task"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isDeleting ? (
        <div className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-red-900">Delete this task?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelDelete}
              className="h-9 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              className="h-9 rounded-md bg-red-700 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

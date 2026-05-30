"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Circle, Clock3, Plus, Search, Trash2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Prisma, Project } from "@/generated/prisma/client";
import {
  deleteProject,
  deleteTodo,
  reorderProjects,
  reorderTodos,
  toggleTodoStatus,
} from "@/app/actions";
import { ProjectForm, TaskForm } from "@/components/task-form";
import type { ProjectFilters } from "@/lib/projects";
import type { TodoFilters } from "@/lib/todos";
import {
  priorityLabels,
  statusLabels,
  todoPriorities,
  todoStatuses,
  type TodoPriority,
  type TodoStatus,
} from "@/lib/todo-types";

type TaskWorkspaceProps = {
  todos: TodoWithProject[];
  totalCount: number;
  activeFilters: TodoFilters;
  projects: ProjectWithCount[];
  allProjects: ProjectWithCount[];
  activeProjectFilters: ProjectFilters;
};

type TodoWithProject = Prisma.TodoGetPayload<{ include: { project: true } }>;
type ProjectWithCount = Project & { _count: { todos: number } };
type WorkspaceTab = "tasks" | "projects";

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
  projects,
  allProjects,
  activeProjectFilters,
}: TaskWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TodoStatus | null>(null);
  const [dragOverProjectStatus, setDragOverProjectStatus] =
    useState<TodoStatus | null>(null);
  const [isPending, startTransition] = useTransition();
  const activeTab: WorkspaceTab =
    searchParams.get("tab") === "projects" ? "projects" : "tasks";

  const groupedTodos = useMemo(
    () =>
      todoStatuses.map((status) => ({
        status,
        todos: todos.filter((todo) => todo.status === status),
      })),
    [todos],
  );
  const groupedProjects = useMemo(
    () =>
      todoStatuses.map((status) => ({
        status,
        projects: projects.filter((project) => project.status === status),
      })),
    [projects],
  );

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setTab(tab: WorkspaceTab) {
    const params = new URLSearchParams(searchParams.toString());

    if (tab === "projects") {
      params.set("tab", "projects");
    } else {
      params.delete("tab");
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearTaskFilters() {
    const params = new URLSearchParams(searchParams.toString());
    ["q", "status", "priority", "project"].forEach((key) => params.delete(key));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearProjectFilters() {
    const params = new URLSearchParams(searchParams.toString());
    ["projectQ", "projectStatus", "projectPriority", "focusProject"].forEach((key) =>
      params.delete(key),
    );
    params.set("tab", "projects");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function focusProject(projectId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "projects");
    params.set("focusProject", projectId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function moveTodo(
    id: string,
    status: TodoStatus,
    targetId?: string,
    placement: "before" | "after" = "before",
  ) {
    const targetColumn = groupedTodos.find((group) => group.status === status);
    const orderedIds = (targetColumn?.todos ?? [])
      .map((todo) => todo.id)
      .filter((todoId) => todoId !== id);

    const targetIndex = targetId ? orderedIds.indexOf(targetId) : -1;

    if (targetIndex >= 0) {
      orderedIds.splice(placement === "after" ? targetIndex + 1 : targetIndex, 0, id);
    } else {
      orderedIds.push(id);
    }

    startTransition(() => {
      const formData = new FormData();
      formData.set("status", status);
      orderedIds.forEach((todoId) => formData.append("orderedIds", todoId));
      void reorderTodos(formData);
    });
  }

  function moveProject(
    id: string,
    status: TodoStatus,
    targetId?: string,
    placement: "before" | "after" = "before",
  ) {
    const targetColumn = groupedProjects.find((group) => group.status === status);
    const orderedIds = (targetColumn?.projects ?? [])
      .map((project) => project.id)
      .filter((projectId) => projectId !== id);

    const targetIndex = targetId ? orderedIds.indexOf(targetId) : -1;

    if (targetIndex >= 0) {
      orderedIds.splice(placement === "after" ? targetIndex + 1 : targetIndex, 0, id);
    } else {
      orderedIds.push(id);
    }

    startTransition(() => {
      const formData = new FormData();
      formData.set("status", status);
      orderedIds.forEach((projectId) => formData.append("orderedIds", projectId));
      void reorderProjects(formData);
    });
  }

  const hasFilters =
    Boolean(activeFilters.status) ||
    Boolean(activeFilters.priority) ||
    Boolean(activeFilters.projectId) ||
    Boolean(activeFilters.query);
  const hasProjectFilters =
    Boolean(activeProjectFilters.status) ||
    Boolean(activeProjectFilters.priority) ||
    Boolean(activeProjectFilters.projectId) ||
    Boolean(activeProjectFilters.query);
  const editingTodo = todos.find((todo) => todo.id === editingId);
  const viewingTodo = todos.find((todo) => todo.id === viewingId);
  const editingProject =
    projects.find((project) => project.id === editingProjectId) ??
    allProjects.find((project) => project.id === editingProjectId);
  const activeTotal = activeTab === "tasks" ? totalCount : allProjects.length;
  const activeShown = activeTab === "tasks" ? todos.length : projects.length;

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-zinc-950">
      <div className="mx-auto grid w-full max-w-7xl items-start gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <aside className="grid gap-4 self-start lg:sticky lg:top-5">
          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-normal">
                  {activeTab === "tasks" ? "Tasks" : "Projects"}
                </h1>
                <p className="mt-1 text-sm text-zinc-600">
                  {activeTotal} total, {activeShown} shown
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
                {activeTab === "tasks" ? (
                  <TaskForm mode="create" projects={allProjects} />
                ) : (
                  <ProjectForm mode="create" />
                )}
              </div>
            ) : null}
          </section>

        </aside>

        <section className="grid gap-4 self-start">
          <div className="inline-grid w-fit grid-cols-2 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setTab("tasks")}
              className={`h-9 rounded-md px-4 text-sm font-semibold transition ${
                activeTab === "tasks"
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Tasks
            </button>
            <button
              type="button"
              onClick={() => setTab("projects")}
              className={`h-9 rounded-md px-4 text-sm font-semibold transition ${
                activeTab === "projects"
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Projects
            </button>
          </div>

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
                    key={activeTab}
                    defaultValue={
                      activeTab === "tasks"
                        ? activeFilters.query ?? ""
                        : activeProjectFilters.query ?? ""
                    }
                    onChange={(event) =>
                      setParam(activeTab === "tasks" ? "q" : "projectQ", event.target.value)
                    }
                    className="h-10 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
                    placeholder={
                      activeTab === "tasks"
                        ? "Title or description"
                        : "Project title or description"
                    }
                  />
                </span>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
                Status
                <select
                  value={
                    activeTab === "tasks"
                      ? activeFilters.status ?? ""
                      : activeProjectFilters.status ?? ""
                  }
                  onChange={(event) =>
                    setParam(
                      activeTab === "tasks" ? "status" : "projectStatus",
                      event.target.value,
                    )
                  }
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
                  value={
                    activeTab === "tasks"
                      ? activeFilters.priority ?? ""
                      : activeProjectFilters.priority ?? ""
                  }
                  onChange={(event) =>
                    setParam(
                      activeTab === "tasks" ? "priority" : "projectPriority",
                      event.target.value,
                    )
                  }
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

              {activeTab === "tasks" ? (
                <label className="grid gap-1.5 text-sm font-medium text-zinc-800 lg:col-span-3">
                  Project
                  <select
                    value={activeFilters.projectId ?? ""}
                    onChange={(event) => setParam("project", event.target.value)}
                    className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-950"
                  >
                    <option value="">All projects</option>
                    {allProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {(activeTab === "tasks" ? hasFilters : hasProjectFilters) ? (
                <button
                  type="button"
                  onClick={activeTab === "tasks" ? clearTaskFilters : clearProjectFilters}
                  className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {activeTab === "tasks" && totalCount === 0 ? (
            <EmptyState title="No tasks yet" body="Create the first task to start shaping the day." />
          ) : activeTab === "tasks" && todos.length === 0 ? (
            <EmptyState
              title="No matching tasks"
              body="Adjust search or filters to bring tasks back into view."
            />
          ) : activeTab === "tasks" ? (
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
                    moveTodo(todoId, status);
                  }}
                  onCardDrop={(todoId, targetId, placement) => {
                    setDragOverStatus(null);
                    moveTodo(todoId, status, targetId, placement);
                  }}
                  onEdit={(todoId) => setEditingId(todoId)}
                  onView={(todoId) => setViewingId(todoId)}
                  onProjectClick={focusProject}
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
          ) : allProjects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              body="Create the first project to group related tasks."
            />
          ) : projects.length === 0 ? (
            <EmptyState
              title="No matching projects"
              body="Adjust project search or filters to bring projects back into view."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {groupedProjects.map(({ status, projects: statusProjects }) => (
                <ProjectKanbanColumn
                  key={status}
                  status={status}
                  projects={statusProjects}
                  isActiveDropTarget={dragOverProjectStatus === status}
                  deletingProjectId={deletingProjectId}
                  onDragEnter={() => setDragOverProjectStatus(status)}
                  onDragLeave={() => setDragOverProjectStatus(null)}
                  onDrop={(projectId) => {
                    setDragOverProjectStatus(null);
                    moveProject(projectId, status);
                  }}
                  onCardDrop={(projectId, targetId, placement) => {
                    setDragOverProjectStatus(null);
                    moveProject(projectId, status, targetId, placement);
                  }}
                  onEdit={(projectId) => setEditingProjectId(projectId)}
                  onCancelDelete={() => setDeletingProjectId(null)}
                  onDeleteIntent={(projectId) => setDeletingProjectId(projectId)}
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
            projects={allProjects}
            onSaved={() => setEditingId(null)}
          />
        </TaskModal>
      ) : null}

      {viewingTodo ? (
        <TaskModal title={viewingTodo.title} onClose={() => setViewingId(null)}>
          <TaskDetail
            todo={viewingTodo}
            onProjectClick={(projectId) => {
              setViewingId(null);
              focusProject(projectId);
            }}
          />
        </TaskModal>
      ) : null}

      {editingProject ? (
        <TaskModal title="Edit project" onClose={() => setEditingProjectId(null)}>
          <ProjectForm
            mode="edit"
            project={editingProject}
            onSaved={() => setEditingProjectId(null)}
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
  onCardDrop,
  onEdit,
  onView,
  onProjectClick,
  onToggle,
  onDeleteIntent,
  onCancelDelete,
  onDelete,
}: {
  status: TodoStatus;
  todos: TodoWithProject[];
  isActiveDropTarget: boolean;
  isPending: boolean;
  deletingId: string | null;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (todoId: string) => void;
  onCardDrop: (
    todoId: string,
    targetId: string,
    placement: "before" | "after",
  ) => void;
  onEdit: (todoId: string) => void;
  onView: (todoId: string) => void;
  onProjectClick: (projectId: string) => void;
  onToggle: (todo: TodoWithProject) => void;
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
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const draggedTodoId = event.dataTransfer.getData("text/plain");
                const cardBounds = event.currentTarget.getBoundingClientRect();
                const placement =
                  event.clientY > cardBounds.top + cardBounds.height / 2
                    ? "after"
                    : "before";

                if (draggedTodoId && draggedTodoId !== todo.id) {
                  onCardDrop(draggedTodoId, todo.id, placement);
                }
              }}
              className="cursor-grab rounded-lg border border-zinc-200 bg-white p-4 shadow-sm active:cursor-grabbing"
            >
              <TaskCard
                todo={todo}
                isPending={isPending}
                isDeleting={deletingId === todo.id}
                onEdit={() => onEdit(todo.id)}
                onView={() => onView(todo.id)}
                onProjectClick={onProjectClick}
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

function ProjectKanbanColumn({
  status,
  projects,
  isActiveDropTarget,
  deletingProjectId,
  onDragEnter,
  onDragLeave,
  onDrop,
  onCardDrop,
  onEdit,
  onDeleteIntent,
  onCancelDelete,
}: {
  status: TodoStatus;
  projects: ProjectWithCount[];
  isActiveDropTarget: boolean;
  deletingProjectId: string | null;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (projectId: string) => void;
  onCardDrop: (
    projectId: string,
    targetId: string,
    placement: "before" | "after",
  ) => void;
  onEdit: (projectId: string) => void;
  onDeleteIntent: (projectId: string) => void;
  onCancelDelete: () => void;
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
        const projectId = event.dataTransfer.getData("text/plain");

        if (projectId) {
          onDrop(projectId);
        }
      }}
    >
      <div className="flex items-center gap-2 px-1">
        <Icon size={17} className="text-zinc-600" aria-hidden="true" />
        <h2 className="text-sm font-semibold uppercase text-zinc-600">
          {statusLabels[status]}
        </h2>
        <span className="text-sm text-zinc-500">{projects.length}</span>
      </div>

      {projects.length ? (
        <div className="grid gap-3">
          {projects.map((project) => (
            <article
              key={project.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", project.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const draggedProjectId = event.dataTransfer.getData("text/plain");
                const cardBounds = event.currentTarget.getBoundingClientRect();
                const placement =
                  event.clientY > cardBounds.top + cardBounds.height / 2
                    ? "after"
                    : "before";

                if (draggedProjectId && draggedProjectId !== project.id) {
                  onCardDrop(draggedProjectId, project.id, placement);
                }
              }}
              className="cursor-grab rounded-lg border border-zinc-200 bg-white p-4 shadow-sm active:cursor-grabbing"
            >
              <ProjectCard
                project={project}
                isDeleting={deletingProjectId === project.id}
                onEdit={() => onEdit(project.id)}
                onDeleteIntent={() => onDeleteIntent(project.id)}
                onCancelDelete={onCancelDelete}
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-32 place-items-center rounded-md border border-dashed border-zinc-300 bg-white/70 p-4 text-center text-sm text-zinc-500">
          Drop projects here
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

function TaskDetail({
  todo,
  onProjectClick,
}: {
  todo: TodoWithProject;
  onProjectClick: (projectId: string) => void;
}) {
  const dueDate = formatDate(todo.dueDate);
  const priority = todo.priority as TodoPriority;
  const status = todo.status as TodoStatus;

  return (
    <div className="grid gap-4 text-sm">
      <div className="grid gap-1">
        <span className="text-xs font-semibold uppercase text-zinc-500">Status</span>
        <p className="font-medium text-zinc-900">{statusLabels[status]}</p>
      </div>
      <div className="grid gap-1">
        <span className="text-xs font-semibold uppercase text-zinc-500">Priority</span>
        <span
          className={`w-fit rounded-md border px-2 py-0.5 text-xs font-semibold ${
            priorityStyles[priority]
          }`}
        >
          {priorityLabels[priority]}
        </span>
      </div>
      {todo.project ? (
        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase text-zinc-500">Project</span>
          <button
            type="button"
            onClick={() => onProjectClick(todo.project!.id)}
            className="w-fit text-left font-semibold text-sky-800 transition hover:text-sky-950"
          >
            {todo.project.title}
          </button>
        </div>
      ) : (
        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase text-zinc-500">Project</span>
          <p className="text-zinc-600">Unassigned</p>
        </div>
      )}
      {todo.description ? (
        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase text-zinc-500">
            Description
          </span>
          <p className="whitespace-pre-wrap leading-6 text-zinc-700">
            {todo.description}
          </p>
        </div>
      ) : null}
      {dueDate ? (
        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase text-zinc-500">Due</span>
          <p className="text-zinc-700">{dueDate}</p>
        </div>
      ) : null}
    </div>
  );
}

function ProjectCard({
  project,
  isDeleting,
  onEdit,
  onDeleteIntent,
  onCancelDelete,
}: {
  project: ProjectWithCount;
  isDeleting: boolean;
  onEdit: () => void;
  onDeleteIntent: () => void;
  onCancelDelete: () => void;
}) {
  const priority = project.priority as TodoPriority;
  const dueDate = formatDate(project.dueDate);

  function submitDelete(mode: "unassignTasks" | "deleteTasks") {
    const formData = new FormData();
    formData.set("id", project.id);
    formData.set("mode", mode);
    void deleteProject(formData);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        <div className="min-w-0">
          <div className="grid gap-2">
            <h3 className="min-w-0 break-words text-base font-semibold leading-6">
              {project.title}
            </h3>
            <span
              className={`w-fit rounded-md border px-2 py-0.5 text-xs font-semibold ${
                priorityStyles[priority]
              }`}
            >
              {priorityLabels[priority]}
            </span>
          </div>
          {project.description ? (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-600">
              {project.description}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-zinc-500">
            {project._count.todos} linked {project._count.todos === 1 ? "task" : "tasks"}
          </p>
          {dueDate ? <p className="mt-2 text-sm text-zinc-500">Due {dueDate}</p> : null}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
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
            aria-label="Delete project"
            title="Delete project"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isDeleting ? (
        <div className="grid gap-3 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-900">Delete this project?</p>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => submitDelete("unassignTasks")}
              className="h-9 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-900"
            >
              Delete and unassign tasks
            </button>
            <button
              type="button"
              onClick={() => submitDelete("deleteTasks")}
              className="h-9 rounded-md bg-red-700 px-3 text-sm font-semibold text-white"
            >
              Delete project and tasks
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              className="h-9 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TaskCard({
  todo,
  isPending,
  isDeleting,
  onEdit,
  onView,
  onProjectClick,
  onToggle,
  onDeleteIntent,
  onCancelDelete,
  onDelete,
}: {
  todo: TodoWithProject;
  isPending: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onView: () => void;
  onProjectClick: (projectId: string) => void;
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
            <button
              type="button"
              onClick={onView}
              className="min-w-0 break-words text-left text-base font-semibold leading-6 transition hover:text-zinc-600"
            >
              {todo.title}
            </button>
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
          {todo.project ? (
            <button
              type="button"
              onClick={() => onProjectClick(todo.project!.id)}
              className="mt-2 block max-w-full truncate text-left text-sm font-semibold text-sky-800 transition hover:text-sky-950"
              title={todo.project.title}
            >
              {todo.project.title}
            </button>
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
        <div className="grid gap-3 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-900">Delete this task?</p>
          <div className="flex justify-end gap-2">
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

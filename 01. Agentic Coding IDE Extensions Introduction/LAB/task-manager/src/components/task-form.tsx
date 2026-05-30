"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Todo } from "@/generated/prisma/client";
import { createTodo, updateTodo } from "@/app/actions";
import { initialActionState } from "@/lib/action-state";
import {
  priorityLabels,
  statusLabels,
  todoPriorities,
  todoStatuses,
} from "@/lib/todo-types";
import { SubmitButton } from "@/components/submit-button";

type TaskFormProps = {
  mode: "create" | "edit";
  todo?: Todo;
  onSaved?: () => void;
};

function dateValue(date: Date | string | null) {
  if (!date) {
    return "";
  }

  return new Date(date).toISOString().slice(0, 10);
}

export function TaskForm({ mode, todo, onSaved }: TaskFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = todo ? updateTodo.bind(null, todo.id) : createTodo;
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (!state.ok) {
      return;
    }

    if (mode === "create") {
      formRef.current?.reset();
    }

    onSaved?.();
  }, [mode, onSaved, state.ok]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-zinc-800" htmlFor={`${mode}-title`}>
          Title
        </label>
        <input
          id={`${mode}-title`}
          name="title"
          defaultValue={todo?.title ?? ""}
          maxLength={140}
          required
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
          placeholder="What needs attention?"
        />
        {state.fieldErrors?.title ? (
          <p className="text-xs font-medium text-red-700">{state.fieldErrors.title}</p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <label
          className="text-sm font-medium text-zinc-800"
          htmlFor={`${mode}-description`}
        >
          Description
        </label>
        <textarea
          id={`${mode}-description`}
          name="description"
          defaultValue={todo?.description ?? ""}
          rows={mode === "create" ? 3 : 4}
          className="min-h-20 resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
          placeholder="Add context, links, or next steps."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
          Status
          <select
            name="status"
            defaultValue={todo?.status ?? "todo"}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-950"
          >
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
            name="priority"
            defaultValue={todo?.priority ?? "medium"}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-950"
          >
            {todoPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabels[priority]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
          Due date
          <input
            name="dueDate"
            type="date"
            defaultValue={dateValue(todo?.dueDate ?? null)}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-950"
          />
        </label>
      </div>

      {state.fieldErrors?.dueDate ? (
        <p className="text-xs font-medium text-red-700">{state.fieldErrors.dueDate}</p>
      ) : null}

      {state.message ? (
        <p
          className={`text-sm font-medium ${
            state.ok ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        pendingLabel={mode === "create" ? "Creating" : "Saving"}
      >
        {mode === "create" ? "Create task" : "Save changes"}
      </SubmitButton>
    </form>
  );
}

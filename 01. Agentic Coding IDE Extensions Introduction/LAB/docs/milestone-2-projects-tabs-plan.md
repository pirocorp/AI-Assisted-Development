# Milestone 2: Tabs, Projects CRUD, And Task-Project Links

## Summary

Add a two-tab workspace to the existing task manager: `Tasks` and `Projects`. The current task Kanban remains in the `Tasks` tab. A new `Projects` tab adds full project CRUD with the same task-like Kanban behavior: create, view, edit, delete, search/filter, drag between statuses, and reorder within columns. Tasks can optionally link to one project, and projects can have many tasks.

## Key Changes

- Add a `Project` model with task-like fields: `title`, `description`, `status`, `priority`, `sortOrder`, `dueDate`, `createdAt`, `updatedAt`.
- Add optional `Todo.projectId` relation so a task may be unassigned or linked to one project.
- Add database setup/migration handling for existing SQLite/Docker volumes, preserving current tasks and leaving them unassigned by default.
- Add top-level tabs:
  - `Tasks`: existing task Kanban, enhanced with project linking.
  - `Projects`: project Kanban with create/edit/delete/reorder/status movement.
- Add project support to task UI:
  - Task create/edit form includes an optional project dropdown.
  - Task cards show a shortened project name as a clickable link.
  - Clicking the project link switches to `Projects` tab and filters/highlights/opens that project.
  - Task detail opens in a read-only modal and shows the full project name/link.
  - Tasks toolbar adds a project filter alongside search, status, and priority.
- Add project deletion confirmation with two explicit actions:
  - Delete project and unassign linked tasks.
  - Delete project and delete linked tasks.

## Implementation Changes

- Generalize reusable Kanban behavior where practical: status columns, drag/drop reorder, card shell, delete confirmation, empty states, and toolbar patterns should support both tasks and projects without forcing unrelated abstractions.
- Add project server actions: create, update, delete with selected linked-task handling, list/filter projects, set status, and reorder.
- Extend task server actions and list queries to include optional project relation data and project filtering.
- Keep project and task status/priority values aligned with existing task values: `todo`, `in_progress`, `done`; `low`, `medium`, `high`.
- Keep edit flows modal-based. Add a read-only task detail modal opened from task card/title; edit remains a separate action.
- Update Docker/native runbook only if commands or migration/setup behavior changes; keep regular `docker compose up --build -d` as the preferred run workflow.

## Test Plan

- Run `npm.cmd run db:setup`, `npm.cmd run lint`, and `npm.cmd run build`.
- Verify existing tasks survive migration and appear unassigned.
- Tasks tab:
  - Create/edit/delete tasks with and without project links.
  - Filter tasks by search, status, priority, and project.
  - Click project link on a task card and confirm it navigates to the Projects tab focused on that project.
  - Open task detail modal and confirm full project name/link appears.
  - Drag tasks across statuses and reorder inside a status column.
- Projects tab:
  - Create a project with only title and with all fields.
  - Edit every project field.
  - Drag projects across statuses and reorder inside a status column.
  - Search/filter projects by status and priority.
  - Delete a project with linked tasks using both choices: unassign tasks and delete tasks.
- Responsive checks:
  - Tabs, toolbars, Kanban columns, task cards, project cards, and modals do not overflow or produce vertical text wrapping on desktop or mobile.

## Locked Decisions

- Project UI: project Kanban with task-like CRUD and drag/reorder behavior.
- Project fields: task-like fields, no color field in Milestone 2.
- Task-project relationship: optional task link to one project.
- Tabs: `Tasks` and `Projects`.
- Project deletion with linked tasks: user chooses between unassigning linked tasks or deleting them.
- Task project display: shortened project link on task cards, full project link in read-only task detail modal.
- Tasks toolbar: include project filter.

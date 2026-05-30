# Personal Task Manager: Milestone 1 TODO CRUD

## Summary

Build a new greenfield **Next.js personal task management app** with **SQLite + Prisma**, focused on a calm, distraction-free TODO workflow. Milestone 1 delivers full single-user CRUD for TODOs with a polished responsive interface, simple visual structure, and no authentication.

Default stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite local database
- Server Actions for mutations
- React Server Components for initial data loading

## Key Changes

- Scaffold a new Next.js project in the workspace with TypeScript, Tailwind, ESLint, and App Router.
- Add Prisma with SQLite and define a `Todo` model:
  - `id`
  - `title`
  - `description`
  - `status`: `todo`, `in_progress`, `done`
  - `priority`: `low`, `medium`, `high`
  - `dueDate`
  - `createdAt`
  - `updatedAt`
- Create the first database migration and local SQLite database.
- Implement TODO CRUD:
  - Create TODO
  - View TODO list
  - Edit title, description, status, priority, and due date
  - Mark complete / reopen
  - Delete TODO
- Add focused task organization UI:
  - Main task list
  - Filters for status and priority
  - Search by title/description
  - Clear empty states
  - Responsive layout for desktop and mobile
- Keep the visual design quiet and practical:
  - No landing page
  - First screen is the task workspace
  - Compact controls, clear spacing, readable hierarchy
  - Minimal color accents for priority/status only

## Implementation Plan

1. Scaffold the app:
   - Create the Next.js project.
   - Install Prisma and SQLite dependencies.
   - Initialize Prisma.
   - Configure the SQLite database path in `.env`.
2. Define persistence:
   - Add the `Todo` Prisma model.
   - Run the first migration.
   - Add a shared Prisma client helper to avoid duplicate clients during dev.
3. Build server-side task operations:
   - `createTodo`
   - `updateTodo`
   - `toggleTodoStatus`
   - `deleteTodo`
   - `listTodos` with optional filter/search parameters
   - Validate inputs before writing to the database.
4. Build the main task workspace:
   - Header with app name and create button/form.
   - Task creation form.
   - Filter/search controls.
   - Task list grouped or visually separated by status.
   - Inline or modal edit flow.
   - Delete confirmation.
5. Add UI states:
   - Empty task list state.
   - No-results state for filters/search.
   - Loading and pending mutation states.
   - Basic form validation messages.

## Test Plan

- Run lint/type checks for the new project.
- Verify database migration succeeds.
- Manual CRUD scenarios:
  - Create a TODO with only a title.
  - Create a TODO with all optional fields.
  - Edit every TODO field.
  - Mark TODO done and reopen it.
  - Delete a TODO.
  - Filter by status and priority.
  - Search by title and description.
  - Confirm empty and no-results states render correctly.
- Responsive checks:
  - Desktop layout is clear and scannable.
  - Mobile layout does not overflow or overlap.

## Assumptions

- Milestone 1 is single-user only with no authentication.
- Data is stored locally in SQLite.
- Prisma is the database layer.
- The app should prioritize clarity and daily usability over enterprise-style features.
- Projects, recurring tasks, goal tracking, reminders, collaboration, and accounts are future milestones, not part of milestone 1.

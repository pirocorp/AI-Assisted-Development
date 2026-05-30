import { TaskWorkspace } from "@/components/task-workspace";
import { listProjects, parseProjectFilters } from "@/lib/projects";
import { listTodos, parseTodoFilters } from "@/lib/todos";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const activeFilters = parseTodoFilters(params);
  const activeProjectFilters = parseProjectFilters(params);
  const [todos, allTodos, projects, allProjects] = await Promise.all([
    listTodos(activeFilters),
    listTodos({}),
    listProjects(activeProjectFilters),
    listProjects({}),
  ]);

  return (
    <TaskWorkspace
      todos={todos}
      totalCount={allTodos.length}
      activeFilters={activeFilters}
      projects={projects}
      allProjects={allProjects}
      activeProjectFilters={activeProjectFilters}
    />
  );
}

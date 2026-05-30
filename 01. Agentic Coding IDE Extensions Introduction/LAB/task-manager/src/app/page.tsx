import { TaskWorkspace } from "@/components/task-workspace";
import { listTodos, parseTodoFilters } from "@/lib/todos";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const activeFilters = parseTodoFilters(params);
  const [todos, allTodos] = await Promise.all([
    listTodos(activeFilters),
    listTodos({}),
  ]);

  return (
    <TaskWorkspace
      todos={todos}
      totalCount={allTodos.length}
      activeFilters={activeFilters}
    />
  );
}

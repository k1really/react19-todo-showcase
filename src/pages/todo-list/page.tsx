import {
  startTransition,
  Suspense,
  use,
  useActionState,
  useMemo,
  useState,
  useTransition,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  fetchTasks,
  type PaginatedResponse,
  type Task,
} from "../../shared/api";
import { useParams } from "react-router-dom";
import { createTaskAction, deleteTaskAction } from "./actions";
import { useUsersGlobal } from "../../entities/user";

export function ToDoListPage() {
  const { userId = "" } = useParams();
  const [search, setSearch] = useState("");

  const getTasks = async ({
    page = 1,
    title = search,
  }: {
    page?: number;
    title?: string;
  }) => fetchTasks({ page, filters: { userId, title } });

  const [paginatedTasksPromise, setTasksPromise] = useState(() => getTasks({}));

  const refetchTasks = async () => {
    const { page } = await paginatedTasksPromise;
    startTransition(() => setTasksPromise(getTasks({ page })));
  };

  const onPageChange = (newPage: number) => {
    setTasksPromise(getTasks({ page: newPage }));
  };

  const tasksPromise = useMemo(
    () => paginatedTasksPromise.then((res) => res.data),
    [paginatedTasksPromise],
  );

  const handleChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);

    startTransition(() => setTasksPromise(getTasks({ title: e.target.value })));
  };
  return (
    <main className="container mx-auto p-4 pt-10 flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Tasks:</h1>
      <CreateTaskForm userId={userId} refetchTasks={refetchTasks} />
      <div className="flex gap-2">
        <input
          placeholder="Search"
          type="text"
          className="border rounded p-2"
          value={search}
          onChange={handleChangeSearch}
        />
        {/* <select className="border p-2 rounded">
          <option value="pending">New to Old</option>
          <option value="completed">Old to New</option>
        </select> */}
      </div>
      <ErrorBoundary
        fallbackRender={(e) => (
          <div className="text-red-500">
            Something went wrong: {JSON.stringify(e)}
          </div>
        )}
      >
        <Suspense fallback={<div>Loading tasks...</div>}>
          <TasksList tasksPromise={tasksPromise} refetchTasks={refetchTasks} />
          <Pagination
            tasksPaginated={paginatedTasksPromise}
            onPageChange={onPageChange}
          />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}

function UserPreview({ userId }: { userId: string }) {
  const { usersPromise } = useUsersGlobal();
  const users = use(usersPromise);

  return <span>{users.find((user) => user.id === userId)?.email}</span>;
}

function Pagination({
  tasksPaginated,
  onPageChange,
}: {
  tasksPaginated: Promise<PaginatedResponse<Task>>;
  onPageChange?: (page: number) => void;
}) {
  const [isLoading, startTransition] = useTransition();
  const { last, first, next, prev, pages, page } = use(tasksPaginated);

  const handlePageChange = (page: number) =>
    startTransition(() => onPageChange?.(page));
  return (
    <nav
      className={`${
        isLoading ? "opacity-50" : ""
      } flex items-center justify-between`}
    >
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => handlePageChange(1)}
          className="px-3 py-2 rounded-l"
          disabled={isLoading}
        >
          First ({first})
        </button>
        {prev && (
          <button
            onClick={() => handlePageChange(prev)}
            className="px-3 py-2 rounded-l"
            disabled={isLoading}
          >
            Prev ({prev})
          </button>
        )}
        {next && (
          <button
            onClick={() => handlePageChange(next)}
            className="px-3 py-2 rounded-l"
            disabled={isLoading}
          >
            Next ({next})
          </button>
        )}
        <button
          onClick={() => handlePageChange(pages)}
          className="px-3 py-2 rounded-l"
          disabled={isLoading}
        >
          Last ({last})
        </button>
      </div>
      <span className="text-sm">
        Page {page} of {pages}
      </span>
    </nav>
  );
}

export function CreateTaskForm({
  userId,
  refetchTasks,
}: {
  userId: string;
  refetchTasks: () => void;
}) {
  const [state, dispatch, isPending] = useActionState(
    createTaskAction({ refetchTasks, userId }),
    { title: "" },
  );
  return (
    <form className="flex gap-2" action={dispatch}>
      <input name="title" className="border rounded p-2" type="text" />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        type="submit"
        defaultValue={state.title}
        disabled={isPending}
      >
        Add
      </button>
      {state.error && <div className="text-red-500">{state.error}</div>}
    </form>
  );
}

export function TasksList({
  tasksPromise,
  refetchTasks,
}: {
  tasksPromise: Promise<Task[]>;
  refetchTasks: () => void;
}) {
  const tasks = use(tasksPromise);

  return (
    <div className="flex flex-col">
      {tasks.map((task) => (
        <TaskCard task={task} key={task.id} refetchTasks={refetchTasks} />
      ))}
    </div>
  );
}

export function TaskCard({
  task,
  refetchTasks,
}: {
  task: Task;
  refetchTasks: () => void;
}) {
  const [deleteState, handleDelete, isPending] = useActionState(
    deleteTaskAction({ refetchTasks }),
    {},
  );

  return (
    <div
      className="border p-2 m-2 rounded bg-gray-100 flex gap-2"
      key={task.id}
    >
      {task.title} -
      <Suspense fallback={<span>Loading...</span>}>
        <UserPreview userId={task.userId} />
      </Suspense>
      <form className="ml-auto" action={handleDelete}>
        <input type="hidden" name="id" value={task.id} />
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-auto disabled:bg-gray-400"
          type="submit"
          disabled={isPending}
        >
          Delete{" "}
          {deleteState.error && (
            <div className="text-red-500">{deleteState.error}</div>
          )}
        </button>
      </form>
    </div>
  );
}

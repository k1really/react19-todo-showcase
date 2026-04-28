import {
  startTransition,
  Suspense,
  use,
  useActionState,
  useMemo,
  useState,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import { fetchTasks, type Task } from "../../shared/api";
import { useParams } from "react-router-dom";
import { createTaskAction, deleteTaskAction } from "./actions";
import { useUsersGlobal } from "../../entities/user";

export function ToDoListPage() {
  const { userId = "" } = useParams();

  const [paginatedTasksPromise, setTasksPromise] = useState(() =>
    fetchTasks({ filters: { userId } }),
  );

  const tasksPromise = useMemo(
    () => paginatedTasksPromise.then((res) => res.data),
    [paginatedTasksPromise],
  );

  const refetchTasks = () =>
    startTransition(() => setTasksPromise(fetchTasks({ filters: { userId } })));

  return (
    <main className="container mx-auto p-4 pt-10 flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Tasks:</h1>
      <CreateTaskForm userId={userId} refetchTasks={refetchTasks} />
      <ErrorBoundary
        fallbackRender={(e) => (
          <div className="text-red-500">
            Something went wrong: {JSON.stringify(e)}
          </div>
        )}
      >
        <Suspense fallback={<div>Loading tasks...</div>}>
          <TasksList tasksPromise={tasksPromise} refetchTasks={refetchTasks} />
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

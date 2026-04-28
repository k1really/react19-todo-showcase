import { createTask, deleteTask, type Task } from "../../shared/api";

type CreateActionState = {
  error?: string;
  title: string;
};

export type CreateTaskAction = (
  state: CreateActionState,
  formData: FormData,
) => Promise<CreateActionState>;

export function createTaskAction({
  refetchTasks,
  userId,
}: {
  refetchTasks: () => void;
  userId: string;
}): CreateTaskAction {
  return async (_, formData) => {
    const title = formData.get("title") as string;

    try {
      const task: Task = {
        title,
        createdAt: Date.now(),
        done: false,
        userId,
        id: crypto.randomUUID(),
      };
      await createTask(task);

      refetchTasks();

      return {
        title: "",
      };
    } catch {
      return {
        title,
        error: "Error while creating task: ",
      };
    }
  };
}

type DeleteTaskActionState = {
  error?: string;
};

export type DeleteTaskAction = (
  state: DeleteTaskActionState,
  formData: FormData,
) => Promise<DeleteTaskActionState>;

export function deleteTaskAction({
  refetchTasks,
}: {
  refetchTasks: () => void;
}): DeleteTaskAction {
  return async (_, formData) => {
    const id = formData.get("id") as string;
    try {
      await deleteTask(id);
      refetchTasks();

      return {};
    } catch {
      return {
        error: "Error while deleting task: ",
      };
    }
  };
}

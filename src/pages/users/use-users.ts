import { use, useOptimistic } from "react";
import { type User } from "../../shared/api";
import { createUserAction, deleteUserAction } from "./actions";
import { useUsersGlobal } from "../../entities/user";

export function useUsers() {
  const { refetchUsers, usersPromise } = useUsersGlobal();

  const [createdUsers, optimisticCreate] = useOptimistic(
    [] as User[],
    (createdUsers, user: User) => [...createdUsers, user],
  );
  const [deletedUsersIds, optimisticDelete] = useOptimistic(
    [] as string[],
    (deletedUsers, userId: string) => deletedUsers.concat(userId),
  );

  const useUsersList = () => {
    const users = use(usersPromise);

    return users
      .concat(createdUsers)
      .filter((user) => !deletedUsersIds.includes(user.id));
  };

  return {
    createUserAction: createUserAction({ refetchUsers, optimisticCreate }),
    deleteUserAction: deleteUserAction({ refetchUsers, optimisticDelete }),
    useUsersList,
  };
}

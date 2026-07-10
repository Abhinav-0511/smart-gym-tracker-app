import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getLocalDateString } from "@/types/dashboard";
import {
  createTask,
  deleteTask,
  duplicateTask,
  fetchTasks,
  rescheduleTask,
  setTaskStatus,
  updateTask,
} from "@/features/productivity/services/tasks";
import type {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "@/features/productivity/types/task";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (userId: string, includeArchived: boolean) =>
    [...taskKeys.all, userId, { includeArchived }] as const,
};

export function useTasks(
  userId: string | undefined,
  timezone: string,
  includeArchived = false,
) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";
  const todayKey = getLocalDateString(new Date(), timezone);
  const listKey = taskKeys.list(resolvedUserId, includeArchived);

  const tasksQuery = useQuery({
    queryKey: listKey,
    queryFn: () => fetchTasks(resolvedUserId, { includeArchived }),
    enabled: Boolean(userId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: taskKeys.all });

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(resolvedUserId, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      updateTask(taskId, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: invalidate,
  });

  const duplicateMutation = useMutation({
    mutationFn: (task: Task) => duplicateTask(resolvedUserId, task),
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      setTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Task[]>(listKey);

      queryClient.setQueryData<Task[]>(listKey, (current) =>
        current?.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status,
                completedAt: status === "completed" ? new Date().toISOString() : null,
              }
            : task,
        ),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },
    onSettled: invalidate,
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ taskId, dueDate }: { taskId: string; dueDate: string | null }) =>
      rescheduleTask(taskId, dueDate),
    onMutate: async ({ taskId, dueDate }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Task[]>(listKey);

      queryClient.setQueryData<Task[]>(listKey, (current) =>
        current?.map((task) => (task.id === taskId ? { ...task, dueDate } : task)),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },
    onSettled: invalidate,
  });

  return {
    todayKey,
    tasksQuery,
    createMutation,
    updateMutation,
    deleteMutation,
    duplicateMutation,
    statusMutation,
    rescheduleMutation,
  };
}

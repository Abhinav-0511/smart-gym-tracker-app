import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { financeKeys } from "@/features/finance/hooks/keys";
import {
  createCategory,
  deleteCategory,
  ensureDefaultCategories,
  updateCategory,
} from "@/features/finance/services/categories";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/features/finance/types/category";

/**
 * Loads the user's categories, seeding the default catalogue on first use. All
 * finance pages read from this one cached query.
 */
export function useCategories(userId: string | undefined) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";

  const categoriesQuery = useQuery({
    queryKey: financeKeys.categories(resolvedUserId),
    queryFn: () => ensureDefaultCategories(resolvedUserId),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    networkMode: "offlineFirst",
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: financeKeys.categories(resolvedUserId) });

  const createMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: (input: CreateCategoryInput) => createCategory(resolvedUserId, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      updateCategory(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  });

  return { categoriesQuery, createMutation, updateMutation, deleteMutation };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getModuleListAction,
  getModuleItemAction,
  deleteModuleItemAction,
  hardDeleteModuleItemAction,
  restoreModuleItemAction,
  getDeletedModuleItemsAction,
  bulkModuleOperationAction,
  submitModuleForm,
} from "@repo/app-modules/server-actions";
import type {
  ModuleListParams,
  BulkOperationParams,
} from "@repo/app-modules/types";

// Query Keys
export const moduleKeys = {
  all: ["modules"] as const,
  lists: () => [...moduleKeys.all, "list"] as const,
  list: (module: string, params?: ModuleListParams) =>
    [...moduleKeys.lists(), module, JSON.stringify(params || {})] as const,
  details: () => [...moduleKeys.all, "detail"] as const,
  detail: (module: string, id: string) =>
    [...moduleKeys.details(), module, id] as const,
  schemas: () => [...moduleKeys.all, "schema"] as const,
  schema: (module: string) => [...moduleKeys.schemas(), module] as const,
};

// Custom Hooks
export function useModuleList<T = any>(
  module: string,
  params: ModuleListParams = {},
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
    initialData?: T[];
    placeholderData?: T[];
  }
) {
  return useQuery({
    queryKey: moduleKeys.list(module, params),
    queryFn: async () => {
      const result = await getModuleListAction<T>(module, params);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch module list");
      }
      return result.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    refetchInterval: options?.refetchInterval,
    initialData: options?.initialData,
    placeholderData: options?.placeholderData,
  });
}

export function useModuleItem<T = any>(
  module: string,
  id: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey: moduleKeys.detail(module, id),
    queryFn: async () => {
      const result = await getModuleItemAction<T>(module, id);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch module item");
      }
      return result.data;
    },
    enabled: (options?.enabled ?? true) && !!id,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateModuleItem(module: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) =>
      submitModuleForm(module, data, "create"),
    onSuccess: async () => {
      // Invalidate all queries for this specific module
      await queryClient.invalidateQueries({ 
        queryKey: [...moduleKeys.lists(), module],
        exact: false 
      });
    },
  });
}

export function useUpdateModuleItem(module: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      submitModuleForm(module, data, "update", id),
    onSuccess: async (_, { id }) => {
      // Invalidate all list queries for this module
      await queryClient.invalidateQueries({ 
        queryKey: [...moduleKeys.lists(), module],
        exact: false 
      });
      // Invalidate the specific item detail
      await queryClient.invalidateQueries({
        queryKey: moduleKeys.detail(module, id),
      });
    },
  });
}

export function useDeleteModuleItem(module: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteModuleItemAction(module, id),
    onSuccess: async () => {
      // Invalidate all list queries for this module
      await queryClient.invalidateQueries({ 
        queryKey: [...moduleKeys.lists(), module],
        exact: false 
      });
    },
  });
}

export function useHardDeleteModuleItem(module: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => hardDeleteModuleItemAction(module, id),
    onSuccess: async () => {
      // Invalidate all list queries for this module
      await queryClient.invalidateQueries({ 
        queryKey: [...moduleKeys.lists(), module],
        exact: false 
      });
      // Also invalidate deleted items list
      await queryClient.invalidateQueries({ 
        queryKey: [...moduleKeys.all, module, "deleted"],
        exact: false 
      });
    },
  });
}

export function useRestoreModuleItem(module: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreModuleItemAction(module, id),
    onSuccess: async () => {
      // Invalidate both main list and deleted items list
      await queryClient.invalidateQueries({ 
        queryKey: [...moduleKeys.lists(), module],
        exact: false 
      });
      await queryClient.invalidateQueries({ 
        queryKey: [...moduleKeys.all, module, "deleted"],
        exact: false 
      });
    },
  });
}

export function useDeletedModuleItems<T = any>(
  module: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: [...moduleKeys.all, module, "deleted"],
    queryFn: async () => {
      const result = await getDeletedModuleItemsAction<T>(module);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch deleted items");
      }
      return result.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    refetchInterval: options?.refetchInterval,
  });
}

export function useBulkModuleOperation(module: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: BulkOperationParams) =>
      bulkModuleOperationAction(
        module,
        params.operation,
        params.ids,
        params.data
      ),
    onSuccess: async (data, variables) => {
      // Invalidate all list queries for this module
      await queryClient.invalidateQueries({ 
        queryKey: [...moduleKeys.lists(), module],
        exact: false 
      });
      
      // If operation affects deleted items, also invalidate deleted items list
      if (variables.operation === 'restore' || variables.operation === 'hard-delete') {
        await queryClient.invalidateQueries({ 
          queryKey: [...moduleKeys.all, module, "deleted"],
          exact: false 
        });
      }
    },
  });
}

export function useModuleSchema(
  module: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  // This needs to be updated to use a server action like `getModuleSchemaAction`
  // For now, it's left as is to avoid breaking changes until the action is created.
  return useQuery({
    queryKey: moduleKeys.schema(module),
    queryFn: () => Promise.resolve(null), // Placeholder
    enabled: false, // Disabled until a proper server action is available
  });
}

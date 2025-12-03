import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getModuleListAction,
  getModuleItemAction,
  deleteModuleItemAction,
  hardDeleteModuleItemAction,
  restoreModuleItemAction,
  getDeletedModuleItemsAction,
  getDeletedModuleCountAction,
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
  list: (module: string, params?: ModuleListParams) => {
    // Normalize parameters for consistent cache keys
    const normalizedParams = normalizeModuleParams(params || {});

    // Create a more detailed cache key that includes stringified params
    // This ensures that any changes in filter values create a new cache entry
    const paramsString = JSON.stringify(normalizedParams);
    const cacheKey = [...moduleKeys.lists(), module, paramsString] as const;

    // Debug cache key generation in development
    console.log(`🔑 [CACHE-KEY] Module: ${module}`, {
      originalParams: params,
      normalizedParams,
      paramsString,
      cacheKey: cacheKey
    });

    return cacheKey;
  },
  details: () => [...moduleKeys.all, "detail"] as const,
  detail: (module: string, id: string) =>
    [...moduleKeys.details(), module, id] as const,
  schemas: () => [...moduleKeys.all, "schema"] as const,
  schema: (module: string) => [...moduleKeys.schemas(), module] as const,
};

/**
 * Normalizes module list parameters for consistent cache key generation
 * Ensures that functionally identical requests use the same cache key
 */
function normalizeModuleParams(params: ModuleListParams): ModuleListParams {
  const normalized: ModuleListParams = {};
  
  // Sort keys alphabetically for consistent JSON.stringify output
  const sortedKeys = Object.keys(params).sort();
  
  for (const key of sortedKeys) {
    const value = params[key as keyof ModuleListParams];
    
    // Skip undefined and null values to avoid cache key variations
    if (value === undefined || value === null) {
      continue;
    }
    
    // Handle different parameter types
    if (key === 'page' || key === 'limit') {
      // Convert to number and use default values to normalize
      const numValue = typeof value === 'string' ? parseInt(value, 10) : value as number;
      if (!isNaN(numValue) && numValue > 0) {
        normalized[key as keyof ModuleListParams] = numValue as any;
      }
    } else if (key === 'filters' && typeof value === 'object') {
      // Sort filter keys for consistent ordering
      const sortedFilters: Record<string, any> = {};
      const filterKeys = Object.keys(value as Record<string, any>).sort();
      for (const filterKey of filterKeys) {
        const filterValue = (value as Record<string, any>)[filterKey];
        if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
          sortedFilters[filterKey] = filterValue;
        }
      }
      // Only include filters if there are actual filter values
      if (Object.keys(sortedFilters).length > 0) {
        normalized.filters = sortedFilters;
      }
    } else {
      // For other parameters (sort, order, etc.), include as-is if not empty
      if (value !== '' && value !== undefined && value !== null) {
        normalized[key as keyof ModuleListParams] = value as any;
      }
    }
  }
  
  return normalized;
}

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
        // Create enhanced error with all metadata from ActionResponse
        const enhancedError: any = new Error(result.error || "Failed to fetch module list");
        enhancedError.statusCode = result.statusCode;
        enhancedError.errorCode = result.errorCode;
        enhancedError.category = result.errorCategory;
        enhancedError.traceId = result.traceId;
        enhancedError.userMessage = result.userMessage;
        enhancedError.backendMessage = result.backendMessage;
        enhancedError.recoveryActions = result.recoveryActions;
        throw enhancedError;
      }

      // Return both data and pagination metadata for server-side pagination support
      return {
        data: result.data || [],
        pagination: result.pagination
      };
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 10 * 60 * 1000, // Increased from 5 to 10 minutes for better caching
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on window focus
    refetchOnReconnect: 'always', // Refetch on network reconnection
    retry: (failureCount, error) => {
      // Custom retry logic - retry up to 2 times for network errors
      if (failureCount >= 2) return false;
      if (error instanceof Error && error.message.includes('fetch')) return true;
      return false;
    },
    initialData: options?.initialData ? { data: options.initialData, pagination: undefined } : undefined,
    placeholderData: options?.placeholderData ? { data: options.placeholderData, pagination: undefined } : undefined,
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
    mutationFn: async (id: string) => {
      const result = await deleteModuleItemAction(module, id);

      // Throw error if the action failed
      if (!result.success) {
        throw new Error(result.error || `Failed to delete ${module} item`);
      }

      return result;
    },
    onSuccess: async () => {
      // Invalidate and immediately refetch all list queries for this module
      await queryClient.invalidateQueries({
        queryKey: [...moduleKeys.lists(), module],
        exact: false,
        refetchType: 'all' // Force immediate refetch
      });
      // Also invalidate deleted count (soft delete adds to recycle bin)
      await queryClient.invalidateQueries({
        queryKey: [...moduleKeys.all, module, "deleted-count"],
        exact: false
      });
      // Also invalidate deleted items list
      await queryClient.invalidateQueries({
        queryKey: [...moduleKeys.all, module, "deleted"],
        exact: false
      });
    },
    onError: (error) => {
      console.error(`Delete mutation error for ${module}:`, error);
      // The error will be propagated to the component
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
      // Also invalidate deleted count
      await queryClient.invalidateQueries({
        queryKey: [...moduleKeys.all, module, "deleted-count"],
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
      // Also invalidate deleted count
      await queryClient.invalidateQueries({
        queryKey: [...moduleKeys.all, module, "deleted-count"],
        exact: false
      });
    },
  });
}

export function useDeletedModuleItems<T = any>(
  module: string,
  params: { page?: number; limit?: number } = {},
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: [...moduleKeys.all, module, "deleted", params],
    queryFn: async () => {
      const result = await getDeletedModuleItemsAction<T>(module, params);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch deleted items");
      }
      return {
        data: result.data || [],
        meta: result.meta,
      };
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    refetchInterval: options?.refetchInterval,
  });
}

export function useDeletedModuleCount(
  module: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: [...moduleKeys.all, module, "deleted-count"],
    queryFn: async () => {
      console.log(`🗑️ [useDeletedModuleCount] Fetching deleted count for module: ${module}`);
      const result = await getDeletedModuleCountAction(module);
      console.log(`🗑️ [useDeletedModuleCount] Result:`, result);
      if (!result.success) {
        console.error(`🗑️ [useDeletedModuleCount] Error:`, result.error);
        throw new Error(result.error || "Failed to fetch deleted count");
      }
      const count = result.data?.count || 0;
      console.log(`🗑️ [useDeletedModuleCount] Count:`, count);
      return count;
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 2 * 60 * 1000, // 2 minutes for count
    refetchInterval: options?.refetchInterval,
  });
}

export function useBulkModuleOperation(module: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: BulkOperationParams) => {
      const result = await bulkModuleOperationAction(
        module,
        params.operation,
        params.ids,
        params.data
      );
      
      // Throw error if the action failed
      if (!result.success) {
        throw new Error(result.error || `Failed to perform bulk ${params.operation}`);
      }
      
      return result;
    },
    onSuccess: async (data, variables) => {
      // Invalidate and immediately refetch all list queries for this module
      await queryClient.invalidateQueries({ 
        queryKey: [...moduleKeys.lists(), module],
        exact: false,
        refetchType: 'all' // Force immediate refetch
      });
      
      // If operation affects deleted items, also invalidate deleted items list
      if (variables.operation === 'restore' || variables.operation === 'hard-delete') {
        await queryClient.invalidateQueries({ 
          queryKey: [...moduleKeys.all, module, "deleted"],
          exact: false,
          refetchType: 'all' // Force immediate refetch
        });
      }
    },
    onError: (error, variables) => {
      console.error(`Bulk ${variables.operation} mutation error for ${module}:`, error);
      // The error will be propagated to the component
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

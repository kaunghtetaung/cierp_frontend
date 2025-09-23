'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { apiClient } from './api-client'

export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
}

/**
 * Generic server action for module operations
 */
export async function submitModuleForm(
  moduleSlug: string,
  formData: FormData,
  validationSchema: z.ZodSchema,
  action: 'create' | 'update',
  id?: string
): Promise<ActionResponse> {
  try {
    // Convert FormData to object
    const data = Object.fromEntries(formData.entries())
    
    // Handle nested object fields (e.g., displayName.en)
    const processedData: Record<string, any> = {}
    Object.entries(data).forEach(([key, value]) => {
      if (key.includes('.')) {
        const [parentKey, childKey] = key.split('.')
        if (!processedData[parentKey]) {
          processedData[parentKey] = {}
        }
        processedData[parentKey][childKey] = value
      } else {
        processedData[key] = value
      }
    })

    // Validate data
    const validationResult = validationSchema.safeParse(processedData)
    
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {}
      validationResult.error.errors.forEach((error) => {
        const path = error.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(error.message)
      })
      
      return {
        success: false,
        errors
      }
    }

    // Call API endpoint with authentication
    const endpoint = action === 'create' 
      ? `/modules/${moduleSlug}`
      : `/modules/${moduleSlug}/${id}`
    
    const response = action === 'create'
      ? await apiClient.post(endpoint, validationResult.data)
      : await apiClient.put(endpoint, validationResult.data)

    if (!response.success) {
      return {
        success: false,
        error: response.error || `Failed to ${action} ${moduleSlug}`
      }
    }

    const result = response.data

    // Revalidate the module list page
    revalidatePath(`/${moduleSlug}`)
    
    if (action === 'create') {
      // Redirect to the module list page after creation
      redirect(`/${moduleSlug}`)
    }

    return {
      success: true,
      data: result
    }
    
  } catch (error) {
    console.error(`Error in ${action} ${moduleSlug}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to ${action} ${moduleSlug}`
    }
  }
}

/**
 * Delete module item
 */
export async function deleteModuleItem(
  moduleSlug: string,
  id: string
): Promise<ActionResponse> {
  try {
    const response = await apiClient.delete(`/modules/${moduleSlug}/${id}`)

    if (!response.success) {
      return {
        success: false,
        error: response.error || `Failed to delete ${moduleSlug} item`
      }
    }

    // Revalidate the module list page
    revalidatePath(`/${moduleSlug}`)

    return {
      success: true
    }
    
  } catch (error) {
    console.error(`Error deleting ${moduleSlug} item:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete ${moduleSlug} item`
    }
  }
}

/**
 * Bulk operations
 */
export async function bulkModuleOperation(
  moduleSlug: string,
  operation: 'delete' | 'update',
  ids: string[],
  updateData?: Record<string, any>
): Promise<ActionResponse> {
  try {
    const response = await apiClient.post(`/modules/${moduleSlug}/bulk`, {
      operation,
      ids,
      data: updateData
    })

    if (!response.success) {
      return {
        success: false,
        error: response.error || `Failed to perform bulk ${operation}`
      }
    }

    const result = response.data

    // Revalidate the module list page
    revalidatePath(`/${moduleSlug}`)

    return {
      success: true,
      data: result
    }
    
  } catch (error) {
    console.error(`Error in bulk ${operation}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to perform bulk ${operation}`
    }
  }
}

/**
 * Execute extra action forms
 */
export async function executeExtraAction(
  moduleSlug: string,
  actionKey: string,
  id: string,
  formData?: FormData
): Promise<ActionResponse> {
  try {
    // Convert FormData to object if provided
    const data = formData ? Object.fromEntries(formData.entries()) : {}

    const response = await apiClient.post(
      `/modules/${moduleSlug}/${id}/actions/${actionKey}`,
      data
    )

    if (!response.success) {
      return {
        success: false,
        error: response.error || `Failed to execute ${actionKey}`
      }
    }

    const result = response.data

    // Revalidate both item and list pages
    revalidatePath(`/${moduleSlug}`)
    revalidatePath(`/${moduleSlug}/${id}`)

    return {
      success: true,
      data: result
    }
    
  } catch (error) {
    console.error(`Error executing ${actionKey}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to execute ${actionKey}`
    }
  }
}
export interface ModuleListParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  filters?: Record<string, Record<string, any>> // e.g., { name: { $regex: "test" }, type: { $eq: "client" } }
}

export interface ModuleListResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  meta?: {
    filters: Record<string, any>
    sort: {
      field: string
      direction: 'asc' | 'desc'
    }
  }
}

export interface BulkOperationParams {
  operation: 'delete' | 'hard-delete' | 'restore' | 'update'
  ids: string[]
  data?: any
}

export interface ExtraActionParams {
  actionKey: string
  id: string
  data?: any
}